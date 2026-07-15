import type { HeaderRow } from "@/types/integrations";

export function createHeaderRow(): HeaderRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    value: "",
  };
}
