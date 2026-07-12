import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  getStreamLogDir,
  shouldUseDurableStreamStorage,
} from "../constants/stream-log";
import { appendDurableStreamEvent } from "./stream-storage";

let ensuredLogDir: string | undefined;

export async function appendStreamEvent(
  sessionId: string,
  event: unknown
): Promise<void> {
  try {
    if (shouldUseDurableStreamStorage()) {
      await appendDurableStreamEvent(sessionId, event);
      return;
    }

    const streamLogDir = getStreamLogDir();
    if (ensuredLogDir !== streamLogDir) {
      await mkdir(streamLogDir, { recursive: true });
      ensuredLogDir = streamLogDir;
    }
    await appendFile(
      path.join(streamLogDir, `${sessionId}.ndjson`),
      `${JSON.stringify(event)}\n`
    );
  } catch (error) {
    ensuredLogDir = undefined;
    console.error("Failed to persist onboarding stream event", error);
  }
}
