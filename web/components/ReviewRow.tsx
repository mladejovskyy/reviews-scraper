import StarRating from "./StarRating";
import type { Review } from "@/lib/types";

interface ReviewRowProps {
  review: Review;
  index: number;
  showAiScore: boolean;
}

export default function ReviewRow({
  review,
  index,
  showAiScore,
}: ReviewRowProps) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4 text-sm text-gray-400">{index + 1}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {review.profilePicUrl && (
            <img
              src={review.profilePicUrl}
              alt={review.reviewerName}
              className="w-8 h-8 rounded-full bg-gray-200"
              loading="lazy"
            />
          )}
          <span className="font-medium text-sm">{review.reviewerName}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <StarRating rating={review.stars} />
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">{review.date}</td>
      <td className="py-3 px-4 text-sm text-gray-700 max-w-md">
        {review.text ? (
          <p className="line-clamp-3">{review.text}</p>
        ) : (
          <span className="italic text-gray-400">No text</span>
        )}
      </td>
      {showAiScore && (
        <td className="py-3 px-4">
          {review.relevanceScore !== undefined ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {review.relevanceScore}/10
            </span>
          ) : null}
        </td>
      )}
    </tr>
  );
}
