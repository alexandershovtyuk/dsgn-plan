// Called from app.js before render.
// If AUTH_HASH === null — protection is disabled.
// Hash verified client-side via SubtleCrypto (SHA-256).

async function requireAuth(onSuccess) {
  if (typeof AUTH_HASH === 'undefined' || AUTH_HASH === null) {
    onSuccess()
    return
  }

  if (sessionStorage.getItem('auth') === AUTH_HASH) {
    onSuccess()
    return
  }

  renderAuthScreen(onSuccess)
}

function renderAuthScreen(onSuccess) {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-slate-50">
      <div class="bg-white rounded-xl border border-slate-200 p-8 w-80 shadow-sm">
        <div class="text-sm font-semibold text-slate-900 mb-1">Дизайн-планы · Финам</div>
        <div class="text-xs text-slate-400 mb-6">Введите пароль для доступа</div>
        <input id="pwd-input" type="password"
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-slate-400 mb-3"
          placeholder="Пароль" autofocus>
        <div id="pwd-error" class="text-xs text-red-500 mb-3 hidden">Неверный пароль</div>
        <button id="pwd-btn"
          class="w-full bg-slate-900 text-white text-sm font-medium py-2 rounded-full hover:bg-slate-700 transition-colors">
          Войти
        </button>
      </div>
    </div>`

  const input = document.getElementById('pwd-input')
  const btn = document.getElementById('pwd-btn')
  const error = document.getElementById('pwd-error')

  async function attempt() {
    const hash = await sha256(input.value)
    if (hash === AUTH_HASH) {
      sessionStorage.setItem('auth', hash)
      onSuccess()
    } else {
      error.classList.remove('hidden')
      input.value = ''
      input.focus()
    }
  }

  btn.addEventListener('click', attempt)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt() })
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

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
    <div class="grid grid-cols-[240px_1fr] mb-0">
      <div></div>
      <div>
        <div class="grid grid-cols-4 gap-1 mb-1">
          ${qLabels.map((q, i) => `
            <div class="text-[10px] font-bold text-white ${qColors[i]} rounded-full py-1 text-center">${q}</div>
          `).join('')}
        </div>
        <div class="grid grid-cols-12 mb-3">
          ${MONTHS.map((m, i) => `
            <div class="text-[9px] text-center pb-1 ${i === NOW_MONTH ? 'text-red-500 font-bold' : 'text-slate-400'}">
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
    return `<div class="col-span-12 h-5 rounded bg-slate-300 flex items-center px-2">
      <span class="text-[9px] text-slate-500">срок не определён</span></div>`
      + Array(11).fill('<div class="h-5"></div>').join('')
  }
  return Array.from({ length: 12 }, (_, i) => {
    const active = i >= cols.start && i <= cols.end
    const isStart = i === cols.start
    const isEnd = i === cols.end
    const opacity = isInFuture(cols.end) ? 'opacity-40' : ''
    if (active) {
      return `<div class="h-5 ${isStart ? 'rounded-l-sm' : ''} ${isEnd ? 'rounded-r-lg' : ''} ${opacity} relative" style="background:${escapeHtml(color)}">
        ${isEnd ? `<span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-white">${escapeHtml(getEndLabel(quarter))}</span>` : ''}
      </div>`
    }
    return `<div class="h-5"></div>`
  }).join('')
}

function renderTeamSummaryBar(team, color) {
  const allQuarters = (team.tracks || [])
    .flatMap(t => (t.objectives || []).map(o => o.quarter).filter(Boolean))
  if (allQuarters.length === 0) return Array(12).fill(`<div class="h-2.5"></div>`).join('')

  const cols = allQuarters.map(q => quarterToColumns(q)).filter(Boolean)
  const start = Math.min(...cols.map(c => c.start))
  const end = Math.max(...cols.map(c => c.end))

  return Array.from({ length: 12 }, (_, i) => {
    const active = i >= start && i <= end
    if (active) return `<div class="h-2.5 ${i===start?'rounded-l-sm':''} ${i===end?'rounded-r-sm':''}" style="background:${escapeHtml(color)}"></div>`
    return `<div class="h-2.5"></div>`
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
    <div class="flex items-start gap-2 py-1.5 border-t border-slate-100 text-[10px] text-slate-500">
      <div class="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style="background:${escapeHtml(color)}"></div>
      <div>
        <span class="font-medium text-slate-700">${escapeHtml(kr.title)}</span>
        ${kr.target ? `<span class="ml-1 text-slate-400">→ ${escapeHtml(kr.target)}</span>` : ''}
        ${kr.description ? `<div class="text-slate-400 mt-0.5">${escapeHtml(kr.description)}</div>` : ''}
      </div>
    </div>`).join('')

  return `
    <div class="bg-white border border-slate-200 rounded-lg p-3.5 mt-1 mb-1.5 ml-7 shadow-sm text-sm">
      <div class="font-semibold text-slate-900 mb-2">${escapeHtml(obj.title)}</div>
      ${obj.description ? `<div class="text-[11px] text-slate-500 mb-2">${escapeHtml(obj.description)}</div>` : ''}
      <div class="text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 mb-2">
        ${obj.prerequisites ? `<span><strong class="text-slate-600">Требует:</strong> ${escapeHtml(obj.prerequisites)}</span>` : ''}
        ${obj.dependencies ? `<span><strong class="text-slate-600">Зависит от:</strong> ${escapeHtml(obj.dependencies)}</span>` : ''}
      </div>
      ${krHtml ? `<div class="mt-2"><div class="text-[10px] font-semibold text-slate-700 mb-1">Key Results</div>${krHtml}</div>` : ''}
    </div>`
}

function renderKPI(kpis, color) {
  if (!kpis?.length) return ''
  return `
    <div class="border-t border-slate-200 bg-white px-4 py-4">
      <div class="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-3">KPI</div>
      <div class="flex flex-wrap gap-2.5">
        ${kpis.map(kpi => `
          <div class="flex-1 min-w-[180px] border border-slate-100 rounded-lg p-3">
            <div class="text-[11px] font-semibold text-slate-800 mb-1">${escapeHtml(kpi.name)}</div>
            <div class="text-[10px] text-slate-400 mb-2">${escapeHtml(kpi.description || '')}</div>
            <div class="text-lg font-bold" style="color:${escapeHtml(color)}">${escapeHtml(kpi.target)}</div>
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

function renderTeamIsland(team, { expanded = false, showKR = false } = {}) {
  const color = team.display?.color || '#6366f1'
  const objectivesCount = (team.tracks || []).reduce((s, t) => s + (t.objectives?.length || 0), 0)

  const goalsHtml = (team.tracks || []).map(t => `
    <div class="flex items-start gap-1.5 text-[10px] text-slate-500 leading-snug">
      <div class="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style="background:${escapeHtml(color)}"></div>
      <span class="italic">${escapeHtml(t.goal || t.name)}</span>
    </div>`).join('')

  const summaryBar = renderTeamSummaryBar(team, color)

  const headerHtml = `
    <div class="grid grid-cols-[240px_1fr] cursor-pointer" data-action="toggle-team" data-slug="${escapeHtml(team.slug)}">
      <div class="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 ${expanded ? 'border-b-slate-100 rounded-tl-lg' : 'rounded-l-lg'} border-r-0">
        <div class="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0" style="background:${escapeHtml(color)}">
          ${escapeHtml(team.team.slice(0,2).toUpperCase())}
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-slate-900 leading-tight truncate">${escapeHtml(team.team)}</div>
          <div class="text-[10px] text-slate-400 truncate">${escapeHtml(team.owner || '')}</div>
        </div>
        <svg class="ml-auto shrink-0 w-3.5 h-3.5 text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </div>
      <div class="bg-white border border-slate-200 ${expanded ? 'border-b-slate-100 rounded-tr-lg' : 'rounded-r-lg'} border-l-0 grid grid-cols-12 gap-1 px-1.5 items-center">
        ${summaryBar}
      </div>
    </div>`

  if (!expanded) {
    return `
      <div class="team-island mb-2" data-slug="${escapeHtml(team.slug)}">
        ${headerHtml}
        <div class="bg-white border border-slate-200 border-t-0 rounded-b-lg px-3.5 pb-3 pt-2 grid grid-cols-[240px_1fr]">
          <div class="flex flex-col gap-1.5">
            ${goalsHtml}
            <div class="text-[10px] text-slate-300 mt-1">
              ${team.tracks?.length || 0} ${plural(team.tracks?.length, 'трек','трека','треков')} · ${objectivesCount} objectives
            </div>
          </div>
          <div></div>
        </div>
      </div>`
  }

  // Expanded state
  const tracksHtml = (team.tracks || []).map(track => {
    const trackBar = renderTrackBar(track, color)
    const objectivesHtml = (track.objectives || []).map(obj => {
      const bar = renderGanttBar(obj.quarter, color)
      const objId = slugify(obj.title)
      const krRows = showKR ? (obj.key_results || []).map(kr => `
        <div class="grid grid-cols-[240px_1fr] items-center min-h-[20px]">
          <div class="flex items-center gap-1.5 pl-11 pr-3 py-0.5">
            <div class="w-1 h-1 rounded-full shrink-0" style="background:${escapeHtml(color)}"></div>
            <div class="text-[10px] text-slate-400 leading-tight">${escapeHtml(kr.title)}</div>
          </div>
          <div class="grid grid-cols-12 gap-1 px-1.5"></div>
        </div>`).join('') : ''

      return `
        <div class="objective-block" data-obj-id="${objId}">
          <div class="grid grid-cols-[240px_1fr] items-center min-h-[30px] hover:bg-slate-50 cursor-pointer" data-action="toggle-obj" data-obj-id="${objId}">
            <div class="pl-7 pr-3 py-1">
              <div class="text-[11px] font-medium text-slate-700 leading-tight">${escapeHtml(obj.title)}</div>
              ${obj.description ? `<div class="text-[9px] text-slate-400 mt-0.5 line-clamp-1">${escapeHtml(obj.description)}</div>` : ''}
            </div>
            <div class="grid grid-cols-12 gap-1 px-1.5 items-center">
              ${bar}
            </div>
          </div>
          <div class="obj-card hidden">${renderObjectiveCard(obj, color)}</div>
          ${krRows}
        </div>`
    }).join('<div class="border-t border-slate-50 mx-0"></div>')

    return `
      <div class="track-block">
        <div class="grid grid-cols-[240px_1fr] items-start bg-slate-50 border-t border-slate-100">
          <div class="px-3.5 py-2">
            <span class="text-[9px] font-bold uppercase tracking-wide text-slate-400 block mb-0.5">Трек · ${escapeHtml(track.name)}</span>
            <span class="text-[10px] text-slate-500 italic leading-snug">${escapeHtml(track.goal || '')}</span>
          </div>
          <div class="grid grid-cols-12 gap-1 px-1.5 items-center py-3">
            ${trackBar}
          </div>
        </div>
        <div class="border-t border-slate-100">
          ${objectivesHtml}
        </div>
      </div>`
  }).join('')

  const kpiHtml = renderKPI(team.kpis, color)

  return `
    <div class="team-island mb-4" data-slug="${escapeHtml(team.slug)}">
      ${headerHtml}
      <div class="border border-slate-200 border-t-0 rounded-b-lg overflow-hidden">
        ${tracksHtml}
        ${kpiHtml}
      </div>
    </div>`
}

// Client-side entry point. Reads DATA global injected by build.js.
// No import/export — concatenated into bundle during build.

const state = {
  selectedTeam: 'all',
  showKR: false,
  expandedTeams: new Set(),
}

function getTeams() {
  return DATA.teams
}

function getYears() {
  return [...new Set(DATA.teams.map(t => t.year))].sort()
}

function renderApp() {
  const teams = getTeams()
  const filtered = state.selectedTeam === 'all'
    ? teams
    : teams.filter(t => t.slug === state.selectedTeam)

  if (state.selectedTeam !== 'all') {
    filtered.forEach(t => state.expandedTeams.add(t.slug))
  }

  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="max-w-[1920px] min-w-[1024px] mx-auto px-12 py-8">
      ${renderTopbar(teams)}
      ${renderControls(teams)}
      ${renderHeader()}
      <div id="teams-container">
        ${filtered.map(t => renderTeamIsland(t, {
          expanded: state.expandedTeams.has(t.slug),
          showKR: state.showKR,
        })).join('')}
      </div>
    </div>`

  bindEvents()
}

function renderTopbar(teams) {
  const years = getYears()
  return `
    <div class="flex items-baseline gap-4 mb-6">
      <div class="text-base font-bold text-slate-900 tracking-tight">Дизайн-планы · Финам</div>
      <div class="text-xs text-slate-400">${teams.length} ${plural(teams.length,'команда','команды','команд')} · ${years.map(escapeHtml).join(', ')}</div>
    </div>`
}

function renderControls(teams) {
  const options = [
    `<option value="all">Все команды</option>`,
    ...teams.map(t => `<option value="${escapeHtml(t.slug)}" ${state.selectedTeam===t.slug?'selected':''}>${escapeHtml(t.team)}</option>`)
  ].join('')

  return `
    <div class="flex items-center gap-3 mb-5 flex-wrap">
      <select id="team-select"
        class="text-sm border border-slate-200 rounded-full px-4 py-1.5 bg-white text-slate-700 outline-none focus:border-slate-400 cursor-pointer">
        ${options}
      </select>
      <label class="flex items-center gap-2 text-xs text-slate-500 cursor-pointer ml-auto select-none">
        <span class="relative inline-block w-7 h-4">
          <input type="checkbox" id="kr-toggle" ${state.showKR?'checked':''} class="sr-only peer">
          <div class="w-7 h-4 bg-slate-200 rounded-full peer-checked:bg-slate-800 transition-colors"></div>
          <div class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform peer-checked:translate-x-3"></div>
        </span>
        Key Results
      </label>
    </div>`
}

// Called after every full app.innerHTML replacement — relies on fresh DOM nodes having no prior listeners.
function bindEvents() {
  document.getElementById('team-select')?.addEventListener('change', e => {
    state.selectedTeam = e.target.value
    renderApp()
  })

  document.getElementById('kr-toggle')?.addEventListener('change', e => {
    state.showKR = e.target.checked
    renderApp()
  })

  document.querySelectorAll('[data-action="toggle-team"]').forEach(el => {
    el.addEventListener('click', () => {
      const slug = el.dataset.slug
      if (state.expandedTeams.has(slug)) state.expandedTeams.delete(slug)
      else state.expandedTeams.add(slug)
      renderApp()
    })
  })

  document.querySelectorAll('[data-action="toggle-obj"]').forEach(el => {
    el.addEventListener('click', () => {
      const card = el.closest('.objective-block')?.querySelector('.obj-card')
      if (card) card.classList.toggle('hidden')
    })
  })
}

// Start
requireAuth(renderApp)
