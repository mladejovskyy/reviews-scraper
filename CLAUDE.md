# Google Reviews Scraper

## Project Overview

A tool that scrapes Google Reviews from a Google Maps/Business URL and outputs structured data (reviewer name, review text, star rating, upscaled profile picture URL). Built for a designer who needs review data for client website mockups/builds.

Full project plan: `docs/plan.md`

## Stack

- TypeScript, Bun, Playwright
- Always use `bun` to run code, install packages, and execute scripts

## Project Structure

```
src/
├── index.ts          # CLI entry point, arg parsing
├── scraper.ts        # Playwright scraping logic
├── parser.ts         # DOM parsing, data extraction
└── utils.ts          # URL manipulation (pic upscale), helpers
output/               # Generated JSON/CSV files
docs/
└── plan.md           # Detailed project plan (phases, schema, risks)
```

## Data Schema

```typescript
interface Review {
  reviewerName: string;
  text: string;
  stars: number;        // 1-5
  profilePicUrl: string; // upscaled (=s256-c)
  date: string;         // relative date string e.g. "2 months ago"
}
```

## Commands

```bash
# Install dependencies
bun install

# Install Playwright browser
bunx playwright install chromium

# Run the scraper
bun run src/index.ts "https://maps.google.com/maps/place/..." --max=50 --output=json
```

## Key Implementation Guidelines

- Use resilient selectors (data attributes, aria-labels) over class names — Google Maps DOM changes frequently
- Add random delays between scrolls to reduce detection risk
- Handle edge cases: reviews with no text (rating only), non-Latin characters, "More" button expansion
- Default max review count: 50 to avoid infinite scrolling
- Profile pic upscaling: replace `=s72-c` with `=s256-c` in URL
- Small-scale personal use only

## Phases

1. **Phase 1 (MVP):** CLI script — Playwright scraper outputting JSON
2. **Phase 2:** Web UI — Next.js app with API route running Playwright server-side
3. **Phase 3 (Optional):** Figma plugin calling the hosted backend
