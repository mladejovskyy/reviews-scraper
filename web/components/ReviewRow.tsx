import { X } from "lucide-react";
import StarRating from "./StarRating";
import CopyButton from "./CopyButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Review } from "@/lib/types";

interface ReviewRowProps {
  review: Review;
  index: number;
  showAiScore: boolean;
  onRemove?: () => void;
}

export default function ReviewRow({
  review,
  index,
  showAiScore,
  onRemove,
}: ReviewRowProps) {
  return (
    <Card className="group transition-colors hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {review.profilePicUrl && (
            <img
              src={review.profilePicUrl}
              alt={review.reviewerName}
              className="w-10 h-10 rounded-full bg-muted shrink-0"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{review.reviewerName}</span>
              {review.reviewerName && <CopyButton text={review.reviewerName} />}
              {showAiScore && review.relevanceScore !== undefined && (
                <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  {review.relevanceScore}/10
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.stars} />
              <span className="text-xs text-muted-foreground">
                {review.date}
              </span>
            </div>
            {review.text ? (
              <div className="mt-2 flex items-start gap-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {review.text}
                </p>
                <CopyButton text={review.text} />
              </div>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground/60">
                No text
              </p>
            )}
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="text-xs font-mono text-muted-foreground/40">
              {index + 1}
            </span>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={onRemove}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
