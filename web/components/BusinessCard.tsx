import { MapPin, BarChart3 } from "lucide-react";
import StarRating from "./StarRating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Business, Review } from "@/lib/types";

interface BusinessCardProps {
  business: Business;
  reviews: Review[];
}

export default function BusinessCard({
  business,
  reviews,
}: BusinessCardProps) {
  const scrapedCount = reviews.length;
  const scrapedAvg =
    scrapedCount > 0
      ? (
          reviews.reduce((sum, r) => sum + r.stars, 0) / scrapedCount
        ).toFixed(1)
      : "0";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{business.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {business.rating > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={Math.round(business.rating)} size="md" />
              <span className="font-semibold">{business.rating}</span>
            </div>
          )}
          {business.totalReviews > 0 && (
            <Badge variant="secondary">
              {business.totalReviews.toLocaleString()} reviews
            </Badge>
          )}
          {business.address && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {business.address}
            </span>
          )}
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>
              Scraped: <span className="font-medium text-foreground">{scrapedCount}</span> reviews
            </span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1.5">
            <span>
              Avg <span className="font-medium text-foreground">{scrapedAvg}</span>
            </span>
            <StarRating rating={Math.round(Number(scrapedAvg))} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
