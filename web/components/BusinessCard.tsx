import StarRating from "./StarRating";
import type { Business, Review } from "@/lib/types";

interface BusinessCardProps {
  business: Business;
  reviews: Review[];
}

export default function BusinessCard({ business, reviews }: BusinessCardProps) {
  const scrapedCount = reviews.length;
  const scrapedAvg =
    scrapedCount > 0
      ? (reviews.reduce((sum, r) => sum + r.stars, 0) / scrapedCount).toFixed(1)
      : "0";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
        {business.rating > 0 && (
          <>
            <div className="flex items-center gap-1">
              <StarRating rating={Math.round(business.rating)} />
              <span className="font-medium">{business.rating}</span>
            </div>
            <span>·</span>
          </>
        )}
        {business.totalReviews > 0 && (
          <>
            <span>{business.totalReviews.toLocaleString()} total reviews</span>
            <span>·</span>
          </>
        )}
        {business.address && <span>{business.address}</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span>Scraped: {scrapedCount} reviews</span>
        <span>·</span>
        <div className="flex items-center gap-1">
          <span>Avg {scrapedAvg}</span>
          <StarRating rating={Math.round(Number(scrapedAvg))} />
        </div>
      </div>
    </div>
  );
}
