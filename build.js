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
    if (!yearMatch) { console.warn(`WARN: could not determine year from ${file}`); continue }
    const year = parseInt(yearMatch[1], 10)
    let data
    try {
      data = yaml.load(fs.readFileSync(file, 'utf8'))
    } catch (e) {
      console.warn(`WARN: parse error ${file}: ${e.message}`)
      continue
    }
    if (!data || !data.team) { console.warn(`WARN: skipping ${file} — no team field`); continue }
    if (!data.display?.color) console.warn(`WARN: ${file} — no display.color`)
    teams.push({ year, slug: slugify(data.team), file, data })
  }
  teams.sort((a, b) => a.year - b.year || a.data.team.localeCompare(b.data.team, 'ru'))
  return teams
}

// ─── Quarter → month columns ───────────────────────────────

function quarterToColumns(quarter) {
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
  if (teams.length === 0) { console.error('ERR: no teams found'); process.exit(1) }

  fs.mkdirSync('dist/assets', { recursive: true })

  // Tailwind
  execSync('npx tailwindcss -i src/styles.css -o dist/assets/styles.css --minify', { stdio: 'inherit' })

  // Copy app.js (will be replaced by bundle in Task 7)
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
  console.log(`✓ Built: ${teams.length} teams → dist/index.html`)
}

// ─── Watch mode ────────────────────────────────────────────

if (require.main === module) {
  if (process.argv.includes('--watch')) {
    const http = require('http')
    build()
    http.createServer((req, res) => {
      let fp = path.join('dist', req.url === '/' ? 'index.html' : req.url)
      if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return }
      const ext = path.extname(fp)
      const mime = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript' }
      res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' })
      res.end(fs.readFileSync(fp))
    }).listen(3000, () => console.log('Dev server: http://localhost:3000'))
    fs.watch('data', { recursive: true }, (_, f) => {
      if (f?.endsWith('.yaml')) { console.log(`Changed: ${f}`); build() }
    })
  } else {
    build()
  }
}

module.exports = { parseTeams, slugify, quarterToColumns }
