import ReviewRow from "./ReviewRow";
import type { Review } from "@/lib/types";

interface ReviewsTableProps {
  reviews: Review[];
  onRemove?: (index: number) => void;
}

export default function ReviewsTable({ reviews, onRemove }: ReviewsTableProps) {
  const hasAiScores = reviews.some((r) => r.relevanceScore !== undefined);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {reviews.map((review, i) => (
        <ReviewRow
          key={i}
          review={review}
          index={i}
          showAiScore={hasAiScores}
          onRemove={onRemove ? () => onRemove(i) : undefined}
        />
      ))}
    </div>
  );
}
