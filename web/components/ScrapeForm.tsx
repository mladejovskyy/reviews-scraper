"use client";

import { useState } from "react";
import { Search, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ScrapeFormProps {
  onSubmit: (options: {
    url: string;
    maxReviews: number;
    minStars?: number;
    sort?: "newest" | "highest" | "lowest";
    aiRank: boolean;
  }) => void;
  disabled: boolean;
}

export default function ScrapeForm({ onSubmit, disabled }: ScrapeFormProps) {
  const [url, setUrl] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [maxReviews, setMaxReviews] = useState(10);
  const [minStars, setMinStars] = useState<string>("");
  const [sort, setSort] = useState<string>("");
  const [aiRank, setAiRank] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit({
      url: url.trim(),
      maxReviews,
      minStars: minStars ? parseInt(minStars) : undefined,
      sort: (sort as "newest" | "highest" | "lowest") || undefined,
      aiRank,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Google Maps URL or place name..."
            className="pl-9 h-11"
            disabled={disabled}
          />
        </div>
        <Button
          type="submit"
          disabled={disabled || !url.trim()}
          className="h-11 px-6"
        >
          {disabled ? (
            <>
              <span className="animate-spin mr-1">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
              Scraping...
            </>
          ) : (
            "Scrape"
          )}
        </Button>
      </div>

      <Collapsible open={showOptions} onOpenChange={setShowOptions}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5 -ml-2"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                showOptions && "rotate-180"
              )}
            />
            Options
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Card className="mt-2 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxReviews">Max reviews</Label>
                <Input
                  id="maxReviews"
                  type="number"
                  value={maxReviews}
                  onChange={(e) =>
                    setMaxReviews(parseInt(e.target.value) || 10)
                  }
                  min={1}
                  max={500}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Min stars</Label>
                <Select
                  value={minStars}
                  onValueChange={setMinStars}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5 only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort by</Label>
                <Select
                  value={sort}
                  onValueChange={setSort}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Most relevant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevant">Most relevant</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="highest">Highest rating</SelectItem>
                    <SelectItem value="lowest">Lowest rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end pb-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id="aiRank"
                    checked={aiRank}
                    onCheckedChange={setAiRank}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor="aiRank"
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI rank reviews
                  </Label>
                </div>
              </div>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
}
