"use client";

import { useState } from "react";

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
  const [minStars, setMinStars] = useState<number | undefined>();
  const [sort, setSort] = useState<"newest" | "highest" | "lowest" | "">("");
  const [aiRank, setAiRank] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit({
      url: url.trim(),
      maxReviews,
      minStars,
      sort: sort || undefined,
      aiRank,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Google Maps URL or place name..."
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !url.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? "Scraping..." : "Scrape"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowOptions(!showOptions)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <span
          className={`transition-transform inline-block ${showOptions ? "rotate-90" : ""}`}
        >
          ▶
        </span>
        Options
      </button>

      {showOptions && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max reviews
            </label>
            <input
              type="number"
              value={maxReviews}
              onChange={(e) => setMaxReviews(parseInt(e.target.value) || 50)}
              min={1}
              max={500}
              className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min stars
            </label>
            <select
              value={minStars ?? ""}
              onChange={(e) =>
                setMinStars(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={disabled}
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5 only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as "newest" | "highest" | "lowest" | "")
              }
              className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={disabled}
            >
              <option value="">Most relevant</option>
              <option value="newest">Newest</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aiRank}
                onChange={(e) => setAiRank(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={disabled}
              />
              <span className="text-sm font-medium text-gray-700">
                AI rank reviews
              </span>
            </label>
          </div>
        </div>
      )}
    </form>
  );
}
