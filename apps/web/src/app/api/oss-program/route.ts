import { jsonError } from "@/utils/revalidate-route";

export const runtime = "nodejs";

export function POST() {
  return jsonError("Applications are currently closed", 503);
}
