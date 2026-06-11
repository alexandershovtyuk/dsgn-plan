// Pure render functions. Take data, return HTML strings.
// No export keyword — concatenated into bundle during build.

const MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
const NOW_MONTH = new Date().getMonth() // 0-based

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderHeader() {
  const qColors = ['bg-slate-400','bg-slate-500','bg-slate-600','bg-slate-800']
  const qLabels = ['Q1','Q2','Q3','Q4']

  return `
    <div class="grid grid-cols-[300px_1fr] mb-0">
      <div></div>
      <div>
        <div class="grid grid-cols-4 gap-1 mb-1.5">
          ${qLabels.map((q, i) => `
            <div class="text-xs font-bold text-white ${qColors[i]} rounded-full py-1.5 text-center">${q}</div>
          `).join('')}
        </div>
        <div class="grid grid-cols-12 mb-4">
          ${MONTHS.map((m, i) => `
            <div class="text-[10px] text-center pb-1 ${i === NOW_MONTH ? 'text-red-500 font-bold' : 'text-slate-400'}">
              ${m}${i === NOW_MONTH ? '<br>▼' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>`
}

function quarterToColumns(quarter) {
  if (!quarter) return null
  const map = { Q1:[0,2], Q2:[3,5], Q3:[6,8], Q4:[9,11] }
  const range = quarter.toString().split('-')
  if (range.length === 2) {
    const s = map[range[0].trim()]
    const e = map[range[1].trim()]
    if (!s || !e) { console.warn(`Unknown quarter range: ${quarter}`); return null }
    return { start: s[0], end: e[1] }
  }
  const col = map[quarter.trim()]
  if (!col) { console.warn(`Unknown quarter: ${quarter}`); return null }
  return { start: col[0], end: col[1] }
}

function isInFuture(endCol) {
  const quarterEndMonth = [2, 5, 8, 11]
  return quarterEndMonth[Math.floor(endCol / 3)] > NOW_MONTH
}

function getEndLabel(quarter) {
  if (!quarter) return ''
  const parts = quarter.toString().split('-')
  return parts[parts.length - 1].trim()
}

// Converts 6-digit hex color to OKLCH { L, C, H }
function hexToOklch(hex) {
  const r = parseInt(hex.slice(1,3), 16) / 255
  const g = parseInt(hex.slice(3,5), 16) / 255
  const b = parseInt(hex.slice(5,7), 16) / 255
  const lin = c => c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055) ** 2.4
  const [rl, gl, bl] = [lin(r), lin(g), lin(b)]
  const l = Math.cbrt(0.4122214708*rl + 0.5363325363*gl + 0.0514459929*bl)
  const m = Math.cbrt(0.2119034982*rl + 0.6806995451*gl + 0.1073969566*bl)
  const s = Math.cbrt(0.0883024619*rl + 0.2817188376*gl + 0.6299787005*bl)
  const L =  0.2104542553*l + 0.7936177850*m - 0.0040720468*s
  const a = +1.9779984951*l - 2.4285922050*m + 0.4505937099*s
  const B = +0.0259040371*l + 0.7827717662*m - 0.8086757660*s
  const C = Math.sqrt(a*a + B*B)
  const H = Math.atan2(B, a) * 180 / Math.PI
  return { L, C, H: H < 0 ? H+360 : H }
}

// Build oklch() CSS value. l = absolute lightness (0–1), c = C multiplier (0–1), alpha = optional
function ok(lch, l, c = 1, alpha) {
  const L = +(Math.max(0, Math.min(1, l !== undefined ? l : lch.L))).toFixed(3)
  const C = +(lch.C * c).toFixed(4)
  const H = +lch.H.toFixed(2)
  return alpha !== undefined
    ? `oklch(${L} ${C} ${H} / ${alpha})`
    : `oklch(${L} ${C} ${H})`
}

function renderGanttBar(quarter, color) {
  const lch = hexToOklch(color)
  const cols = quarterToColumns(quarter)
  if (!cols) {
    return `<div class="col-span-12 h-6 rounded bg-slate-200 flex items-center px-3">
      <span class="text-[10px] text-slate-400">срок не определён</span></div>`
      + Array(11).fill('<div class="h-6"></div>').join('')
  }
  return Array.from({ length: 12 }, (_, i) => {
    const active = i >= cols.start && i <= cols.end
    const isStart = i === cols.start
    const isEnd = i === cols.end
    const opacity = isInFuture(cols.end) ? 'opacity-40' : ''
    if (active) {
      return `<div class="h-6 ${isStart ? 'rounded-l' : ''} ${isEnd ? 'rounded-r-lg' : ''} ${opacity} relative" style="background:${ok(lch)}">
        ${isEnd ? `<span class="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white">${escapeHtml(getEndLabel(quarter))}</span>` : ''}
      </div>`
    }
    return `<div class="h-6"></div>`
  }).join('')
}

function renderTeamSummaryBar(team, color) {
  const lch = hexToOklch(color)
  const allQuarters = (team.tracks || [])
    .flatMap(t => (t.objectives || []).map(o => o.quarter).filter(Boolean))
  if (allQuarters.length === 0) return Array(12).fill(`<div class="h-3"></div>`).join('')

  const cols = allQuarters.map(q => quarterToColumns(q)).filter(Boolean)
  const start = Math.min(...cols.map(c => c.start))
  const end = Math.max(...cols.map(c => c.end))

  return Array.from({ length: 12 }, (_, i) => {
    const active = i >= start && i <= end
    if (active) return `<div class="h-3 ${i===start?'rounded-l':''} ${i===end?'rounded-r':''}" style="background:${ok(lch)}"></div>`
    return `<div class="h-3"></div>`
  }).join('')
}

function renderTrackBar(track, color) {
  const lch = hexToOklch(color)
  const allQ = (track.objectives || []).map(o => o.quarter).filter(Boolean)
  if (allQ.length === 0) return Array(12).fill('<div class="h-0.5"></div>').join('')
  const cols = allQ.map(q => quarterToColumns(q)).filter(Boolean)
  const start = Math.min(...cols.map(c => c.start))
  const end = Math.max(...cols.map(c => c.end))
  return Array.from({ length: 12 }, (_, i) => {
    const active = i >= start && i <= end
    if (active) return `<div class="h-0.5 ${i===start?'rounded-l-full':''} ${i===end?'rounded-r-full':''}" style="background:${ok(lch)}"></div>`
    return `<div class="h-0.5"></div>`
  }).join('')
}

function renderObjectiveCard(obj, color) {
  const lch = hexToOklch(color)
  const krHtml = (obj.key_results || []).map(kr => `
    <div class="flex items-start gap-2.5 py-2 border-t border-slate-100 text-xs text-slate-500">
      <div class="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style="background:${ok(lch)}"></div>
      <div>
        <span class="font-medium text-slate-700">${escapeHtml(kr.title)}</span>
        ${kr.description ? `<div class="text-slate-400 mt-0.5">${escapeHtml(kr.description)}</div>` : ''}
      </div>
    </div>`).join('')

  return `
    <div class="bg-white border border-slate-200 rounded-lg p-4 mt-1 mb-2 ml-8 shadow-sm">
      ${krHtml ? `<div><div class="text-xs font-semibold text-slate-700 mb-1">Key Results</div>${krHtml}</div>` : ''}
    </div>`
}

function renderKPI(kpis, color) {
  if (!kpis?.length) return ''
  const lch = hexToOklch(color)
  return `
    <div class="border-t-2 border-slate-100 bg-slate-50 px-6 py-5">
      <div class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">KPI</div>
      <div class="flex flex-wrap gap-3">
        ${kpis.map(kpi => `
          <div class="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-xl p-4">
            <div class="text-sm font-semibold text-slate-800 mb-1">${escapeHtml(kpi.name)}</div>
            <div class="text-xs text-slate-400 mb-3 leading-relaxed">${escapeHtml(kpi.description || '')}</div>
            ${kpi.target ? `<div class="text-2xl font-bold" style="color:${ok(lch, 0.45)}">${escapeHtml(kpi.target)}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>`
}

function plural(n, one, few, many) {
  const mod10 = n % 10, mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if ([2,3,4].includes(mod10) && ![12,13,14].includes(mod100)) return few
  return many
}

function slugify(str) {
  const map = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' }
  return str.toLowerCase().split('').map(c => map[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const BOARD_GRID    = 'display:grid;grid-template-columns:1fr 64px 64px 64px 64px 24px 64px 64px 64px 64px;align-items:center;column-gap:4px;'
const EXP_BODY_GRID = 'display:grid;grid-template-columns:40% repeat(4,1fr);align-items:stretch;'

function quarterRange(quarter) {
  if (!quarter) return null
  const map = { Q1: 0, Q2: 1, Q3: 2, Q4: 3 }
  const parts = quarter.toString().split('-')
  const s = map[parts[0].trim()]
  if (s === undefined) return null
  if (parts.length === 2) {
    const e = map[parts[1].trim()]
    if (e === undefined) return null
    return { start: s, end: e }
  }
  return { start: s, end: s }
}

function trackQuarterRange(track) {
  const ranges = (track.objectives || []).map(o => quarterRange(o.quarter)).filter(Boolean)
  if (!ranges.length) return null
  return { start: Math.min(...ranges.map(r => r.start)), end: Math.max(...ranges.map(r => r.end)) }
}

function renderTeamBoardHeader() {
  const metrics = [
    { label: 'треки',      tip: 'Стратегические направления работы команды' },
    { label: 'цели',       tip: 'Конкретные задачи на квартал (Objectives)' },
    { label: 'результаты', tip: 'Измеримые метрики достижения целей (Key Results)' },
    { label: 'KPI',        tip: 'Постоянные показатели эффективности команды' },
  ]
  return `
    <div style="${BOARD_GRID}padding:6px 0 10px 0;">
      <div></div>
      <div style="grid-column:span 4;" class="flex items-center justify-center gap-3 text-[11px] text-slate-400">
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-2 h-2 rounded-sm bg-slate-300"></span>нет целей
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-2 h-2 rounded-sm" style="background:rgba(99,102,241,0.35);"></span>запланирован
        </span>
        <span class="flex items-center gap-1.5">
          <span class="inline-block w-2 h-2 rounded-sm bg-indigo-500"></span>выполняется
        </span>
      </div>
      <div></div>
      ${metrics.map(m => `
        <div class="relative group text-[11px] text-slate-400 font-medium text-center cursor-default
                    underline decoration-dashed decoration-slate-300 underline-offset-4 hover:text-slate-600">
          ${escapeHtml(m.label)}
          <span class="absolute invisible opacity-0 group-hover:visible group-hover:opacity-100
                       bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none
                       max-w-[14rem] text-center leading-snug
                       bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-xl z-10 transition-opacity">
            ${escapeHtml(m.tip)}
          </span>
        </div>`).join('')}
    </div>`
}

function buildTeamHeaderRow(team, color) {
  const currentQ = Math.floor(NOW_MONTH / 3)
  const lch = hexToOklch(color)

  const qBlocks = [0,1,2,3].map(qi => {
    const qStart = qi * 3, qEnd = qi * 3 + 2
    const count = (team.tracks || [])
      .flatMap(t => t.objectives || [])
      .filter(o => { const c = quarterToColumns(o.quarter); return c && c.start <= qEnd && c.end >= qStart })
      .length
    const isFuture = qi > currentQ
    if (count === 0) {
      return `<div style="padding:5px 0;border-radius:10px;text-align:center;background:rgba(0,0,0,0.04);">
        <div class="text-[10px] font-bold tracking-wide" style="color:#d1d5db;">Q${qi+1}</div>
        <div class="text-base font-bold leading-tight" style="color:#d1d5db;">—</div>
        <div class="text-[9px]" style="color:#d1d5db;">целей</div>
      </div>`
    }
    const textColor = isFuture ? ok(lch, 0.68, 0.55) : ok(lch, 0.45)
    const subColor  = isFuture ? ok(lch, 0.72, 0.40) : ok(lch, 0.55, 0.75)
    const bg        = isFuture ? ok(lch, 0.985, 0.10)        : ok(lch, 0.970, 0.22)
    const border    = `1px solid ${isFuture ? ok(lch, 0.930, 0.28) : ok(lch, 0.875, 0.45)}`
    const word      = plural(count, 'цель', 'цели', 'целей')
    return `<div style="padding:5px 0;border-radius:10px;text-align:center;background:${bg};border:${border};">
      <div class="text-[10px] font-bold tracking-wide" style="color:${textColor};">Q${qi+1}</div>
      <div class="text-base font-bold leading-tight" style="color:${textColor};">${count}</div>
      <div class="text-[9px]" style="color:${subColor};">${word}</div>
    </div>`
  }).join('')

  const trackCount = team.tracks?.length || 0
  const objCount   = (team.tracks || []).reduce((s,t) => s + (t.objectives?.length || 0), 0)
  const krCount    = (team.tracks || []).flatMap(t => t.objectives || []).reduce((s,o) => s + (o.key_results?.length || 0), 0)
  const kpiCount   = team.kpis?.length || 0

  return `
    <div style="${BOARD_GRID}padding:10px 0;overflow:hidden;">
      <div class="flex items-center gap-3 px-4 overflow-hidden">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
             style="background:${ok(lch)}">
          ${escapeHtml(team.team.slice(0,2).toUpperCase())}
        </div>
        <div class="min-w-0">
          <div class="text-sm font-semibold text-slate-900 leading-tight truncate">${escapeHtml(team.team)}</div>
          <div class="text-xs text-slate-400 truncate mt-0.5">${escapeHtml(team.owner || '')}</div>
        </div>
      </div>
      ${qBlocks}
      <div></div>
      <div class="text-center text-[15px] text-slate-500">${trackCount}</div>
      <div class="text-center text-[15px] text-slate-500">${objCount}</div>
      <div class="text-center text-[15px] text-slate-500">${krCount}</div>
      <div class="text-center text-[15px] text-slate-500">${kpiCount}</div>
    </div>`
}

function renderCollapsedTeamCard(team) {
  const color = team.display?.color || '#6366f1'
  return `
    <div class="team-island mb-2 rounded-2xl overflow-hidden cursor-pointer bg-white transition-all duration-150 hover:shadow-[0_2px_16px_rgba(0,0,0,0.07)]"
         data-action="toggle-team" data-slug="${escapeHtml(team.slug)}">
      ${buildTeamHeaderRow(team, color)}
    </div>`
}

function renderTeamIsland(team, { expanded = false } = {}) {
  if (!expanded) return renderCollapsedTeamCard(team)

  const color = team.display?.color || '#6366f1'
  const lch = hexToOklch(color)
  const currentQ = Math.floor(NOW_MONTH / 3)

  const tracksHtml = (team.tracks || []).map(track => {
    const objectivesHtml = (track.objectives || []).map(obj => {
      const oRange = quarterRange(obj.quarter)
      const objId = slugify(obj.title)
      const isFuture = oRange ? oRange.start > currentQ : false
      const qPillBg    = isFuture ? ok(lch, 0.985, 0.12) : ok(lch, 0.970, 0.22)
      const qPillColor = isFuture ? ok(lch, 0.68, 0.55) : ok(lch, 0.45)
      const qPill = obj.quarter
        ? `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0"
                style="background:${qPillBg};color:${qPillColor}">${escapeHtml(obj.quarter)}</span>`
        : ''

      return `
        <div class="objective-block" data-obj-id="${objId}">
          <div class="bg-white rounded-lg flex items-center gap-3 px-3 py-2.5 cursor-pointer
                      hover:bg-slate-50 transition-colors duration-100"
               data-action="toggle-obj" data-obj-id="${objId}">
            <div class="text-sm font-medium text-slate-800 leading-snug flex-1">${escapeHtml(obj.title)}</div>
            ${qPill}
          </div>
          <div class="obj-card hidden">${renderObjectiveCard(obj, color)}</div>
        </div>`
    }).join('')

    return `
      <div class="track-block px-3 pb-3 first:pt-3">
        <div class="rounded-xl p-3" style="background:${ok(lch, 0.955, 0.15)}">
          <div class="text-[9px] font-semibold uppercase tracking-widest mb-1 px-1"
               style="color:${ok(lch, 0.62, 0.55)}">${escapeHtml(track.name)}</div>
          <div class="text-sm font-semibold leading-snug mb-2.5 px-1"
               style="color:${ok(lch, 0.42)}">${escapeHtml(track.goal || '')}</div>
          <div class="flex flex-col gap-1">
            ${objectivesHtml}
          </div>
        </div>
      </div>`
  }).join('')

  const kpiHtml = renderKPI(team.kpis, color)

  return `
    <div class="team-island mb-2 bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.07)] overflow-hidden"
         data-slug="${escapeHtml(team.slug)}">
      <div class="cursor-pointer hover:bg-slate-50 transition-colors duration-150"
           data-action="toggle-team" data-slug="${escapeHtml(team.slug)}">
        ${buildTeamHeaderRow(team, color)}
      </div>
      <div class="border-t border-slate-100">
        ${tracksHtml}
      </div>
      ${kpiHtml}
    </div>`
}
