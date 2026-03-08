import { parseArgs } from "util";
import { mkdirSync } from "fs";
import { isValidGoogleMapsUrl, getOutputFilePath } from "./utils";
import { scrapeReviews } from "./scraper";

const USAGE = `
Google Reviews Scraper

Usage:
  bun run src/index.ts <google-maps-url> [options]

Options:
  --max <number>       Maximum reviews to scrape (default: 50)
  --min-stars <1-5>    Only include reviews with this rating or higher
  --output <format>    Output format: json (default: json)
  --no-headless        Show browser window for debugging
  --help               Show this help message

Example:
  bun run src/index.ts 'https://www.google.com/maps/place/...' --max=20

Note: Use single quotes around the URL to prevent shell history expansion of ! characters.
`;

function main() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      max: { type: "string", default: "50" },
      "min-stars": { type: "string" },
      output: { type: "string", default: "json" },
      "no-headless": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(USAGE);
    process.exit(0);
  }

  const url = positionals[0];
  if (!url) {
    console.error("Error: Please provide a Google Maps URL.\n");
    console.log(USAGE);
    process.exit(1);
  }

  if (!isValidGoogleMapsUrl(url)) {
    console.error(
      "Error: Invalid Google Maps URL. Expected a URL like:\n" +
        "  https://www.google.com/maps/place/...\n"
    );
    process.exit(1);
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

  const headless = !values["no-headless"];

  // Ensure output directories exist
  mkdirSync("output/images", { recursive: true });

  run(url, maxReviews, outputFormat, headless, minStars);
}

async function run(
  url: string,
  maxReviews: number,
  outputFormat: string,
  headless: boolean,
  minStars?: number
) {
  try {
    console.log(`\nScraping reviews from:\n  ${url}\n`);

    const result = await scrapeReviews({ url, maxReviews, headless, minStars });

    const outputPath = getOutputFilePath(outputFormat);
    await Bun.write(outputPath, JSON.stringify(result, null, 2));

    console.log(`\nDone! ${result.reviews.length} reviews scraped.`);
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
