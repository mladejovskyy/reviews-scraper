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
  stars: 'span[role="img"][aria-label*="star"]',
  reviewText: ".wiI7pd",
  reviewerName: '.d4r55, button[data-href*="/maps/contrib/"] > div',
  date: ".rsqaWe",
  profileImage: 'img[src*="googleusercontent"]',
  moreButton: 'button[aria-label="See more"]',
  scrollablePanel: 'div[role="feed"], .m6QErb.DxyBCb',
  reviewsTab: 'button[aria-label*="Reviews"]',
} as const;

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
