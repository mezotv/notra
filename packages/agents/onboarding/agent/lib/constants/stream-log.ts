import path from "node:path";

export function getStreamLogDir(): string {
  return path.join(process.cwd(), "logs", "streams");
}

export function getStreamReportDir(): string {
  return path.join(process.cwd(), "logs", "reports");
}
