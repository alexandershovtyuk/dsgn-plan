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

function renderGanttBar(quarter, color) {
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
      return `<div class="h-6 ${isStart ? 'rounded-l' : ''} ${isEnd ? 'rounded-r-lg' : ''} ${opacity} relative" style="background:${escapeHtml(color)}">
        ${isEnd ? `<span class="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white">${escapeHtml(getEndLabel(quarter))}</span>` : ''}
      </div>`
    }
    return `<div class="h-6"></div>`
  }).join('')
}

function renderTeamSummaryBar(team, color) {
  const allQuarters = (team.tracks || [])
    .flatMap(t => (t.objectives || []).map(o => o.quarter).filter(Boolean))
  if (allQuarters.length === 0) return Array(12).fill(`<div class="h-3"></div>`).join('')

  const cols = allQuarters.map(q => quarterToColumns(q)).filter(Boolean)
  const start = Math.min(...cols.map(c => c.start))
  const end = Math.max(...cols.map(c => c.end))

  return Array.from({ length: 12 }, (_, i) => {
    const active = i >= start && i <= end
    if (active) return `<div class="h-3 ${i===start?'rounded-l':''} ${i===end?'rounded-r':''}" style="background:${escapeHtml(color)}"></div>`
    return `<div class="h-3"></div>`
  }).join('')
}

function renderTrackBar(track, color) {
  const allQ = (track.objectives || []).map(o => o.quarter).filter(Boolean)
  if (allQ.length === 0) return Array(12).fill('<div class="h-0.5"></div>').join('')
  const cols = allQ.map(q => quarterToColumns(q)).filter(Boolean)
  const start = Math.min(...cols.map(c => c.start))
  const end = Math.max(...cols.map(c => c.end))
  return Array.from({ length: 12 }, (_, i) => {
    const active = i >= start && i <= end
    if (active) return `<div class="h-0.5 ${i===start?'rounded-l-full':''} ${i===end?'rounded-r-full':''}" style="background:${escapeHtml(color)}"></div>`
    return `<div class="h-0.5"></div>`
  }).join('')
}

function renderObjectiveCard(obj, color) {
  const krHtml = (obj.key_results || []).map(kr => `
    <div class="flex items-start gap-2.5 py-2 border-t border-slate-100 text-xs text-slate-500">
      <div class="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style="background:${escapeHtml(color)}"></div>
      <div>
        <span class="font-medium text-slate-700">${escapeHtml(kr.title)}</span>
        ${kr.target ? `<span class="ml-1.5 text-slate-400">→ ${escapeHtml(kr.target)}</span>` : ''}
        ${kr.description ? `<div class="text-slate-400 mt-0.5">${escapeHtml(kr.description)}</div>` : ''}
      </div>
    </div>`).join('')

  return `
    <div class="bg-white border border-slate-200 rounded-lg p-4 mt-1 mb-2 ml-8 shadow-sm">
      <div class="font-semibold text-slate-900 mb-2">${escapeHtml(obj.title)}</div>
      ${obj.description ? `<div class="text-xs text-slate-500 mb-3 leading-relaxed">${escapeHtml(obj.description)}</div>` : ''}
      <div class="text-xs text-slate-400 flex flex-wrap gap-x-5 gap-y-1 mb-2">
        ${obj.prerequisites ? `<span><strong class="text-slate-600">Требует:</strong> ${escapeHtml(obj.prerequisites)}</span>` : ''}
        ${obj.dependencies ? `<span><strong class="text-slate-600">Зависит от:</strong> ${escapeHtml(obj.dependencies)}</span>` : ''}
      </div>
      ${krHtml ? `<div class="mt-3"><div class="text-xs font-semibold text-slate-700 mb-1">Key Results</div>${krHtml}</div>` : ''}
    </div>`
}

function renderKPI(kpis, color) {
  if (!kpis?.length) return ''
  return `
    <div class="border-t-2 border-slate-100 bg-slate-50 px-6 py-5">
      <div class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">KPI</div>
      <div class="flex flex-wrap gap-3">
        ${kpis.map(kpi => `
          <div class="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-xl p-4">
            <div class="text-sm font-semibold text-slate-800 mb-1">${escapeHtml(kpi.name)}</div>
            <div class="text-xs text-slate-400 mb-3 leading-relaxed">${escapeHtml(kpi.description || '')}</div>
            <div class="text-2xl font-bold" style="color:${escapeHtml(color)}">${escapeHtml(kpi.target)}</div>
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

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const BOARD_GRID = 'display:grid;grid-template-columns:1fr 64px 64px 64px 64px 24px 64px 64px 64px 64px;align-items:center;column-gap:4px;'

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
                       bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap
                       bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-xl z-10 transition-opacity">
            ${escapeHtml(m.tip)}
          </span>
        </div>`).join('')}
    </div>`
}

function renderCollapsedTeamCard(team) {
  const color = team.display?.color || '#6366f1'
  const currentQ = Math.floor(NOW_MONTH / 3)

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
    const textColor = isFuture ? hexToRgba(color, 0.45) : color
    const subColor  = isFuture ? hexToRgba(color, 0.35) : hexToRgba(color, 0.7)
    const bg        = hexToRgba(color, isFuture ? 0.06 : 0.1)
    const border    = `1px solid ${hexToRgba(color, isFuture ? 0.25 : 0.4)}`
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
    <div class="team-island rounded-2xl cursor-pointer transition-colors duration-150 hover:bg-white"
         data-slug="${escapeHtml(team.slug)}" data-action="toggle-team"
         style="${BOARD_GRID}padding:10px 0;overflow:hidden;">
      <div class="flex items-center gap-3 px-4 overflow-hidden">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
             style="background:${escapeHtml(color)}">
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

function renderTeamIsland(team, { expanded = false, showKR = false } = {}) {
  if (!expanded) return renderCollapsedTeamCard(team)

  const color = team.display?.color || '#6366f1'
  const summaryBar = renderTeamSummaryBar(team, color)

  const headerHtml = `
    <div class="grid grid-cols-[300px_1fr] cursor-pointer" data-action="toggle-team" data-slug="${escapeHtml(team.slug)}">
      <div class="flex items-center gap-3 px-4 py-3.5 bg-white border border-slate-200 border-b-slate-100 rounded-tl-xl border-r-0">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0" style="background:${escapeHtml(color)}">
          ${escapeHtml(team.team.slice(0,2).toUpperCase())}
        </div>
        <div class="min-w-0">
          <div class="text-sm font-semibold text-slate-900 leading-tight truncate">${escapeHtml(team.team)}</div>
          <div class="text-xs text-slate-400 truncate mt-0.5">${escapeHtml(team.owner || '')}</div>
        </div>
        <svg class="ml-auto shrink-0 w-4 h-4 text-slate-300 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </div>
      <div class="bg-white border border-slate-200 border-b-slate-100 rounded-tr-xl border-l-0 grid grid-cols-12 gap-1 px-2 items-center">
        ${summaryBar}
      </div>
    </div>`

  const monthHeaderHtml = `
    <div class="grid grid-cols-[300px_1fr] bg-white border-b border-slate-100">
      <div></div>
      <div class="grid grid-cols-12 px-2">
        ${MONTHS.map((m, i) => `
          <div class="text-[10px] text-center py-1 ${i === NOW_MONTH ? 'text-red-500 font-bold' : 'text-slate-400'}">
            ${m}${i === NOW_MONTH ? '<br>▼' : ''}
          </div>`).join('')}
      </div>
    </div>`

  // Expanded state
  const tracksHtml = (team.tracks || []).map(track => {
    const trackBar = renderTrackBar(track, color)
    const objectivesHtml = (track.objectives || []).map(obj => {
      const bar = renderGanttBar(obj.quarter, color)
      const objId = slugify(obj.title)
      const krRows = showKR ? (obj.key_results || []).map(kr => `
        <div class="grid grid-cols-[300px_1fr] items-center min-h-[28px]">
          <div class="flex items-center gap-2 pl-12 pr-4 py-1">
            <div class="w-1 h-1 rounded-full shrink-0" style="background:${escapeHtml(color)}"></div>
            <div class="text-xs text-slate-400 leading-tight">${escapeHtml(kr.title)}</div>
          </div>
          <div class="grid grid-cols-12 gap-1 px-2"></div>
        </div>`).join('') : ''

      return `
        <div class="objective-block" data-obj-id="${objId}">
          <div class="grid grid-cols-[300px_1fr] items-center min-h-[44px] hover:bg-slate-50 cursor-pointer border-t border-slate-100" data-action="toggle-obj" data-obj-id="${objId}">
            <div class="pl-8 pr-4 py-2.5">
              <div class="text-xs font-medium text-slate-800 leading-snug">${escapeHtml(obj.title)}</div>
              ${obj.description ? `<div class="text-[10px] text-slate-400 mt-0.5 line-clamp-1 leading-snug">${escapeHtml(obj.description)}</div>` : ''}
            </div>
            <div class="grid grid-cols-12 gap-1 px-2 items-center">
              ${bar}
            </div>
          </div>
          <div class="obj-card hidden">${renderObjectiveCard(obj, color)}</div>
          ${krRows}
        </div>`
    }).join('')

    return `
      <div class="track-block">
        <div class="grid grid-cols-[300px_1fr] items-start bg-slate-50 border-t border-slate-200">
          <div class="px-4 py-3">
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Трек · ${escapeHtml(track.name)}</span>
            <span class="text-xs text-slate-500 italic leading-snug">${escapeHtml(track.goal || '')}</span>
          </div>
          <div class="grid grid-cols-12 gap-1 px-2 items-center py-3">
            ${trackBar}
          </div>
        </div>
        <div>
          ${objectivesHtml}
        </div>
      </div>`
  }).join('')

  const kpiHtml = renderKPI(team.kpis, color)

  return `
    <div class="team-island mb-6" data-slug="${escapeHtml(team.slug)}">
      ${headerHtml}
      <div class="border border-slate-200 border-t-0 rounded-b-xl overflow-hidden">
        ${monthHeaderHtml}
        ${tracksHtml}
        ${kpiHtml}
      </div>
    </div>`
}
