"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface ProgressFeedProps {
  messages: string[];
  isActive: boolean;
}

export default function ProgressFeed({
  messages,
  isActive,
}: ProgressFeedProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="bg-zinc-950 dark:bg-zinc-900 border-zinc-800 overflow-hidden">
      <div className="p-4 max-h-64 overflow-y-auto font-mono text-sm">
        {messages.map((msg, i) => (
          <div key={i} className="text-emerald-400 leading-relaxed">
            <span className="text-zinc-600 mr-2 select-none">{">"}</span>
            {msg}
          </div>
        ))}
        {isActive && (
          <div className="text-emerald-400 animate-pulse mt-1">
            <span className="inline-block w-2 h-4 bg-emerald-400" />
          </div>
        )}
        <div ref={endRef} />
      </div>
    </Card>
  );
}
