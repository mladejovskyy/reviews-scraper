import { parseArgs } from "util";
import { mkdirSync } from "fs";
import { isValidGoogleMapsUrl, getOutputFilePath } from "./utils";
import { scrapeReviews, type ScrapeResult } from "./scraper";

const USAGE = `
Google Reviews Scraper

Usage:
  bun run src/index.ts <google-maps-url-or-place-name> [options]

Options:
  --max <number>       Maximum reviews to scrape (default: 50)
  --min-stars <1-5>    Only include reviews with this rating or higher
  --ai-rank            Rank reviews by website-worthiness using AI (requires ANTHROPIC_API_KEY)
  --output <format>    Output format: json (default: json)
  --no-headless        Show browser window for debugging
  --help               Show this help message

Examples:
  bun run src/index.ts 'https://www.google.com/maps/place/...' --max=20
  bun run src/index.ts 'Zámecký hotel & wellness' --max=10

Note: Use single quotes around the URL/name to prevent shell expansion of special characters.
`;

function printSummary(result: ScrapeResult) {
  const { reviews, business } = result;
  const total = reviews.length;

  if (total === 0) {
    console.log("\nNo reviews scraped.");
    return;
  }

  const avg = (reviews.reduce((sum, r) => sum + r.stars, 0) / total).toFixed(1);
  const withText = reviews.filter((r) => r.text).length;
  const dist = [1, 2, 3, 4, 5].map(
    (s) => `${s}★: ${reviews.filter((r) => r.stars === s).length}`
  );

  console.log(`\n--- Summary ---`);
  if (business.name) console.log(`Business: ${business.name}`);
  console.log(`Reviews scraped: ${total}`);
  console.log(`Average rating: ${avg}`);
  console.log(`Distribution: ${dist.join("  ")}`);
  console.log(`With text: ${withText}/${total}`);
}

function main() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      max: { type: "string", default: "50" },
      "min-stars": { type: "string" },
      output: { type: "string", default: "json" },
      "ai-rank": { type: "boolean", default: false },
      "no-headless": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(USAGE);
    process.exit(0);
  }

  const input = positionals[0];
  if (!input) {
    console.error("Error: Please provide a Google Maps URL or place name.\n");
    console.log(USAGE);
    process.exit(1);
  }

  let url: string;
  if (isValidGoogleMapsUrl(input)) {
    url = input;
  } else {
    // Treat as a plain place name — build a Google Maps search URL
    url = `https://www.google.com/maps/search/${encodeURIComponent(input)}`;
    console.log(`Searching Google Maps for: "${input}"`);
  }

  const maxReviews = parseInt(values.max!, 10);
  if (isNaN(maxReviews) || maxReviews < 1) {
    console.error("Error: --max must be a positive number.\n");
    process.exit(1);
  }

  let minStars: number | undefined;
  if (values["min-stars"]) {
    minStars = parseInt(values["min-stars"], 10);
    if (isNaN(minStars) || minStars < 1 || minStars > 5) {
      console.error("Error: --min-stars must be a number between 1 and 5.\n");
      process.exit(1);
    }
  }

  const outputFormat = values.output!;
  if (outputFormat !== "json") {
    console.error("Error: Only JSON output is currently supported.\n");
    process.exit(1);
  }

  const aiRank = values["ai-rank"]!;
  if (aiRank && !process.env.ANTHROPIC_API_KEY) {
    console.error(
      "Error: --ai-rank requires ANTHROPIC_API_KEY environment variable.\n" +
        "Set it in your .env file or export it in your shell."
    );
    process.exit(1);
  }

  const headless = !values["no-headless"];

  // Ensure output directories exist
  mkdirSync("output/images", { recursive: true });

  run(url, maxReviews, outputFormat, headless, minStars, aiRank);
}

async function run(
  url: string,
  maxReviews: number,
  outputFormat: string,
  headless: boolean,
  minStars?: number,
  aiRank?: boolean
) {
  try {
    console.log(`\nScraping reviews from:\n  ${url}\n`);

    const result = await scrapeReviews({ url, maxReviews, headless, minStars, aiRank });

    const outputPath = getOutputFilePath(outputFormat);
    await Bun.write(outputPath, JSON.stringify(result, null, 2));

    printSummary(result);
    console.log(`Output saved to: ${outputPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nScraping failed: ${message}`);

    if (message.includes("net::ERR_")) {
      console.error("Hint: Check your internet connection or the URL.");
    } else if (message.includes("Timeout")) {
      console.error("Hint: The page took too long to load. Try again.");
    }

    process.exit(1);
  }
}

main();
