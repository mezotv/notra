import { stat } from "node:fs/promises";
import path from "node:path";
import { getStreamLogDir } from "../agent/lib/constants/stream-log";
import { readDirectoryIfExists } from "../agent/lib/utils/file-system";
import { writeStreamReport } from "../agent/lib/utils/stream-report";

const requestedSessionId = process.argv[2];
const streamLogDir = getStreamLogDir();
const sessionId =
  requestedSessionId ??
  (
    await Promise.all(
      (
        await readDirectoryIfExists(streamLogDir)
      )
        .filter((entry) => entry.isFile() && entry.name.endsWith(".ndjson"))
        .map(async (entry) => ({
          modifiedAt: (await stat(path.join(streamLogDir, entry.name))).mtimeMs,
          sessionId: entry.name.slice(0, -".ndjson".length),
        }))
    )
  ).sort((left, right) => right.modifiedAt - left.modifiedAt)[0]?.sessionId;

if (!sessionId) {
  throw new Error(
    `No stream logs found in ${path.relative(process.cwd(), streamLogDir)}`
  );
}

const reportPath = await writeStreamReport(sessionId);
console.log(path.relative(process.cwd(), reportPath));
