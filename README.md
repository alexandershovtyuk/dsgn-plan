# dsgn-plan

Static site that aggregates design team OKR/KPI plans into Gantt charts.

## Adding a team

```bash
cp data/_template.yaml data/2026/teams/<team-name>.yaml
```

Fill in the YAML fields (see [Data schema](#data-schema)), commit, and the team will appear on the next build.

## Local dev

```bash
cp .env.example .env   # set PASSWORD in .env
npm install
npm run dev            # http://localhost:3000
```

## Build

```bash
npm run build          # output → dist/index.html
```

## Deploy (GitHub Pages)

Push to `main`. GitHub Actions (`.github/workflows/deploy.yml`) runs `npm run build` and pushes `dist/` to the `gh-pages` branch automatically.

First-time setup: go to **Settings → Pages** in the repo and set the source to the `gh-pages` branch.

## GitLab migration

Replace `.github/workflows/deploy.yml` with a GitLab CI job:

```yaml
pages:
  script:
    - npm install
    - npm run build
    - mv dist public
  artifacts:
    paths:
      - public
  only:
    - main
```

GitLab Pages serves the `public/` artifact automatically.

## Data schema

Fields defined in `data/_template.yaml`:

| Field | Description |
|---|---|
| `team` | Team name shown in header and filter |
| `owner` | Team lead name |
| `display.color` | Hex color for Gantt bars |
| `tracks[].name` | Strategic track name |
| `tracks[].goal` | Long-term goal for the track |
| `tracks[].objectives[].title` | Objective name |
| `tracks[].objectives[].description` | What and why |
| `tracks[].objectives[].quarter` | `Q1`–`Q4`, `"Q2-Q3"`, or `null` (undated) |
| `tracks[].objectives[].prerequisites` | What must be done first |
| `tracks[].objectives[].dependencies` | Teams/roles this depends on |
| `tracks[].objectives[].key_results[]` | Measurable results (`title`, `description`, `target`) |
| `kpis[]` | Ongoing metrics tracked each quarter (`name`, `description`, `target`) |

The year is derived automatically from the file path (`data/<year>/teams/<team>.yaml`).
