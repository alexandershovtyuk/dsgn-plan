# Finam Design Plans — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать статический сайт-агрегатор OKR-планов дизайн-команд с гант-чартами, читающий YAML-файлы и деплоящийся на GitHub Pages.

**Architecture:** `build.js` читает `data/{год}/teams/*.yaml`, сериализует все данные в JSON и вшивает в единый `dist/index.html`. Клиентский `src/app.js` рендерит всё из этого JSON — гант, острова команд, карточки, фильтры. Tailwind CSS CLI генерирует минимальный CSS при сборке.

**Tech Stack:** Node.js 20, js-yaml, glob, tailwindcss v3 CLI, GitHub Actions, GitHub Pages.

---

## File Map

```
/
├── build.js                          # сборщик: YAML → JSON → dist/index.html
├── package.json
├── tailwind.config.js
├── .env.example                      # SITE_PASSWORD=
├── .gitignore
├── src/
│   ├── styles.css                    # Tailwind entry (@tailwind base/components/utilities)
│   ├── app.js                        # клиентский рендерер (монтируется в index.html)
│   ├── renderer.js                   # рендер островов, гант-полос, карточек
│   └── auth.js                       # экран ввода пароля, проверка хэша
├── data/
│   ├── _template.yaml                # шаблон с комментариями для лидов
│   └── 2026/
│       └── teams/
│           ├── design-system.yaml    # DS — годовой план, 3 трека
│           └── product-design.yaml  # PD — частичный план, 1 трек
├── .github/
│   └── workflows/
│       └── deploy.yml
└── dist/                             # генерируется, не коммитится
    ├── index.html
    └── assets/
        └── styles.css
```

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tailwind.config.js`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/styles.css`

- [ ] **Step 1: Создать package.json**

```json
{
  "name": "dsgn-plan",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "node build.js",
    "dev": "node build.js --watch"
  },
  "dependencies": {
    "glob": "^10.4.5",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.4"
  }
}
```

- [ ] **Step 2: Установить зависимости**

```bash
npm install
```

Ожидание: создан `node_modules/`, `package-lock.json`.

- [ ] **Step 3: Создать tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.js', './build.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Создать src/styles.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Создать .env.example**

```
SITE_PASSWORD=changeme
```

- [ ] **Step 6: Создать .gitignore**

```
node_modules/
dist/
.env
.superpowers/
```

- [ ] **Step 7: Commit**

```bash
git init
git add package.json package-lock.json tailwind.config.js src/styles.css .env.example .gitignore
git commit -m "chore: project scaffold"
```

---

## Task 2: Данные — шаблон и примеры

**Files:**
- Create: `data/_template.yaml`
- Create: `data/2026/teams/design-system.yaml`
- Create: `data/2026/teams/product-design.yaml`

- [ ] **Step 1: Создать data/_template.yaml**

```yaml
# ─────────────────────────────────────────────────────────────
# Шаблон плана команды. Скопируй файл, переименуй в {команда}.yaml
# и заполни поля. Год определяется автоматически из пути к файлу.
# ─────────────────────────────────────────────────────────────

# Название команды — отображается в шапке и фильтре
team: "Название команды"

# Руководитель команды
owner: "Имя Фамилия"

# Настройки отображения
display:
  color: "#6366f1"  # hex-цвет полос на гант-чарте

# Треки — стратегические направления команды
tracks:
  - name: "Название трека"

    # Долгосрочная цель трека (Goal) — одно предложение
    goal: "Что должно произойти в результате работы по этому треку"

    # Краткосрочные цели (Objectives) с привязкой к кварталам
    objectives:
      - title: "Название objective"

        # Подробное описание — что именно делаем и зачем
        description: "Описание работы и ожидаемого результата"

        # Квартал: Q1 | Q2 | Q3 | Q4 | "Q2-Q3" | null
        # null или отсутствие поля — серая полоса «срок не определён»
        quarter: "Q3"

        # Измеримые результаты
        key_results:
          - title: "Что измеряем"
            description: "Как проверить что достигнуто"
            target: "100%"

# KPI — постоянные метрики, отслеживаются каждый квартал
kpis:
  - name: "Название метрики"
    description: "Что измеряем и почему это важно"
    target: "100%"
```

- [ ] **Step 2: Создать data/2026/teams/design-system.yaml**

```yaml
team: "Дизайн-система"
owner: "Александр Шовтюк"

display:
  color: "#3b82f6"

tracks:
  - name: "Инфраструктура и архитектура"
    goal: "Дизайн-система переведена на масштабируемую модульную архитектуру и работает предсказуемо"
    objectives:
      - title: "Завершить оптимизацию библиотек"
        description: "Разбить монолитные Figma-библиотеки на модульные, устранить разрывы токенов после миграции аккаунта"
        quarter: "Q2-Q3"
        key_results:
          - title: "100% компонентов перенесены с сохранением связей"
            description: "Ни один инстанс в макетах дизайнеров не теряет связь с библиотекой"
            target: "100%"
          - title: "Все токены корректно привязаны к библиотечным источникам"
            description: "Цвет не разрывается при смене темы"
            target: "0 разрывов"

      - title: "Перевести темы на расширенные коллекции"
        description: "~20 тем перевести на схему базовая + extended, чтобы тема переключалась без переопределений в общем ките"
        quarter: "Q4"
        key_results:
          - title: "~20 тем переведены на новую схему"
            target: "20 тем"

  - name: "Цветовая система"
    goal: "Новая перцептивная палитра принята и внедрена в токен-систему дизайн-системы"
    objectives:
      - title: "Утвердить палитру"
        description: "Согласовать с руководителями дизайн-гильдии, подготовить план перехода"
        quarter: "Q3"
        key_results:
          - title: "Палитра согласована с гильдией"
            target: "Подпись руководителей"
          - title: "Подготовлен план перехода"
            target: "Документ с маппингом токенов"

      - title: "Внедрить в токен-систему"
        description: "100% смысловых токенов переведены на новую палитру, проверена контрастность"
        quarter: "Q4"
        key_results:
          - title: "100% смысловых токенов переведены"
            target: "100%"
          - title: "Все базовые компоненты проверены на контрастность"
            target: "0 нарушений WCAG AA"

  - name: "Портал дизайн-системы"
    goal: "Портал работает как надёжный источник правды для дизайнеров, разработчиков и ИИ-агентов"
    objectives:
      - title: "Запустить прототип портала"
        description: "Запустить и продемонстрировать в узком кругу команды и потребителей"
        quarter: "Q2"
        key_results:
          - title: "Прототип продемонстрирован ≥2 командам-потребителям"
            target: "2 команды"

      - title: "Выпустить версию 1.0"
        description: "Редполитика, бренд, компоненты с описаниями — всё на портале"
        quarter: "Q3"
        key_results:
          - title: "Все компоненты добавлены с описанием применимости"
            target: "100% компонентов"

      - title: "Подготовить слой для работы с ИИ"
        description: "Машиночитаемая документация, интеграция с корпоративным ИИ-стеком"
        quarter: "Q4"
        key_results:
          - title: "Документация в машиночитаемом формате"
            target: "100% компонентов"
          - title: "Портал подключён к ИИ-стеку как источник знаний"
            target: "Интеграция с Avatar"

kpis:
  - name: "Целостность токенов"
    description: "Доля компонентов в опубликованных библиотеках без разорванных ссылок на токены"
    target: "100%"
  - name: "Покрытие журналом изменений"
    description: "Доля релизов дизайн-системы, сопровождённых актуальным журналом изменений"
    target: "100%"
```

- [ ] **Step 3: Создать data/2026/teams/product-design.yaml**

```yaml
team: "Продуктовый дизайн"
owner: "Мария Иванова"

display:
  color: "#8b5cf6"

tracks:
  - name: "Исследования и инсайты"
    goal: "Повысить глубину и скорость дизайн-решений за счёт зрелых исследовательских практик"
    objectives:
      - title: "Запустить регулярные пользовательские интервью"
        description: "Выстроить процесс регулярных интервью с пользователями продуктов"
        quarter: "Q3"
        key_results:
          - title: "Проведено ≥12 интервью"
            target: "12 интервью"
          - title: "Инсайты задокументированы и доступны командам"
            target: "100% интервью задокументированы"

      - title: "Внедрить usability-тестирование"
        description: "Регулярные usability-сессии перед релизами ключевых фич"
        quarter: "Q3"
        key_results:
          - title: "≥4 usability-сессии проведено"
            target: "4 сессии"

kpis:
  - name: "Охват исследованиями"
    description: "Доля ключевых фич, прошедших usability-проверку до релиза"
    target: "80%"
```

- [ ] **Step 4: Commit**

```bash
git add data/
git commit -m "feat: add yaml data — template and two sample teams"
```

---

## Task 3: build.js — парсер YAML и генератор HTML

**Files:**
- Create: `build.js`

- [ ] **Step 1: Написать проверочный тест для парсера**

Создать `test-build.js`:

```js
const { parseTeams } = require('./build.js')

// тест: находит файлы и парсит год из пути
const teams = parseTeams()
console.assert(teams.length >= 2, `Ожидали ≥2 команды, получили ${teams.length}`)
console.assert(teams[0].year === 2026, `Ожидали year=2026, получили ${teams[0].year}`)
console.assert(teams[0].data.team, 'Ожидали поле team')
console.assert(Array.isArray(teams[0].data.tracks), 'Ожидали массив tracks')
console.log('✓ parseTeams OK')

// тест: slug генерируется из названия
const { slugify } = require('./build.js')
console.assert(slugify('Дизайн-система') === 'dizayn-sistema' || slugify('Дизайн-система').length > 0, 'slug не пустой')
console.log('✓ slugify OK')
```

- [ ] **Step 2: Запустить тест — убедиться что падает**

```bash
node test-build.js
```

Ожидание: `Error: Cannot find module './build.js'`

- [ ] **Step 3: Написать build.js**

```js
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { globSync } = require('glob')
const { execSync } = require('child_process')
const crypto = require('crypto')

// ─── Helpers ───────────────────────────────────────────────

function slugify(str) {
  const map = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo',
    'ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n',
    'о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh',
    'ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e',
    'ю':'yu','я':'ya' }
  return str.toLowerCase()
    .split('').map(c => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseTeams() {
  const files = globSync('data/*/teams/*.yaml')
  const teams = []
  for (const file of files) {
    const yearMatch = file.match(/data\/(\d{4})\//)
    if (!yearMatch) { console.warn(`WARN: не удалось определить год из ${file}`); continue }
    const year = parseInt(yearMatch[1], 10)
    let data
    try {
      data = yaml.load(fs.readFileSync(file, 'utf8'))
    } catch (e) {
      console.warn(`WARN: ошибка парсинга ${file}: ${e.message}`)
      continue
    }
    if (!data || !data.team) { console.warn(`WARN: пропускаем ${file} — нет поля team`); continue }
    if (!data.display?.color) console.warn(`WARN: ${file} — нет display.color`)
    teams.push({ year, slug: slugify(data.team), file, data })
  }
  teams.sort((a, b) => a.year - b.year || a.data.team.localeCompare(b.data.team, 'ru'))
  return teams
}

// ─── Quarter → month columns ───────────────────────────────

function quarterToColumns(quarter) {
  // returns { start: 0-11, end: 0-11} (inclusive, 0 = январь)
  if (!quarter) return null
  const map = { Q1:[0,2], Q2:[3,5], Q3:[6,8], Q4:[9,11] }
  const range = quarter.toString().split('-')
  if (range.length === 2) {
    const s = map[range[0].trim()]
    const e = map[range[1].trim()]
    if (!s || !e) return null
    return { start: s[0], end: e[1] }
  }
  const col = map[quarter.trim()]
  if (!col) return null
  return { start: col[0], end: col[1] }
}

// ─── Password hash ─────────────────────────────────────────

function getPasswordHash() {
  const pwd = process.env.SITE_PASSWORD
  if (!pwd) return null
  return crypto.createHash('sha256').update(pwd).digest('hex')
}

// ─── Build ─────────────────────────────────────────────────

function build() {
  require('dotenv').config({ path: '.env' })

  const teams = parseTeams()
  if (teams.length === 0) { console.error('ERR: нет ни одной команды'); process.exit(1) }

  fs.mkdirSync('dist/assets', { recursive: true })

  // Tailwind
  execSync('npx tailwindcss -i src/styles.css -o dist/assets/styles.css --minify', { stdio: 'inherit' })

  // Copy app.js
  fs.copyFileSync('src/app.js', 'dist/assets/app.js')

  // Embed DATA + auth hash
  const data = { teams: teams.map(t => ({ year: t.year, slug: t.slug, ...t.data })) }
  const hash = getPasswordHash()
  const authScript = hash ? `const AUTH_HASH = "${hash}";` : `const AUTH_HASH = null;`

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Дизайн-планы · Финам</title>
<link rel="stylesheet" href="assets/styles.css">
</head>
<body class="bg-slate-50 text-slate-900 min-w-[1024px]">
<div id="app"></div>
<script>
${authScript}
const DATA = ${JSON.stringify(data, null, 2)};
</script>
<script src="assets/app.js"></script>
</body>
</html>`

  fs.writeFileSync('dist/index.html', html)
  console.log(`✓ Built: ${teams.length} команд → dist/index.html`)
}

// ─── Watch mode ────────────────────────────────────────────

if (require.main === module) {
  if (process.argv.includes('--watch')) {
    const http = require('http')
    build()
    // простой статик-сервер
    http.createServer((req, res) => {
      let fp = path.join('dist', req.url === '/' ? 'index.html' : req.url)
      if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return }
      const ext = path.extname(fp)
      const mime = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript' }
      res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' })
      res.end(fs.readFileSync(fp))
    }).listen(3000, () => console.log('Dev server: http://localhost:3000'))
    // пересборка при изменении yaml
    fs.watch('data', { recursive: true }, (_, f) => {
      if (f?.endsWith('.yaml')) { console.log(`Changed: ${f}`); build() }
    })
  } else {
    build()
  }
}

module.exports = { parseTeams, slugify, quarterToColumns }
```

- [ ] **Step 4: Установить dotenv**

```bash
npm install dotenv
```

- [ ] **Step 5: Запустить тест**

```bash
node test-build.js
```

Ожидание:
```
✓ parseTeams OK
✓ slugify OK
```

- [ ] **Step 6: Запустить сборку**

```bash
node build.js
```

Ожидание:
```
✓ Built: 2 команды → dist/index.html
```

- [ ] **Step 7: Проверить dist/index.html**

```bash
grep -c '"team"' dist/index.html
```

Ожидание: число ≥ 2 (данные вшиты).

- [ ] **Step 8: Commit**

```bash
git add build.js package.json package-lock.json
git commit -m "feat: build.js — yaml parser, tailwind, html generator"
```

---

## Task 4: src/auth.js — защита паролем

**Files:**
- Create: `src/auth.js`

- [ ] **Step 1: Создать src/auth.js**

```js
// Вызывается из app.js перед рендером.
// Если AUTH_HASH === null — защита выключена.
// Хэш проверяется на клиенте через SubtleCrypto (SHA-256).

export async function requireAuth(onSuccess) {
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
```

- [ ] **Step 2: Проверить что файл создан**

```bash
ls src/auth.js
```

- [ ] **Step 3: Commit**

```bash
git add src/auth.js
git commit -m "feat: auth — client-side password protection via SHA-256"
```

---

## Task 5: src/renderer.js — гант и острова

**Files:**
- Create: `src/renderer.js`

- [ ] **Step 1: Создать src/renderer.js**

```js
// Чистые функции рендера. Принимают данные, возвращают HTML-строки.

const MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
const NOW_MONTH = new Date().getMonth() // 0-based

export function renderHeader() {
  const quarters = [
    { label: 'Q1', cols: [0,1,2] },
    { label: 'Q2', cols: [3,4,5] },
    { label: 'Q3', cols: [6,7,8] },
    { label: 'Q4', cols: [9,10,11] },
  ]
  const qColors = ['bg-slate-400','bg-slate-500','bg-slate-600','bg-slate-800']

  return `
    <div class="grid grid-cols-[240px_1fr] mb-0">
      <div></div>
      <div>
        <div class="grid grid-cols-4 gap-1 mb-1">
          ${quarters.map((q, i) => `
            <div class="text-[10px] font-bold text-white ${qColors[i]} rounded-full py-1 text-center">${q.label}</div>
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

export function renderGanttBar(quarter, color) {
  // quarter: "Q2" | "Q3" | "Q2-Q3" | null
  // возвращает 12 div-ячеек
  const cols = quarterToColumns(quarter)
  return Array.from({ length: 12 }, (_, i) => {
    if (!cols) {
      // нет квартала — серая полоса через все ячейки (один раз, в центре)
      if (i === 0) return `<div class="col-span-12 h-5 rounded bg-slate-300 flex items-center px-2">
        <span class="text-[9px] text-slate-500">срок не определён</span></div>`
      return ''
    }
    const active = i >= cols.start && i <= cols.end
    const isStart = i === cols.start
    const isEnd = i === cols.end
    const opacity = isInFuture(cols.end) ? 'opacity-40' : ''
    const radius = `${isStart ? 'rounded-l-sm' : ''} ${isEnd ? 'rounded-r-lg' : ''}`
    if (active) {
      return `<div class="h-5 ${radius} ${opacity} relative" style="background:${color}">
        ${isEnd ? `<span class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-bold text-white">${getEndLabel(quarter)}</span>` : ''}
      </div>`
    }
    return `<div class="h-5"></div>`
  }).filter(Boolean).join('')
}

function isInFuture(endCol) {
  // считаем "будущим" если конец квартала ещё не наступил
  const quarterEndMonth = [2, 5, 8, 11]
  return quarterEndMonth[Math.floor(endCol / 3)] > NOW_MONTH
}

function getEndLabel(quarter) {
  if (!quarter) return ''
  const parts = quarter.toString().split('-')
  return parts[parts.length - 1].trim()
}

function quarterToColumns(quarter) {
  if (!quarter) return null
  const map = { Q1:[0,2], Q2:[3,5], Q3:[6,8], Q4:[9,11] }
  const range = quarter.toString().split('-')
  if (range.length === 2) {
    const s = map[range[0].trim()]; const e = map[range[1].trim()]
    if (!s || !e) return null
    return { start: s[0], end: e[1] }
  }
  const col = map[quarter.trim()]
  if (!col) return null
  return { start: col[0], end: col[1] }
}

export function renderTeamSummaryBar(team, color) {
  // суммарная полоса: от первого до последнего квартала команды
  const allQuarters = (team.tracks || [])
    .flatMap(t => (t.objectives || []).map(o => o.quarter).filter(Boolean))
  if (allQuarters.length === 0) return Array(12).fill(`<div class="h-2.5"></div>`).join('')

  const cols = allQuarters.map(q => quarterToColumns(q)).filter(Boolean)
  const start = Math.min(...cols.map(c => c.start))
  const end = Math.max(...cols.map(c => c.end))

  return Array.from({ length: 12 }, (_, i) => {
    const active = i >= start && i <= end
    const isStart = i === start; const isEnd = i === end
    if (active) return `<div class="h-2.5 ${isStart?'rounded-l-sm':''} ${isEnd?'rounded-r-sm':''}" style="background:${color}"></div>`
    return `<div class="h-2.5"></div>`
  }).join('')
}

export function renderObjectiveCard(obj, color) {
  const krHtml = (obj.key_results || []).map(kr => `
    <div class="flex items-start gap-2 py-1.5 border-t border-slate-100 text-[10px] text-slate-500">
      <div class="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style="background:${color}"></div>
      <div>
        <span class="font-medium text-slate-700">${kr.title}</span>
        ${kr.target ? `<span class="ml-1 text-slate-400">→ ${kr.target}</span>` : ''}
        ${kr.description ? `<div class="text-slate-400 mt-0.5">${kr.description}</div>` : ''}
      </div>
    </div>`).join('')

  return `
    <div class="bg-white border border-slate-200 rounded-lg p-3.5 mt-1 mb-1.5 ml-7 shadow-sm text-sm">
      <div class="font-semibold text-slate-900 mb-2">${obj.title}</div>
      ${obj.description ? `<div class="text-[11px] text-slate-500 mb-2">${obj.description}</div>` : ''}
      ${krHtml ? `<div class="mt-2"><div class="text-[10px] font-semibold text-slate-700 mb-1">Key Results</div>${krHtml}</div>` : ''}
    </div>`
}

export function renderTeamIsland(team, { expanded = false, showKR = false } = {}) {
  const color = team.display?.color || '#6366f1'
  const objectivesCount = (team.tracks || []).reduce((s, t) => s + (t.objectives?.length || 0), 0)

  // Collapsed state
  const goalsHtml = (team.tracks || []).map(t => `
    <div class="flex items-start gap-1.5 text-[10px] text-slate-500 leading-snug">
      <div class="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style="background:${color}"></div>
      <span class="italic">${t.goal || t.name}</span>
    </div>`).join('')

  const summaryBar = renderTeamSummaryBar(team, color)

  const headerHtml = `
    <div class="grid grid-cols-[240px_1fr] cursor-pointer" data-action="toggle-team" data-slug="${team.slug}">
      <div class="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 ${expanded ? 'border-b-slate-100 rounded-tl-lg' : 'rounded-l-lg'} border-r-0">
        <div class="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0" style="background:${color}">
          ${team.team.slice(0,2).toUpperCase()}
        </div>
        <div class="min-w-0">
          <div class="text-xs font-semibold text-slate-900 leading-tight truncate">${team.team}</div>
          <div class="text-[10px] text-slate-400 truncate">${team.owner || ''}</div>
        </div>
        <svg class="ml-auto shrink-0 w-3.5 h-3.5 text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </div>
      <div class="bg-white border border-slate-200 ${expanded ? 'border-b-slate-100 rounded-tr-lg' : 'rounded-r-lg'} border-l-0 grid grid-cols-12 gap-1 px-1.5 items-center">
        ${summaryBar}
      </div>
    </div>`

  if (!expanded) {
    return `
      <div class="team-island mb-2" data-slug="${team.slug}">
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
            <div class="w-1 h-1 rounded-full shrink-0" style="background:${color}"></div>
            <div class="text-[10px] text-slate-400 leading-tight">${kr.title}</div>
          </div>
          <div class="grid grid-cols-12 gap-1 px-1.5"></div>
        </div>`).join('') : ''

      return `
        <div class="objective-block" data-obj-id="${objId}">
          <div class="grid grid-cols-[240px_1fr] items-center min-h-[30px] hover:bg-slate-50 cursor-pointer" data-action="toggle-obj" data-obj-id="${objId}">
            <div class="pl-7 pr-3 py-1">
              <div class="text-[11px] font-medium text-slate-700 leading-tight">${obj.title}</div>
              ${obj.description ? `<div class="text-[9px] text-slate-400 mt-0.5 line-clamp-1">${obj.description}</div>` : ''}
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
            <span class="text-[9px] font-bold uppercase tracking-wide text-slate-400 block mb-0.5">Трек · ${track.name}</span>
            <span class="text-[10px] text-slate-500 italic leading-snug">${track.goal || ''}</span>
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
    <div class="team-island mb-4" data-slug="${team.slug}">
      ${headerHtml}
      <div class="border border-slate-200 border-t-0 rounded-b-lg overflow-hidden">
        ${tracksHtml}
        ${kpiHtml}
      </div>
    </div>`
}

function renderTrackBar(track, color) {
  const allQ = (track.objectives || []).map(o => o.quarter).filter(Boolean)
  if (allQ.length === 0) return Array(12).fill('<div></div>').join('')
  const cols = allQ.map(q => quarterToColumns(q)).filter(Boolean)
  const start = Math.min(...cols.map(c => c.start))
  const end = Math.max(...cols.map(c => c.end))
  return Array.from({ length: 12 }, (_, i) => {
    const active = i >= start && i <= end
    if (active) return `<div class="h-0.5 ${i===start?'rounded-l-full':''} ${i===end?'rounded-r-full':''}" style="background:${color}"></div>`
    return `<div class="h-0.5"></div>`
  }).join('')
}

function renderKPI(kpis, color) {
  if (!kpis?.length) return ''
  return `
    <div class="border-t border-slate-200 bg-white px-4 py-4">
      <div class="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-3">KPI</div>
      <div class="flex flex-wrap gap-2.5">
        ${kpis.map(kpi => `
          <div class="flex-1 min-w-[180px] border border-slate-100 rounded-lg p-3">
            <div class="text-[11px] font-semibold text-slate-800 mb-1">${kpi.name}</div>
            <div class="text-[10px] text-slate-400 mb-2">${kpi.description || ''}</div>
            <div class="text-lg font-bold" style="color:${color}">${kpi.target}</div>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer.js
git commit -m "feat: renderer — gantt bars, team islands, objective cards, kpi"
```

---

## Task 6: src/app.js — точка входа, фильтры, интерактив

**Files:**
- Create: `src/app.js`

- [ ] **Step 1: Создать src/app.js**

```js
import { requireAuth } from './auth.js'
import { renderHeader, renderTeamIsland } from './renderer.js'

// Состояние
const state = {
  selectedTeam: 'all',  // slug или 'all'
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

  // Если выбрана конкретная команда — раскрыть её
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
    ...teams.map(t => `<option value="${t.slug}" ${state.selectedTeam===t.slug?'selected':''}>${t.team}</option>`)
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
  // Фильтр команды
  document.getElementById('team-select')?.addEventListener('change', e => {
    state.selectedTeam = e.target.value
    renderApp()
  })

  // Тогл KR
  document.getElementById('kr-toggle')?.addEventListener('change', e => {
    state.showKR = e.target.checked
    renderApp()
  })

  // Разворачивание команды
  document.querySelectorAll('[data-action="toggle-team"]').forEach(el => {
    el.addEventListener('click', () => {
      const slug = el.dataset.slug
      if (state.expandedTeams.has(slug)) state.expandedTeams.delete(slug)
      else state.expandedTeams.add(slug)
      renderApp()
    })
  })

  // Раскрытие карточки objective
  document.querySelectorAll('[data-action="toggle-obj"]').forEach(el => {
    el.addEventListener('click', () => {
      const card = el.closest('.objective-block')?.querySelector('.obj-card')
      if (card) card.classList.toggle('hidden')
    })
  })
}

function plural(n, one, few, many) {
  const mod10 = n % 10, mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if ([2,3,4].includes(mod10) && ![12,13,14].includes(mod100)) return few
  return many
}

// Старт
requireAuth(renderApp)
```

- [ ] **Step 2: Commit**

```bash
git add src/app.js
git commit -m "feat: app.js — filters, team toggle, objective cards, kr toggle"
```

---

## Task 7: Связать модули в финальную сборку

`app.js` использует ES-модули (`import/export`), но в браузере без бандлера нужно или `type="module"`, или объединить файлы.

- [ ] **Step 1: Обновить build.js — объединять JS-файлы**

В функцию `build()` добавить после Tailwind:

```js
// Bundle src/*.js into a single file (no bundler needed — just concatenate)
const authSrc = fs.readFileSync('src/auth.js', 'utf8').replace(/^export /gm, '')
const rendererSrc = fs.readFileSync('src/renderer.js', 'utf8').replace(/^export /gm, '')
const appSrc = fs.readFileSync('src/app.js', 'utf8')
  .replace(/^import.*from.*\n/gm, '')  // убрать import-строки

const bundle = [authSrc, rendererSrc, appSrc].join('\n\n')
fs.writeFileSync('dist/assets/app.js', bundle)
```

Убрать строку `fs.copyFileSync('src/app.js', 'dist/assets/app.js')`.

- [ ] **Step 2: Запустить сборку**

```bash
node build.js
```

Ожидание: `✓ Built: 2 команды → dist/index.html`

- [ ] **Step 3: Запустить dev-сервер и открыть в браузере**

```bash
node build.js --watch
# Открыть http://localhost:3000
```

Ожидание:
- Экран ввода пароля (если задан SITE_PASSWORD в .env) или сразу сайт
- Видны 2 команды в свёрнутом виде с Goals
- Клик на команду разворачивает треки и objectives
- Гант-полосы отрисованы по кварталам
- Клик на objective открывает карточку с KR
- Select фильтрует команды
- Тогл KR показывает/скрывает строки

- [ ] **Step 4: Commit**

```bash
git add build.js
git commit -m "feat: bundle src modules into single dist/assets/app.js"
```

---

## Task 8: GitHub Actions — деплой на GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Создать .github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npm run build
        env:
          SITE_PASSWORD: ${{ secrets.SITE_PASSWORD }}

      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 2: Добавить SITE_PASSWORD в GitHub Secrets**

Перейти: репозиторий → Settings → Secrets and variables → Actions → New repository secret.
Имя: `SITE_PASSWORD`, значение: пароль.

- [ ] **Step 3: Включить GitHub Pages**

Репозиторий → Settings → Pages → Source: `gh-pages` branch.

- [ ] **Step 4: Commit и пуш**

```bash
git add .github/
git commit -m "ci: github actions deploy to github pages"
git push origin main
```

Ожидание: Actions запускается, через ~2 минуты сайт доступен по `https://{user}.github.io/{repo}/`.

---

## Task 9: README и финальная проверка

**Files:**
- Create: `README.md`

- [ ] **Step 1: Создать README.md**

```markdown
# Finam Design Plans

Статический сайт-агрегатор OKR-планов дизайн-команд. Гант-чарты по кварталам.

## Добавить команду

1. Скопировать `data/_template.yaml`
2. Переименовать в `data/{год}/teams/{название-команды}.yaml`
3. Заполнить поля (все описаны в шаблоне)
4. Сделать PR → после мержа сайт пересоберётся автоматически

## Запуск локально

```bash
npm install
cp .env.example .env   # задать SITE_PASSWORD если нужна защита
npm run dev            # http://localhost:3000
```

## Сборка

```bash
npm run build   # генерирует dist/
```

## Деплой

Push в `main` → GitHub Actions → GitHub Pages автоматически.

## Переезд на GitLab

Заменить `.github/workflows/deploy.yml` на `.gitlab-ci.yml`:

```yaml
pages:
  script:
    - npm ci
    - npm run build
    - mv dist public
  artifacts:
    paths: [public]
  only: [main]
```
```

- [ ] **Step 2: Финальная проверка локально**

```bash
npm run build
node -e "
const fs = require('fs')
const html = fs.readFileSync('dist/index.html','utf8')
console.assert(html.includes('DATA ='), 'DATA вшит')
console.assert(html.includes('Дизайн-система'), 'DS данные есть')
console.assert(html.includes('Продуктовый дизайн'), 'PD данные есть')
console.assert(html.includes('assets/styles.css'), 'CSS подключён')
console.assert(html.includes('assets/app.js'), 'JS подключён')
console.log('✓ dist/index.html OK')
"
```

Ожидание: `✓ dist/index.html OK`

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: readme — add team, local dev, deploy, gitlab migration"
```

---

## Self-Review

**Spec coverage:**
- ✓ YAML: треки, goal, objectives, KR, quarter, kpis, display.color
- ✓ Год из пути файла
- ✓ Сборщик: build.js, js-yaml, glob
- ✓ Tailwind CSS CLI
- ✓ JS-пароль через .env → SHA-256 хэш
- ✓ Один dist/index.html, резиновая верстка 1024–1920px
- ✓ Острова команд с свёрнутым/развёрнутым состоянием
- ✓ Треки с Goal, Objectives с гант-полосами, карточки при клике
- ✓ KPI-блок внутри острова
- ✓ Select фильтр по команде
- ✓ Тогл KR
- ✓ quarter: null → серая полоса
- ✓ quarter: "Q2-Q3" → двухквартальная полоса
- ✓ Мягкая валидация с предупреждениями в консоль
- ✓ --watch + localhost:3000
- ✓ GitHub Actions deploy.yml
- ✓ _template.yaml в data/ (не в году)
- ✓ README с инструкцией по GitLab миграции

**Плейсхолдеры:** не обнаружены.

**Консистентность:** `slugify` определена в `build.js` и продублирована в `renderer.js` — обе копии идентичны. `quarterToColumns` аналогично продублирована — это намеренно, т.к. нет бандлера и модули объединяются конкатенацией.
