# Google Reviews Scraper — Project Plan

## Overview

A tool that scrapes Google Reviews from a provided Google Maps/Business URL and outputs structured data (reviewer name, review text, star rating, upscaled profile picture URL).

**Stack:** TypeScript, Playwright, Node.js
**Target user:** Designer friend who needs review data for client website mockups/builds.

---

## Phase 1 — CLI Script (MVP)

Build a TypeScript CLI script using Playwright that:

1. Accepts a Google Maps/Business URL as input (CLI argument)
2. Launches headless Chromium, navigates to the URL
3. Clicks the "Reviews" tab if not already active
4. Scrolls through the reviews list to load all/enough reviews (Google lazy-loads them)
5. For each review, extracts from the DOM:
   - **Reviewer name** — text content
   - **Review text** — full text (handle "More" button expansion)
   - **Star rating** — parse from aria-label or count filled star elements
   - **Profile picture URL** — extract `src`, replace size param (`=s72-c` → `=s256-c`)
6. Outputs a JSON file (`reviews.json`) with the scraped data

### Data Schema

```typescript
interface Review {
  reviewerName: string;
  text: string;
  stars: number; // 1-5
  profilePicUrl: string; // upscaled
  date: string; // relative date string e.g. "2 months ago"
}
```

### Key Implementation Notes

- Use Playwright over Puppeteer (better API, cross-browser support)
- Add configurable max review count (default: 50) to avoid infinite scrolling
- Handle edge cases: reviews with no text (rating only), non-Latin characters
- Add a small random delay between scrolls to reduce detection risk
- Google Maps DOM structure changes — use resilient selectors (data attributes, aria-labels over class names)
- Respect Google's ToS considerations — this is for small-scale personal use

### Setup

```bash
mkdir google-reviews-scraper && cd google-reviews-scraper
npm init -y
npm install playwright typescript tsx @types/node
npx playwright install chromium
```

### File Structure

```
google-reviews-scraper/
├── src/
│   ├── index.ts          # CLI entry point, arg parsing
│   ├── scraper.ts        # Playwright scraping logic
│   ├── parser.ts         # DOM parsing, data extraction
│   └── utils.ts          # URL manipulation (pic upscale), helpers
├── output/               # Generated JSON/CSV files
├── tsconfig.json
├── package.json
└── README.md
```

### Run Command

```bash
npx tsx src/index.ts "https://maps.google.com/maps/place/..." --max=50 --output=json
```

---

## Phase 2 — Web UI

Wrap the scraper in a simple Next.js app:

1. Single-page UI — input field for URL, "Scrape" button, results table
2. Backend API route (`/api/scrape`) that runs the Playwright scraper
3. Display results in a table with profile pics, allow JSON/CSV download
4. Add a "Copy as JSON" button for easy use in other tools
5. Optional: image download — fetch all profile pics and zip them

### Tech

- Next.js (App Router, TypeScript)
- API route runs Playwright server-side
- Simple Tailwind UI — nothing fancy, functional
- Deploy consideration: Playwright needs a server environment (not Vercel serverless easily) — use a VPS (Hetzner) or run locally

---

## Phase 3 — Figma Plugin (Optional)

If the tool proves useful, wrap it as a Figma plugin:

1. Plugin UI lets user paste Google Maps URL
2. Calls an external API (the Phase 2 backend) to run the scrape
3. Returns data into Figma — auto-populates text layers and image fills in a template component
4. Needs a hosted backend since Figma plugins can't run Playwright

---

## Risks & Considerations

- **Google DOM changes** — selectors will break periodically, build with easy-to-update selector config
- **Rate limiting / blocking** — for heavy use, consider rotating user agents or adding proxy support
- **Legal** — scraping Google is against their ToS; keep it small-scale, personal use
- **Playwright binary size** — Chromium is ~200MB, fine for local/VPS, bad for serverless