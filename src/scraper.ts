import { chromium } from "playwright";
import { join } from "path";
import { mkdirSync } from "fs";
import { randomDelay, sanitizeFilename } from "./utils";
import {
  SELECTORS,
  parseReviewCard,
  parseBusinessInfo,
  expandAllReviews,
  getLoadedReviewCount,
  findReviewsTab,
  type Review,
  type Business,
} from "./parser";

export interface ScrapeResult {
  business: Business;
  reviews: Review[];
  totalFound: number;
  url: string;
  scrapedAt: string;
}

export interface ScrapeOptions {
  url: string;
  maxReviews: number;
  headless: boolean;
  minStars?: number;
}

/** Extract a human-readable place name from a Google Maps URL */
function extractPlaceName(url: string): string | null {
  const match = decodeURIComponent(url).match(/\/maps\/place\/([^/@]+)/);
  if (!match) return null;
  return match[1].replace(/\+/g, " ");
}

async function downloadProfilePics(
  reviews: Review[],
  outputDir: string
): Promise<void> {
  const imagesDir = join(outputDir, "images");
  mkdirSync(imagesDir, { recursive: true });

  const total = reviews.filter((r) => r.profilePicUrl).length;
  let completed = 0;

  const results = await Promise.allSettled(
    reviews.map(async (review, index) => {
      if (!review.profilePicUrl) return;

      const filename = `${sanitizeFilename(review.reviewerName)}-${index}.jpg`;
      const filepath = join(imagesDir, filename);

      const response = await fetch(review.profilePicUrl);
      if (!response.ok) return;

      const buffer = await response.arrayBuffer();
      await Bun.write(filepath, buffer);

      review.profilePicPath = filepath;
      completed++;
      if (completed % 5 === 0 || completed === total) {
        console.log(`Downloading profile pictures... (${completed}/${total})`);
      }
    })
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    console.log(`Warning: ${failed} profile picture(s) failed to download.`);
  }
}

export async function scrapeReviews(
  options: ScrapeOptions
): Promise<ScrapeResult> {
  const { url, maxReviews, headless, minStars } = options;

  const browser = await chromium.launch({
    headless,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  try {
    const context = await browser.newContext({
      locale: "en-US",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });

    // Stealth: hide automation signals before any page loads
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
      // @ts-ignore
      window.chrome = { runtime: {} };
    });

    const page = await context.newPage();

    // Navigate directly to the place URL
    console.log("Navigating to place URL...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await randomDelay(2000, 3000);

    // Handle Google consent dialog (EU GDPR)
    const consentButton = await page.$(
      'button[aria-label="Accept all"], form[action*="consent"] button'
    );
    if (consentButton) {
      console.log("Accepting consent dialog...");
      await consentButton.click();
      await randomDelay(2000, 3000);

      // Re-navigate — consent redirect loses the place data
      console.log("Re-navigating to place URL...");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await randomDelay(2000, 3000);
    }

    // Check if the place actually loaded by looking for an h1 with text
    const h1 = await page.$('h1');
    const h1Text = h1 ? await h1.textContent() : null;
    const placeName = extractPlaceName(url);

    // If place didn't load (Google stripped the URL), use search as fallback
    if (!h1Text?.trim() && placeName) {
      console.log(`Place didn't load via URL. Searching for "${placeName}"...`);
      const searchBox = await page.$('input#searchboxinput, input[name="q"]');
      if (searchBox) {
        await searchBox.click();
        await searchBox.fill(placeName);
        await page.keyboard.press("Enter");
        await randomDelay(3000, 4000);

        // Wait for place to load from search
        await page
          .waitForSelector('h1', { timeout: 15000 })
          .catch(() => {
            throw new Error(
              `Could not find place "${placeName}". Try a more specific search term or URL.`
            );
          });
        await randomDelay(1000, 2000);
      }
    }

    // Verify place loaded
    console.log("Waiting for place to load...");
    await page
      .waitForSelector('h1', { timeout: 15000 })
      .catch(() => {
        throw new Error(
          "Place details did not load. Check that the URL points to a valid Google Maps place."
        );
      });

    const loadedName = await page.$eval('h1', (el) => el.textContent?.trim() ?? '').catch(() => '');
    if (loadedName) {
      console.log(`Place loaded: ${loadedName}`);
    }
    await randomDelay(500, 1000);

    // Scrape business metadata before switching to Reviews tab
    console.log("Extracting business metadata...");
    const business = await parseBusinessInfo(page);
    if (business.rating) {
      console.log(`  Rating: ${business.rating} (${business.totalReviews} reviews)`);
    }
    if (business.address) {
      console.log(`  Address: ${business.address}`);
    }

    // Click Reviews tab if not already active
    const reviewsTab = await findReviewsTab(page);
    if (reviewsTab) {
      const tabText = await reviewsTab.textContent() ?? "";
      console.log(`Clicking Reviews tab: "${tabText.trim()}"...`);
      await reviewsTab.click();
      await randomDelay(2000, 3000);
    } else {
      console.log("Warning: Could not find Reviews tab. Continuing anyway...");
    }

    // Wait for review cards to appear
    await page
      .waitForSelector(SELECTORS.reviewCard, { timeout: 10000 })
      .catch(() => {
        throw new Error(
          "No reviews found. The URL may not have reviews, or the page structure may have changed."
        );
      });

    // Find scrollable panel
    const scrollablePanel = await page.$(SELECTORS.scrollablePanel);
    if (!scrollablePanel) {
      throw new Error(
        "Could not find the reviews panel. Google Maps DOM may have changed."
      );
    }

    // Scroll-and-count loop
    console.log(`Scrolling to load up to ${maxReviews} reviews...`);
    let stagnantScrolls = 0;
    let previousCount = 0;
    const MAX_STAGNANT = 5;
    const MAX_SCROLLS = 100;

    for (let i = 0; i < MAX_SCROLLS; i++) {
      await scrollablePanel.evaluate((el) =>
        el.scrollBy({ top: 2000, behavior: "smooth" })
      );
      await randomDelay(1000, 2500);

      const currentCount = await getLoadedReviewCount(page);
      console.log(`  Scroll ${i + 1}: ${currentCount} reviews loaded`);

      if (currentCount >= maxReviews) {
        console.log("Target review count reached.");
        break;
      }

      if (currentCount === previousCount) {
        stagnantScrolls++;
        if (stagnantScrolls >= MAX_STAGNANT) {
          console.log(
            `No new reviews after ${MAX_STAGNANT} scrolls. All reviews likely loaded.`
          );
          break;
        }
      } else {
        stagnantScrolls = 0;
      }

      previousCount = currentCount;
    }

    // Expand truncated reviews
    console.log("Expanding truncated reviews...");
    await expandAllReviews(page);
    await randomDelay(500, 1000);

    // Parse all review cards
    const cards = await page.$$(SELECTORS.reviewCard);
    const reviewCards = cards.slice(0, maxReviews);

    console.log(`Parsing ${reviewCards.length} reviews...`);
    let reviews: Review[] = [];
    for (const card of reviewCards) {
      const review = await parseReviewCard(card);
      reviews.push(review);
    }

    // Filter by minimum star rating
    if (minStars) {
      const before = reviews.length;
      reviews = reviews.filter((r) => r.stars >= minStars);
      console.log(`Filtered by ${minStars}+ stars: ${reviews.length}/${before} reviews kept.`);
    }

    // Download profile pictures
    await downloadProfilePics(reviews, "output");

    return {
      business,
      reviews,
      totalFound: cards.length,
      url,
      scrapedAt: new Date().toISOString(),
    };
  } finally {
    await browser.close();
  }
}
