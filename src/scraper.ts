import { chromium } from "playwright";
import { randomDelay } from "./utils";
import {
  SELECTORS,
  parseReviewCard,
  expandAllReviews,
  getLoadedReviewCount,
  type Review,
} from "./parser";

export interface ScrapeResult {
  reviews: Review[];
  totalFound: number;
  url: string;
  scrapedAt: string;
}

export interface ScrapeOptions {
  url: string;
  maxReviews: number;
  headless: boolean;
}

export async function scrapeReviews(
  options: ScrapeOptions
): Promise<ScrapeResult> {
  const { url, maxReviews, headless } = options;

  const browser = await chromium.launch({
    headless,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  try {
    const context = await browser.newContext({
      locale: "en-US",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    // Navigate directly to the place URL
    console.log("Navigating to place URL...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await randomDelay(2000, 3000);

    // Handle Google consent dialog (EU GDPR)
    // Consent click causes a redirect that loses the place — re-navigate after
    const consentButton = await page.$(
      'button[aria-label="Accept all"], form[action*="consent"] button'
    );
    if (consentButton) {
      console.log("Accepting consent dialog...");
      await consentButton.click();
      await randomDelay(2000, 3000);

      // Re-navigate to the original URL now that consent cookies are set
      console.log("Re-navigating to place URL...");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await randomDelay(2000, 3000);
    }

    // Wait for the place details to load
    console.log("Waiting for place to load...");
    await page
      .waitForSelector('h1', { timeout: 15000 })
      .catch(() => {
        throw new Error(
          "Place details did not load. Check that the URL points to a valid Google Maps place."
        );
      });
    await randomDelay(500, 1000);

    // Click Reviews tab if not already active
    const reviewsTab = await page.$(SELECTORS.reviewsTab);
    if (reviewsTab) {
      console.log("Clicking Reviews tab...");
      await reviewsTab.click();
      await randomDelay(2000, 3000);
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
    const reviews: Review[] = [];
    for (const card of reviewCards) {
      const review = await parseReviewCard(card);
      reviews.push(review);
    }

    return {
      reviews,
      totalFound: cards.length,
      url,
      scrapedAt: new Date().toISOString(),
    };
  } finally {
    await browser.close();
  }
}
