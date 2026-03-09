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

export interface ScrapeResult {
  business: Business;
  reviews: Review[];
  totalFound: number;
  url: string;
  scrapedAt: string;
}

export interface JobEvent {
  type: "progress" | "complete" | "error";
  message?: string;
  result?: ScrapeResult;
  error?: string;
}

export interface ScrapeRequest {
  url: string;
  maxReviews?: number;
  minStars?: number;
  sort?: "newest" | "highest" | "lowest";
  aiRank?: boolean;
}
