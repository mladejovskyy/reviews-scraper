import type { Page, ElementHandle } from "playwright";
import { upscaleProfilePicUrl } from "./utils";

export interface Review {
  reviewerName: string;
  text: string;
  stars: number;
  profilePicUrl: string;
  date: string;
}

export const SELECTORS = {
  reviewCard: 'div[data-review-id], .jftiEf',
  // Stars: aria-label contains a digit followed by a space — works in any language
  stars: 'span[role="img"]',
  reviewText: ".wiI7pd",
  reviewerName: '.d4r55, button[data-href*="/maps/contrib/"] > div',
  date: ".rsqaWe",
  profileImage: 'img[src*="googleusercontent"]',
  // "See more" / "Zobrazit více" etc. — match by class instead
  moreButton: 'button.w8nwRe.kyuRq',
  scrollablePanel: 'div[role="feed"], .m6QErb.DxyBCb',
  // Reviews tab: use role="tab" and match the tab that contains a review count (digits in parentheses)
  reviewsTab: 'button[role="tab"]',
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

export async function getLoadedReviewCount(page: Page): Promise<number> {
  return (await page.$$(SELECTORS.reviewCard)).length;
}
