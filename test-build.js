const { parseTeams } = require('./build.js')

// test: finds files and parses year from path
const teams = parseTeams()
console.assert(teams.length >= 2, `Expected ≥2 teams, got ${teams.length}`)
console.assert(teams[0].year === 2026, `Expected year=2026, got ${teams[0].year}`)
console.assert(teams[0].data.team, 'Expected field team')
console.assert(Array.isArray(teams[0].data.tracks), 'Expected tracks array')
console.log('✓ parseTeams OK')

// test: slug generated from name
const { slugify } = require('./build.js')
console.assert(slugify('Дизайн-система').length > 0, 'slug is not empty')
console.log('✓ slugify OK')
