import Anthropic from "@anthropic-ai/sdk";
import type { Review } from "./parser";

const SYSTEM_PROMPT = `You are a review quality scorer. You will receive a list of customer reviews, each with an index number. Score each review from 1 to 10 on how well it would work on a business website.

Scoring criteria:
- Specificity: mentions particular services, products, or experiences (not just "great place")
- Professionalism: well-written, no excessive caps/emoji/slang
- Useful detail: gives prospective customers meaningful information
- Appropriate length: not too short (meaningless) or too long (wall of text)
- Positive sentiment: genuinely enthusiastic without feeling fake

Respond with ONLY a JSON array of objects with "index" and "score" fields. Example:
[{"index": 0, "score": 8}, {"index": 1, "score": 3}]`;

export async function rankReviews(reviews: Review[], onProgress?: (message: string) => void): Promise<Review[]> {
  const log = (msg: string) => { console.log(msg); onProgress?.(msg); };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log("Warning: ANTHROPIC_API_KEY not set. Skipping AI ranking.");
    return reviews;
  }

  // Only rank reviews that have text
  const reviewsWithText = reviews.filter((r) => r.text);
  if (reviewsWithText.length === 0) {
    log("No reviews with text to rank.");
    return reviews;
  }

  const reviewList = reviewsWithText
    .map((r, i) => `[${i}] (${r.stars}★) ${r.text}`)
    .join("\n\n");

  const userPrompt = `Score these ${reviewsWithText.length} reviews:\n\n${reviewList}`;

  try {
    log(`Ranking ${reviewsWithText.length} reviews with AI...`);

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON array from response (may be wrapped in markdown code block)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      log("Warning: Could not parse AI ranking response. Skipping.");
      return reviews;
    }

    const scores: { index: number; score: number }[] = JSON.parse(
      jsonMatch[0]
    );

    // Apply scores to reviews with text
    for (const { index, score } of scores) {
      if (index >= 0 && index < reviewsWithText.length) {
        reviewsWithText[index].relevanceScore = score;
      }
    }

    // Give text-less reviews a score of 0
    for (const review of reviews) {
      if (!review.text && review.relevanceScore === undefined) {
        review.relevanceScore = 0;
      }
    }

    // Sort all reviews by relevanceScore descending
    reviews.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

    log("AI ranking complete.");
    return reviews;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`Warning: AI ranking failed (${message}). Returning reviews unsorted.`);
    return reviews;
  }
}
