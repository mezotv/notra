import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

const STREAM_LOG_DIR = path.join(process.cwd(), "logs", "streams");

export async function appendStreamEvent(
  sessionId: string,
  event: unknown
): Promise<void> {
  try {
    await mkdir(STREAM_LOG_DIR, { recursive: true });
    await appendFile(
      path.join(STREAM_LOG_DIR, `${sessionId}.ndjson`),
      `${JSON.stringify(event)}\n`
    );
  } catch (error) {
    console.error("Failed to write stream log", error);
  }
}
