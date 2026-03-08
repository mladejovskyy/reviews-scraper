# Improvements

## Priority

- [x] **Download profile pictures** — Save images locally to `output/images/` so they can be dragged straight into Figma. Include local file paths in the JSON output alongside URLs.
- [x] **Business metadata** — Scrape overall rating, total review count, business name, and address. Include in the output JSON as a top-level `business` object.
- [x] **Filter by rating** — `--min-stars=4` flag to only include reviews at or above a given star rating. Useful for pulling positive reviews for mockups.

## Quick wins

- [x] **Auto-create output directory** — `mkdirSync("output", { recursive: true })` before writing so it works on a fresh clone without the directory existing.
- [x] **Accept plain place name** — Allow `bun run src/index.ts 'Zámecký hotel & wellness'` instead of requiring a full URL. Uses the existing search fallback.
- [x] **Progress summary** — After scraping, print a breakdown: total reviews, average rating, star distribution, count with/without text.

## Next up

- [x] **AI review ranking** — `--ai-rank` flag that sends review texts to Claude Haiku 4.5 and reorders them by how well they'd work on a website. Scores based on specificity, sentiment, length, and professionalism. Adds a `relevanceScore` field to each review.

## Nice to have

- [ ] **Sort control** — `--sort=newest|highest|lowest` to control review order via Google Maps' sort dropdown.
- [ ] **Owner responses** — Include the business owner's reply text if present on a review.
- [ ] **Translated text** — Option to grab original vs Google-translated review text.
- [ ] **Multiple URLs** — Accept a file with URLs to batch-scrape several businesses in one run.
- [ ] **Retry logic** — Auto-retry on flaky page loads or timeouts.
- [x] **Force English UI** — `--lang=en` flag to append `?hl=en` to the URL so the page loads in English regardless of IP location.
