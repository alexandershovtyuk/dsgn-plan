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
