import ReviewRow from "./ReviewRow";
import type { Review } from "@/lib/types";

interface ReviewsTableProps {
  reviews: Review[];
}

export default function ReviewsTable({ reviews }: ReviewsTableProps) {
  const hasAiScores = reviews.some((r) => r.relevanceScore !== undefined);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                #
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                Reviewer
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                Rating
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                Review
              </th>
              {hasAiScores && (
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                  AI Score
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {reviews.map((review, i) => (
              <ReviewRow
                key={i}
                review={review}
                index={i}
                showAiScore={hasAiScores}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
