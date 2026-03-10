import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md";
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = "sm",
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className="inline-flex gap-0.5"
      title={`${rating} out of ${maxStars}`}
    >
      {Array.from({ length: maxStars }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClass,
            i < rating
              ? "fill-yellow-500 text-yellow-500"
              : "fill-muted text-muted-foreground/30"
          )}
        />
      ))}
    </span>
  );
}
