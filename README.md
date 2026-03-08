# Google Reviews Scraper

Scrape Google Reviews from any Google Maps/Business URL into structured JSON. Extracts reviewer names, review text, star ratings, dates, and upscaled profile picture URLs.

## Setup

```bash
# Install dependencies
bun install

# Install Playwright browser
bunx playwright install chromium
```

## Usage

```bash
# Use single quotes to prevent shell expansion of ! characters in URLs
bun run src/index.ts 'https://www.google.com/maps/place/...' --max=50

# Show browser window for debugging
bun run src/index.ts 'https://www.google.com/maps/place/...' --max=5 --no-headless
```

### Options

| Flag            | Default | Description                         |
| --------------- | ------- | ----------------------------------- |
| `--max`         | `50`    | Maximum number of reviews to scrape |
| `--output`      | `json`  | Output format (`json`)              |
| `--no-headless` | `false` | Show browser window for debugging   |
| `--help`        |         | Show usage info                     |

Output is saved to the `output/` directory with a timestamped filename.

## Output Format

```json
[
  {
    "reviewerName": "John Doe",
    "text": "Great place, highly recommend!",
    "stars": 5,
    "profilePicUrl": "https://lh3.googleusercontent.com/a/...=s256-c",
    "date": "2 months ago"
  }
]
```

## Tech Stack

- **TypeScript** + **Bun**
- **Playwright** for browser automation

## Project Structure

```
src/
├── index.ts       # CLI entry point, arg parsing
├── scraper.ts     # Playwright scraping logic
├── parser.ts      # DOM parsing, data extraction
└── utils.ts       # URL manipulation, helpers
output/            # Generated output files
docs/plan.md       # Detailed project plan
```

## Roadmap

1. **CLI Script (MVP)** — Playwright scraper outputting JSON *(current phase)*
2. **Web UI** — Next.js app with scraping API route
3. **Figma Plugin** — Paste a URL, auto-populate design layers with real review data

## Disclaimer

This tool is for educational and personal use only. Scraping Google Maps may violate Google's Terms of Service. The authors are not responsible for how this tool is used. Use at your own risk.

## License

Personal use only.
