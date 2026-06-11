# dsgn-plan

Статический сайт для объединения OKR/KPI-планов дизайн-команд в единый документ с гант-чартами. Каждая команда ведёт YAML-файл в репозитории — при пуше GitHub Actions собирает сайт и деплоит на GitHub Pages.

## Стек

| Слой | Технология |
|---|---|
| Данные | YAML (`js-yaml`) — по одному файлу на команду |
| Сборка | Node.js (`build.js`) — читает YAML, генерирует `dist/index.html` |
| Стили | Tailwind CSS v3 CLI — сканирует `src/`, выдаёт минифицированный CSS |
| Клиент | Vanilla JS — три модуля (`auth.js`, `renderer.js`, `app.js`) конкатенируются в один бандл |
| Защита | SHA-256 хэш пароля вшивается в HTML при сборке, проверяется в браузере через SubtleCrypto |
| CI/CD | GitHub Actions → `peaceiris/actions-gh-pages` → ветка `gh-pages` |
| Хостинг | GitHub Pages (бесплатно) / GitLab Pages (self-hosted) |

Внешних зависимостей в браузере нет — только сгенерированный HTML + CSS + JS.

---

## Быстрый старт

### 1. Создай репозиторий на GitHub

Создай **пустой** приватный репозиторий на [github.com/new](https://github.com/new) — без README, .gitignore и лицензии.

### 2. Запушь код

```bash
# Переименуй ветку master → main
git branch -m master main

# Добавь remote (замени YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/dsgn-plan.git

git push -u origin main
```

### 3. Добавь секрет SITE_PASSWORD

**Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `SITE_PASSWORD` | придуманный пароль |

### 4. Включи GitHub Pages

**Settings → Pages → Source: Deploy from a branch → `gh-pages` / `root`**

> Ветка `gh-pages` появляется автоматически после первого деплоя.

### 5. Первый деплой запустится сам

После шага 2 Actions уже должен работать. Следи во вкладке **Actions** репозитория. Готовый сайт:

```
https://YOUR_USERNAME.github.io/dsgn-plan/
```

---

## Локальная разработка

```bash
cp .env.example .env   # впиши SITE_PASSWORD=<пароль>
npm install
npm run dev            # → http://localhost:3000
```

В режиме `dev` сервер отслеживает изменения YAML и пересобирает автоматически.

```bash
npm run build          # разовая сборка → dist/index.html
```

---

## Добавить команду

```bash
cp data/_template.yaml data/2026/teams/<название>.yaml
```

Заполни файл, закоммить, запушь — сайт обновится сам.

---

## Структура YAML

Полный шаблон с комментариями: `data/_template.yaml`

| Поле | Описание |
|---|---|
| `team` | Название команды |
| `owner` | Имя лида |
| `display.color` | Hex-цвет полос на гант-чарте |
| `tracks[].name` | Название трека |
| `tracks[].goal` | Долгосрочная цель трека |
| `tracks[].objectives[].title` | Название objective |
| `tracks[].objectives[].quarter` | `Q1`–`Q4`, `"Q2-Q3"` или `null` |
| `tracks[].objectives[].key_results[]` | KR: `title` |
| `kpis[]` | Командные метрики: `name`, `description`, `target` |

Год берётся автоматически из пути файла: `data/<год>/teams/<команда>.yaml`

---

## Миграция на GitLab

Замени `.github/workflows/deploy.yml` на GitLab CI:

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

GitLab Pages раздаёт артефакт `public/` автоматически.
