// Client-side entry point. Reads DATA global injected by build.js.
// No import/export — concatenated into bundle during build.

const state = {
  selectedTeam: 'all',
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
    <div class="max-w-[1920px] min-w-[1024px] mx-auto px-10 py-10">
      ${renderTopbar(teams)}
      ${renderTeamBoardHeader()}
      <div id="teams-container">
        ${filtered.map(t => renderTeamIsland(t, {
          expanded: state.expandedTeams.has(t.slug),
        })).join('')}
      </div>
    </div>`

  bindEvents()
}

function renderTopbar(teams) {
  const years = getYears()

  const allChip = `
    <button data-action="filter-team" data-slug="all"
      class="px-3 py-1 text-sm rounded-lg transition-all duration-150 cursor-pointer select-none
             ${state.selectedTeam === 'all'
               ? 'bg-white text-slate-900 font-medium shadow-sm'
               : 'text-slate-500 hover:text-slate-700'}">
      Все
    </button>`

  const teamChips = teams.map(t => `
    <button data-action="filter-team" data-slug="${escapeHtml(t.slug)}"
      class="px-3 py-1 text-sm rounded-lg transition-all duration-150 cursor-pointer select-none
             ${state.selectedTeam === t.slug
               ? 'bg-white text-slate-900 font-medium shadow-sm'
               : 'text-slate-500 hover:text-slate-700'}">
      ${escapeHtml(t.team)}
    </button>`).join('')

  return `
    <div class="mb-3">
      <div class="mb-5">
        <div class="text-xl font-bold text-slate-900 tracking-tight">Дизайн-планы · Финам</div>
        <div class="text-xs text-slate-400 mt-0.5">${teams.length} ${plural(teams.length,'команда','команды','команд')} · ${years.map(escapeHtml).join(', ')}</div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-0.5 bg-slate-200/60 rounded-xl p-1">
          ${allChip}${teamChips}
        </div>
      </div>
    </div>`
}

function renderControls() { return '' }

// Called after every full app.innerHTML replacement — relies on fresh DOM nodes having no prior listeners.
function bindEvents() {
  document.querySelectorAll('[data-action="filter-team"]').forEach(el => {
    el.addEventListener('click', () => {
      state.selectedTeam = el.dataset.slug
      renderApp()
    })
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
