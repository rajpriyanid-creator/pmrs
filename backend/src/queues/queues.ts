import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis";

const connection = createRedisConnection();

/**
 * Background jobs (Section 3): anything non-instant runs here so request
 * threads never block on Excel/DOCX conversion or bulk notification fan-out.
 * The UI polls/receives a job-status update via Socket.IO rather than
 * blocking on a spinner.
 */
export const excelJobQueue = new Queue("excel-jobs", { connection });
export const documentJobQueue = new Queue("document-jobs", { connection });
export const notificationJobQueue = new Queue("notification-jobs", { connection });
export const scheduleJobQueue = new Queue("schedule-jobs", { connection });
