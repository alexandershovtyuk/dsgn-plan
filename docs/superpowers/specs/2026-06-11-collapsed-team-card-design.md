# Collapsed Team Card Redesign

## Goal

Redesign the collapsed state of team cards in the dsgn-plan dashboard so that a group of design leads reviewing the board at a glance can instantly compare team activity across quarters and see OKR/KPI volume side by side.

## Context

The previous collapsed view showed a team name, avatar, track list, and an indistinct summary bar. Key problems:
- No clear quarterly coverage visibility
- Tracks listed individually (cluttered, not scannable)
- Metric counts (tracks / objectives / KR / KPI) not vertically aligned across teams

---

## Layout

### Grid

A single CSS grid applies to both the legend/header row and all team card rows:

```
grid-template-columns: 1fr 64px 64px 64px 64px 24px 64px 64px 64px 64px
```

| Zone | Columns | Content |
|------|---------|---------|
| Team name | `1fr` | Avatar + name + owner |
| Q-blocks | `64px × 4` | Q1–Q4 indicators |
| Gap | `24px` | Visual breathing room |
| Metrics | `64px × 4` | треки / цели / результаты / KPI |

### Legend + Header Row

A single row above the cards. Left side (team name column) is empty. Q-block columns carry the quarter state legend, centered with `justify-content: center`. Metric columns carry column headers with dashed underline tooltips.

Legend order (left to right, least → most active):
**нет целей → запланирован → выполняется**

---

## Q-Block Indicators

Each card shows four 64×64px blocks for Q1–Q4.

**State: нет целей** — `background: rgba(0,0,0,0.04)`, label/number/sublabel in `#d1d5db`

**State: запланирован** — light tinted bg + light border in team color (e.g. `#eff6ff` + `1px solid #93c5fd`), text in lighter shade of team color

**State: выполняется** (current quarter) — same tint family but stronger: label/number in full team color

Color derivation: each team has a base color. Active = full color, planned = `300`-level tint of that color (lighter), no goals = neutral gray.

Block anatomy (top to bottom):
- `Q1` / `Q2` / `Q3` / `Q4` — `10px bold` label
- Count number — `16px bold`
- `цели` / `цель` / `целей` — `9px` sublabel (pluralized)

---

## Metric Columns

Four columns showing total counts for the team:

| Label | Tooltip | Data field |
|-------|---------|-----------|
| треки | Стратегические направления работы команды | track count |
| цели | Конкретные задачи на квартал (Objectives) | objective count |
| результаты | Измеримые метрики достижения целей (Key Results) | KR count |
| KPI | Постоянные показатели эффективности команды | KPI count |

**Label style:** `11px`, `#94a3b8`, `text-decoration: underline dashed`, `text-underline-offset: 4px`. Hover darkens to `#475569` and reveals tooltip.

**Value style:** `15px`, `font-weight: 400`, `#64748b`, centered.

Tooltips: CSS `:hover` + `visibility: hidden → visible`, `position: absolute`, dark pill `#1e293b`, `border-radius: 10px`. No `title` attribute.

---

## Card States

| State | Background | Shadow | Margin |
|-------|-----------|--------|--------|
| Default | transparent | none | none |
| Hover | `rgba(255,255,255,0.7)` | none | none |
| Expanded (clicked) | `white` | `0 2px 16px rgba(0,0,0,0.07)` | `4px 0` |

No chevron icons. Click anywhere on the row to toggle expanded.

---

## Avatar

- Size: `40×40px`
- `border-radius: 12px` (Apple-style)
- Background: team color
- Content: 2-letter initials in white, `12px bold`

---

## Visual Language

- Page background: `#f2f2f7` (Apple iOS system gray)
- Card `border-radius: 16px`
- Inter-card gap: `3px`
- No dividers between Q-block zone and metric zone — gap column provides visual separation
- No decorative chevrons

---

## Implementation Notes

- All styles via Tailwind CSS; inline styles only where Tailwind classes cannot reach (e.g. dynamic team color values)
- Q-block color is derived at render time from `team.color` — cannot be a Tailwind class
- Tooltip requires `position: relative` on `.col-header` and `position: absolute` on child — Tailwind group/peer pattern or inline style
- Pluralization of `цель/цели/целей` follows Russian numeric rules (1 → цель, 2–4 → цели, 5+ → целей)
