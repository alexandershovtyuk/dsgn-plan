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
      <div class="text-xs text-slate-400">${teams.length} ${plural(teams.length,'команда','команды','команд')} · ${years.join(', ')}</div>
    </div>`
}

function renderControls(teams) {
  const options = [
    `<option value="all">Все команды</option>`,
    ...teams.map(t => `<option value="${t.slug}" ${state.selectedTeam===t.slug?'selected':''}>${escapeHtml(t.team)}</option>`)
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
