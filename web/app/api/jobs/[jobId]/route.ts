import { getJob } from "@/lib/job-store";
import type { JobEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: JobEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
          if (event.type === "complete" || event.type === "error") {
            controller.close();
          }
        } catch {
          // Stream already closed
        }
      };

      // Send existing progress
      for (const message of job.progress) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "progress", message })}\n\n`
          )
        );
      }

      // If already done, send final event and close
      if (job.status === "complete") {
        send({ type: "complete", result: job.result });
        return;
      }

      if (job.status === "error") {
        send({ type: "error", error: job.error });
        return;
      }

      // Subscribe to future events
      job.listeners.add(send);

      // Clean up on disconnect
      req.signal.addEventListener("abort", () => {
        job.listeners.delete(send);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
