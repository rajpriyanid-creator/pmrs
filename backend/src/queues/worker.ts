import "../config/env";
import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis";
import { connectDatabase } from "../config/db";
import { logger } from "../config/logger";
import { fillDocxTemplate, docxToHtml, htmlToDocxBuffer } from "../services/docxService";
import { autoGenerateSchedule } from "../services/schedulerService";
import { emitDocumentGenerated, emitScheduleGenerated, initSocket } from "../config/socket";
import http from "node:http";

/**
 * Standalone worker process (`npm run worker`) - separate from the API
 * process so a slow DOCX render or bulk Excel export never steals event-loop
 * time from request handling.
 */
async function main() {
  await connectDatabase();
  const connection = createRedisConnection();
  // Workers need Socket.IO only to notify completion; a minimal HTTP server
  // backs it here since this process serves no other routes.
  initSocket(http.createServer());

  new Worker(
    "document-jobs",
    async (job) => {
      const { templateBuffer, data, userId } = job.data as {
        templateBuffer: string; // base64
        data: Record<string, unknown>;
        userId: string;
      };
      const buffer = fillDocxTemplate(Buffer.from(templateBuffer, "base64"), data);
      emitDocumentGenerated(userId, { jobId: job.id, size: buffer.length });
      return { size: buffer.length };
    },
    { connection },
  );

  new Worker(
    "document-jobs-live-edit",
    async (job) => {
      const { docxBuffer, mode, html } = job.data as {
        docxBuffer?: string;
        mode: "toHtml" | "toDocx";
        html?: string;
      };
      if (mode === "toHtml") return { html: await docxToHtml(Buffer.from(docxBuffer!, "base64")) };
      return { docx: (await htmlToDocxBuffer(html!)).toString("base64") };
    },
    { connection },
  );

  new Worker(
    "schedule-jobs",
    async (job) => {
      const { program, reviewType } = job.data as { program: string; reviewType: any };
      const results = await autoGenerateSchedule(program, reviewType);
      emitScheduleGenerated(program, { jobId: job.id, results });
      return results;
    },
    { connection },
  );

  logger.info("Worker process started - listening on document-jobs, document-jobs-live-edit, schedule-jobs");
}

main().catch((err) => {
  logger.error({ err }, "Worker failed to start");
  process.exit(1);
});
