# Retry Logic & Sort Control

## Context

The Playwright scraper is inherently flaky — network timeouts, slow DOM loads, and Google's anti-bot measures cause random failures. Users have to manually re-run. Adding retry logic makes it reliable. Sort control (`--sort`) lets users pull newest/highest/lowest-rated reviews directly from Google Maps instead of scraping in default order.

## 1. Retry Logic

### `src/utils.ts` — add `retry()` helper

```typescript
async function retry<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelay = 2000): Promise<T>
```

- Exponential backoff: 2s, 4s, 8s
- Logs each retry attempt with attempt number
- On final failure, throws the original error

### `src/scraper.ts` — wrap flaky operations

Wrap these with `retry()`:
- `page.goto()` calls (lines 123, 137) — network flakiness
- `page.waitForSelector('h1')` (lines 158, 171) — DOM load delays
- Review card wait `waitForSelector(SELECTORS.reviewCard)` (line 207)

**Not retried** (already robust):
- Scroll loop (has stagnation detection)
- Card parsing (`.catch()` on each field)
- Image downloads (`Promise.allSettled`)

### No new CLI flag

Retry is always-on with sensible defaults (3 attempts). No `--retries` flag needed — keeps CLI simple.

## 2. Sort Control

### `src/parser.ts` — add sort selectors + function

Add to `SELECTORS`:
```typescript
sortButton: 'button[aria-label*="Sort"], button[data-value="Sort"]',
sortMenu: 'div[role="menu"], div[role="listbox"]',
```

Add function:
```typescript
async function selectSortOrder(page: Page, sort: "newest" | "highest" | "lowest"): Promise<void>
```

- Click sort button, wait for menu
- Map sort values to menu item index: newest=0 (or 1), highest=1 (or 2), lowest=2 (or 3)
- Click the matching `div[role="menuitemradio"]` or similar
- Wait for reviews to refresh
- Since Google Maps uses locale-dependent text for sort labels, match by index position rather than text content

### `src/scraper.ts` — call sort after reviews tab click

In `scrapeReviews()`, after clicking the Reviews tab and before the scroll loop:

```typescript
if (sort) {
  await selectSortOrder(page, sort);
}
```

Add `sort?: "newest" | "highest" | "lowest"` to `ScrapeOptions`.

### `src/index.ts` — add `--sort` flag

- `sort: { type: "string" }` in parseArgs
- Validate value is one of `newest | highest | lowest`
- Pass to `scrapeReviews()`
- Update USAGE text

### `docs/improvements.md` — check off both items

## File Summary

| File | Action |
|------|--------|
| `src/utils.ts` | Add `retry()` helper function |
| `src/parser.ts` | Add sort selectors + `selectSortOrder()` function |
| `src/scraper.ts` | Wrap flaky ops with `retry()`, add `sort` option, call `selectSortOrder()` |
| `src/index.ts` | Add `--sort` flag, validation, update USAGE |
| `docs/improvements.md` | Check off retry logic and sort control |

## Verification

```bash
# Type-check
bunx tsc --noEmit

# Test retry (should work as before, retries are transparent)
bun run src/index.ts 'Some Place' --max=5

# Test sort
bun run src/index.ts 'Some Place' --max=5 --sort=newest
bun run src/index.ts 'Some Place' --max=5 --sort=highest
```
