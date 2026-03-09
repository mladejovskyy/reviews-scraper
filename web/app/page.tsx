"use client";

import { useState, useCallback } from "react";
import ScrapeForm from "@/components/ScrapeForm";
import ProgressFeed from "@/components/ProgressFeed";
import BusinessCard from "@/components/BusinessCard";
import ReviewsTable from "@/components/ReviewsTable";
import DownloadBar from "@/components/DownloadBar";
import OutputHistory from "@/components/OutputHistory";
import type { ScrapeResult } from "@/lib/types";

type AppState = "idle" | "scraping" | "complete" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [progress, setProgress] = useState<string[]>([]);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const handleReset = useCallback(() => {
    setState("idle");
    setProgress([]);
    setResult(null);
    setJobId(null);
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (options: {
      url: string;
      maxReviews: number;
      minStars?: number;
      sort?: "newest" | "highest" | "lowest";
      aiRank: boolean;
    }) => {
      setState("scraping");
      setProgress([]);
      setResult(null);
      setError(null);
      setJobId(null);

      try {
        const res = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to start scrape");
        }

        const { jobId: id } = await res.json();
        setJobId(id);

        // Connect to SSE stream
        const eventSource = new EventSource(`/api/jobs/${id}`);

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === "progress") {
            setProgress((prev) => [...prev, data.message]);
          } else if (data.type === "complete") {
            setResult(data.result);
            setState("complete");
            setHistoryKey((k) => k + 1);
            eventSource.close();
          } else if (data.type === "error") {
            setError(data.error);
            setState("error");
            eventSource.close();
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          setState((prev) => {
            if (prev === "scraping") {
              setError("Connection lost");
              return "error";
            }
            return prev;
          });
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setState("error");
      }
    },
    []
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Google Reviews Scraper
        </h1>
        <p className="mt-2 text-gray-500">
          Extract reviews from Google Maps for website mockups
        </p>
      </div>

      <ScrapeForm onSubmit={handleSubmit} disabled={state === "scraping"} />

      {progress.length > 0 && (
        <div className="mt-6">
          <ProgressFeed messages={progress} isActive={state === "scraping"} />
        </div>
      )}

      {state === "error" && error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Scraping failed</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {(state === "complete" || state === "error") && (
        <div className="mt-6">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            New Scrape
          </button>
        </div>
      )}

      {state === "complete" && result && (
        <div className="mt-6 space-y-6">
          <BusinessCard business={result.business} reviews={result.reviews} />

          <div className="flex items-center justify-end">
            {jobId && <DownloadBar jobId={jobId} />}
          </div>

          <ReviewsTable reviews={result.reviews} />
        </div>
      )}

      <OutputHistory refreshKey={historyKey} />
    </main>
  );
}
