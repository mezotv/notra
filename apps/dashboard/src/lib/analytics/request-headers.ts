import { headers } from "next/headers";

export async function readRequestHeaders(): Promise<Headers | null> {
  try {
    return await headers();
  } catch {
    return null;
  }
}
