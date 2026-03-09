import type { ScrapeResult, JobEvent } from "./types";

export type JobStatus = "pending" | "scraping" | "complete" | "error";
export type JobListener = (event: JobEvent) => void;

export interface Job {
  id: string;
  status: JobStatus;
  progress: string[];
  result?: ScrapeResult;
  error?: string;
  outputDir?: string;
  createdAt: number;
  listeners: Set<JobListener>;
}

// Persist across Next.js dev hot-reloads via globalThis
const globalStore = globalThis as unknown as {
  __jobs?: Map<string, Job>;
  __jobsCleanup?: boolean;
};
if (!globalStore.__jobs) {
  globalStore.__jobs = new Map();
}
const jobs = globalStore.__jobs;

// Auto-cleanup after 1 hour (register once)
const CLEANUP_MS = 60 * 60 * 1000;
if (!globalStore.__jobsCleanup) {
  globalStore.__jobsCleanup = true;
  setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobs) {
      if (now - job.createdAt > CLEANUP_MS) {
        jobs.delete(id);
      }
    }
  }, CLEANUP_MS);
}

export function createJob(): Job {
  const id = crypto.randomUUID();
  const job: Job = {
    id,
    status: "pending",
    progress: [],
    createdAt: Date.now(),
    listeners: new Set(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function addProgress(job: Job, message: string) {
  job.progress.push(message);
  for (const listener of job.listeners) {
    listener({ type: "progress", message });
  }
}

export function completeJob(job: Job, result: ScrapeResult, outputDir: string) {
  job.status = "complete";
  job.result = result;
  job.outputDir = outputDir;
  for (const listener of job.listeners) {
    listener({ type: "complete", result });
  }
  job.listeners.clear();
}

export function failJob(job: Job, error: string) {
  job.status = "error";
  job.error = error;
  for (const listener of job.listeners) {
    listener({ type: "error", error });
  }
  job.listeners.clear();
}
