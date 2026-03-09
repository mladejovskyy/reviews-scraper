"use client";

import { useEffect, useRef } from "react";

interface ProgressFeedProps {
  messages: string[];
  isActive: boolean;
}

export default function ProgressFeed({ messages, isActive }: ProgressFeedProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm">
      {messages.map((msg, i) => (
        <div key={i} className="text-green-400 leading-relaxed">
          <span className="text-gray-500 mr-2">{">"}</span>
          {msg}
        </div>
      ))}
      {isActive && (
        <div className="text-green-400 animate-pulse mt-1">▊</div>
      )}
      <div ref={endRef} />
    </div>
  );
}
