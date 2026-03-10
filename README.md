# Google Reviews Scraper

Scrape Google Reviews from any business into structured data — with a web UI or CLI. Extracts reviewer names, review text, star ratings, dates, profile pictures, and business metadata.

![Web UI](https://img.shields.io/badge/Web_UI-Next.js_15-black) ![CLI](https://img.shields.io/badge/CLI-Bun-f5a623) ![Playwright](https://img.shields.io/badge/Browser-Playwright-2ead33)

---

## Quick Start

### 1. Install

```bash
# Clone & install (use bun or npm)
bun install            # or: npm install
bunx playwright install chromium   # or: npx playwright install chromium

# Set up the web app
cd web
bun install            # or: npm install
```

### 2. Run the Web UI

```bash
cd web
bun run dev            # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — enter a Google Maps URL or place name, hit Scrape, and watch the results stream in.

### 3. Download Results

After scraping, download as **JSON**, **CSV**, or **ZIP** (includes profile pictures). All previous scrapes are listed below the form — download or delete them anytime.

---

## AI Review Ranking (Optional)

Rank reviews by how well they'd work on a website — scores each review 1–10 based on specificity, professionalism, and usefulness.

### Setup

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

3. Add your key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

4. Symlink it for the web app (if not already done):

```bash
ln -s ../.env web/.env
```

5. Check the **AI rank reviews** option in the web UI before scraping.

---

## CLI Usage

The CLI works independently of the web app.

```bash
# Search by place name
bun run src/index.ts 'My Favorite Restaurant' --max=20
# or: npx tsx src/index.ts 'My Favorite Restaurant' --max=20

# Google Maps URL with filters
bun run src/index.ts 'https://www.google.com/maps/place/...' --min-stars=4 --sort=newest

# AI ranking + CSV export
bun run src/index.ts 'My Favorite Restaurant' --max=30 --ai-rank --output=csv

# Debug mode (visible browser)
bun run src/index.ts 'My Favorite Restaurant' --max=5 --no-headless
```

### CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--max` | `50` | Maximum reviews to scrape |
| `--min-stars` | — | Filter by minimum rating (1–5) |
| `--sort` | relevance | Sort: `newest`, `highest`, `lowest` |
| `--ai-rank` | off | Rank reviews by website-worthiness (requires API key) |
| `--output` | `json` | Output format: `json`, `csv` |
| `--no-headless` | off | Show browser window for debugging |

Output is saved to `output/` with timestamped directories.

---

## Project Structure

```
src/                          # Shared scraper core (CLI + Web)
├── index.ts                  # CLI entry point
├── scraper.ts                # Playwright browser automation
├── parser.ts                 # DOM parsing & data extraction
├── ranker.ts                 # AI review ranking (Claude)
└── utils.ts                  # URL helpers, CSV export, retry logic

web/                          # Next.js web app
├── app/
│   ├── page.tsx              # Main UI
│   └── api/
│       ├── scrape/           # POST — start scrape job
│       ├── jobs/[jobId]/     # GET  — SSE progress stream
│       ├── download/[jobId]/ # GET  — download results
│       └── outputs/          # GET/DELETE — manage previous scrapes
├── components/               # React components
└── lib/                      # Job store, types

output/                       # Scraped data (auto-created)
```

---

## Tech Stack

- **TypeScript** + **Bun** runtime
- **Playwright** for headless browser automation
- **Next.js 15** (App Router) + **React 19** for the web UI
- **Tailwind CSS v4** for styling
- **Claude Haiku** for AI review ranking
- **SSE** for real-time scrape progress

---

## Disclaimer

This tool is for personal use only. Scraping Google Maps may violate Google's Terms of Service. Use at your own risk.
