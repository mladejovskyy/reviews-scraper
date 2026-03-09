"use client";

import { useEffect, useState, useCallback } from "react";
import StarRating from "./StarRating";

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
    if (!confirm(`Delete "${dirName}"? This cannot be undone.`)) return;

    setDeleting(dirName);
    try {
      const res = await fetch(`/api/outputs/${encodeURIComponent(dirName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.dirName !== dirName));
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  if (entries.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Previous Scrapes
      </h2>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.dirName}
            className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 truncate">
                {entry.businessName}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                {entry.rating > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      <StarRating rating={Math.round(entry.rating)} />
                      <span>{entry.rating}</span>
                    </div>
                    <span>·</span>
                  </>
                )}
                {entry.totalReviews > 0 && (
                  <>
                    <span>{entry.totalReviews.toLocaleString()} total reviews</span>
                    <span>·</span>
                  </>
                )}
                <span>{entry.reviewCount} scraped</span>
                {entry.avgStars > 0 && (
                  <>
                    <span>·</span>
                    <span>avg {entry.avgStars}★</span>
                  </>
                )}
                <span>·</span>
                <span>
                  {new Date(entry.scrapedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(["json", "csv", "zip"] as const).map((fmt) => (
                <a
                  key={fmt}
                  href={`/api/outputs/${encodeURIComponent(entry.dirName)}/download?format=${fmt}`}
                  download={`${entry.dirName}.${fmt}`}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors uppercase"
                >
                  {fmt}
                </a>
              ))}
              <button
                onClick={() => handleDelete(entry.dirName)}
                disabled={deleting === entry.dirName}
                className="px-3 py-1.5 text-xs font-medium rounded border border-red-200 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {deleting === entry.dirName ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
