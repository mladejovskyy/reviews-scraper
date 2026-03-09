import type { Page, ElementHandle } from "playwright";
import { upscaleProfilePicUrl } from "./utils";

export interface Review {
  reviewerName: string;
  text: string;
  stars: number;
  profilePicUrl: string;
  profilePicPath?: string;
  date: string;
  relevanceScore?: number;
}

export interface Business {
  name: string;
  rating: number;
  totalReviews: number;
  address: string;
}

export const SELECTORS = {
  reviewCard: 'div[data-review-id]',
  reviewCardFallback: '.jftiEf',
  // Stars: aria-label contains a digit followed by a space — works in any language
  stars: 'span[role="img"]',
  reviewText: ".wiI7pd",
  reviewerName: '.d4r55, button[data-href*="/maps/contrib/"] > div',
  date: ".rsqaWe",
  profileImage: 'img[src*="googleusercontent"]',
  // "See more" / "Zobrazit více" etc. — match by class instead
  moreButton: 'button.w8nwRe.kyuRq',
  scrollablePanel: 'div[role="feed"], .m6QErb.DxyBCb',
  sortButton: 'button[aria-label="Sort reviews"], button[data-value="sort"], .y7PRA',
  // Reviews tab: use role="tab" and match the tab that contains a review count (digits in parentheses)
  reviewsTab: 'button[role="tab"]',
  // Business metadata selectors
  businessName: 'h1',
  businessRating: 'div.F7nice span[aria-hidden="true"]',
  businessReviewCount: 'div.F7nice span[aria-label]',
  businessAddress: 'button[data-item-id="address"] div.fontBodyMedium, button[data-item-id="address"] .Io6YTe',
} as const;

/** Find the Reviews tab among all tabs — it's the one with a number (review count) */
export async function findReviewsTab(page: Page) {
  const tabs = await page.$$(SELECTORS.reviewsTab);
  for (const tab of tabs) {
    const text = await tab.textContent() ?? "";
    // The reviews tab contains a count in parentheses or just has digits, e.g. "Reviews (123)" or "Recenze(123)"
    if (/\(\d+\)/.test(text) || /recenz|review/i.test(text)) {
      return tab;
    }
  }
  // Fallback: typically the 2nd tab
  return tabs.length >= 2 ? tabs[1] : null;
}

export async function parseReviewCard(
  card: ElementHandle
): Promise<Review> {
  const reviewerName = await card
    .$eval(SELECTORS.reviewerName, (el) => el.textContent?.trim() ?? "")
    .catch(() => "");

  const starsText = await card
    .$eval(SELECTORS.stars, (el) => el.getAttribute("aria-label") ?? "")
    .catch(() => "");
  const starsMatch = starsText.match(/(\d)/);
  const stars = starsMatch ? parseInt(starsMatch[1], 10) : 0;

  const text = await card
    .$eval(SELECTORS.reviewText, (el) => el.textContent?.trim() ?? "")
    .catch(() => "");

  const profilePicUrl = await card
    .$eval(SELECTORS.profileImage, (el) => el.getAttribute("src") ?? "")
    .catch(() => "");

  const date = await card
    .$eval(SELECTORS.date, (el) => el.textContent?.trim() ?? "")
    .catch(() => "");

  return {
    reviewerName,
    text,
    stars,
    profilePicUrl: profilePicUrl ? upscaleProfilePicUrl(profilePicUrl) : "",
    date,
  };
}

export async function expandAllReviews(page: Page): Promise<void> {
  const buttons = await page.$$(SELECTORS.moreButton);
  for (const button of buttons) {
    await button.click().catch(() => {});
    await page.waitForTimeout(100);
  }
}


export async function getReviewCards(page: Page) {
  const cards = await page.$$(SELECTORS.reviewCard);
  if (cards.length > 0) return cards;
  return page.$$(SELECTORS.reviewCardFallback);
}

export async function getLoadedReviewCount(page: Page): Promise<number> {
  return (await getReviewCards(page)).length;
}

export async function parseBusinessInfo(page: Page): Promise<Business> {
  const name = await page
    .$eval(SELECTORS.businessName, (el) => el.textContent?.trim() ?? "")
    .catch(() => "");

  const ratingText = await page
    .$eval(SELECTORS.businessRating, (el) => el.textContent?.trim() ?? "")
    .catch(() => "");
  const rating = parseFloat(ratingText.replace(",", ".")) || 0;

  let totalReviews = 0;

  // Approach 1: aria-label on span inside div.F7nice (skip role="img" which is the star rating)
  const reviewCountText = await page
    .$$eval(SELECTORS.businessReviewCount, (els) => {
      const el = els.find(
        (e) =>
          /\d/.test(e.getAttribute("aria-label") ?? "") &&
          e.getAttribute("role") !== "img"
      );
      return el?.getAttribute("aria-label") ?? "";
    })
    .catch(() => "");
  const countMatch = reviewCountText.match(/(\d[\d,.\s]*\d|\d)/);
  if (countMatch) {
    totalReviews = parseInt(countMatch[1].replace(/[,.\s]/g, ""), 10);
  }

  // Approach 2: extract from Reviews tab text, e.g. "Recenze(123)" or "Reviews (1,234)"
  if (!totalReviews || isNaN(totalReviews)) {
    const tabText = await page
      .$$eval('button[role="tab"]', (tabs) => {
        const tab = tabs.find((t) => /\(\d/.test(t.textContent ?? ""));
        return tab?.textContent ?? "";
      })
      .catch(() => "");
    const tabMatch = tabText.match(/\((\d[\d,.\s]*)\)/);
    if (tabMatch) {
      totalReviews = parseInt(tabMatch[1].replace(/[,.\s]/g, ""), 10);
    }
  }

  // Approach 3: visible text near rating — look for any element with review count text like "(240)"
  if (!totalReviews || isNaN(totalReviews)) {
    const fNiceText = await page
      .$eval('div.F7nice', (el) => el.textContent ?? "")
      .catch(() => "");
    const visibleMatch = fNiceText.match(/\((\d[\d,.\s]*)\)/);
    if (visibleMatch) {
      totalReviews = parseInt(visibleMatch[1].replace(/[,.\s]/g, ""), 10);
    }
  }

  if (isNaN(totalReviews)) totalReviews = 0;

  const address = await page
    .$eval(SELECTORS.businessAddress, (el) => el.textContent?.trim() ?? "")
    .catch(() => "");

  return { name, rating, totalReviews, address };
}
