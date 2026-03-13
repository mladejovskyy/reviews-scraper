"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronRight,
  FileJson,
  FileSpreadsheet,
  FolderArchive,
  Trash2,
} from "lucide-react";
import StarRating from "./StarRating";
import ReviewsTable from "./ReviewsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ScrapeResult } from "@/lib/types";

interface OutputEntry {
  dirName: string;
  businessName: string;
  rating: number;
  totalReviews: number;
  reviewCount: number;
  avgStars: number;
  scrapedAt: string;
}

interface OutputHistoryProps {
  refreshKey: number;
}

export default function OutputHistory({ refreshKey }: OutputHistoryProps) {
  const [entries, setEntries] = useState<OutputEntry[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<ScrapeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/outputs");
      if (res.ok) setEntries(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries, refreshKey]);

  const handleDelete = async (dirName: string) => {
    setDeleting(dirName);
    try {
      const res = await fetch(`/api/outputs/${encodeURIComponent(dirName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.dirName !== dirName));
        if (expanded === dirName) {
          setExpanded(null);
          setExpandedData(null);
        }
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (dirName: string) => {
    if (expanded === dirName) {
      setExpanded(null);
      setExpandedData(null);
      return;
    }

    setExpanded(dirName);
    setExpandedData(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/outputs/${encodeURIComponent(dirName)}/reviews`
      );
      if (res.ok) {
        setExpandedData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveReview = async (index: number) => {
    if (!expanded || !expandedData) return;
    const updated = expandedData.reviews.filter((_, i) => i !== index);
    setExpandedData({ ...expandedData, reviews: updated });
    setEntries((prev) =>
      prev.map((e) =>
        e.dirName === expanded ? { ...e, reviewCount: updated.length } : e
      )
    );

    try {
      await fetch(`/api/outputs/${encodeURIComponent(expanded)}/reviews`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
    } catch {
      // ignore
    }
  };

  if (entries.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold mb-4">Previous Scrapes</h2>
      <div className="space-y-3">
        {entries.map((entry) => (
          <Collapsible
            key={entry.dirName}
            open={expanded === entry.dirName}
            onOpenChange={() => handleToggle(entry.dirName)}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                      >
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expanded === entry.dirName && "rotate-90"
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {entry.businessName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {entry.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <StarRating
                              rating={Math.round(entry.rating)}
                            />
                            <span className="text-sm font-medium">
                              {entry.rating}
                            </span>
                          </div>
                        )}
                        {entry.totalReviews > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {entry.totalReviews.toLocaleString()} total
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {entry.reviewCount} scraped
                        </Badge>
                        {entry.avgStars > 0 && (
                          <Badge variant="outline" className="text-xs">
                            avg {entry.avgStars}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.scrapedAt).toLocaleDateString(
                            undefined,
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(
                      [
                        { fmt: "json", icon: FileJson },
                        { fmt: "csv", icon: FileSpreadsheet },
                        { fmt: "zip", icon: FolderArchive },
                      ] as const
                    ).map(({ fmt, icon: Icon }) => (
                      <Button key={fmt} variant="outline" size="sm" asChild>
                        <a
                          href={`/api/outputs/${encodeURIComponent(entry.dirName)}/download?format=${fmt}`}
                          download={`${entry.dirName}.${fmt}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="uppercase text-xs">{fmt}</span>
                        </a>
                      </Button>
                    ))}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                          disabled={deleting === entry.dirName}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deleting === entry.dirName
                            ? "Deleting..."
                            : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete scrape data?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &ldquo;{entry.businessName}&rdquo; and all its data. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(entry.dirName)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>

              <CollapsibleContent>
                <div className="border-t p-4">
                  {loading && (
                    <p className="text-sm text-muted-foreground">
                      Loading reviews...
                    </p>
                  )}
                  {expandedData && (
                    <ReviewsTable reviews={expandedData.reviews} onRemove={handleRemoveReview} />
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
