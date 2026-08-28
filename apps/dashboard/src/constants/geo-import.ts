import type { GeoImportKind, GeoImportKindCopy } from "@/types/geo-import";

export const GEO_CSV_IMPORT_MAX_BYTES = 1024 * 1024;
export const GEO_CSV_IMPORT_MAX_ROWS = 500;
export const GEO_CSV_IMPORT_MAX_ISSUES_SHOWN = 5;
export const GEO_CSV_IMPORT_ACCEPT = {
  "text/csv": [".csv"],
  "text/plain": [".csv"],
  "application/csv": [".csv"],
  "application/vnd.ms-excel": [".csv"],
};
export const GEO_CSV_SYNONYM_SEPARATOR = "|";
export const GEO_CSV_TRUE_VALUES = new Set(["true", "yes", "y", "1", "on"]);
export const GEO_CSV_FALSE_VALUES = new Set(["false", "no", "n", "0", "off"]);

export const GEO_PROMPTS_CSV_COLUMNS = {
  prompt: "prompt",
  enabled: "enabled",
} as const;

export const GEO_COMPETITORS_CSV_COLUMNS = {
  name: "name",
  domain: "domain",
  kind: "kind",
  synonyms: "synonyms",
} as const;

export const GEO_PROMPTS_CSV_TEMPLATE = [
  "prompt,enabled",
  "what tools should I use for automating changelogs,true",
  "best AI visibility platforms for B2B SaaS,true",
  "how do I track brand mentions in ChatGPT,false",
].join("\n");

export const GEO_COMPETITORS_CSV_TEMPLATE = [
  "name,domain,kind,synonyms",
  "Acme Analytics,acme.com,direct,Acme|Acme Inc",
  "Globex,globex.io,indirect,",
].join("\n");

export const GEO_IMPORT_COPY: Record<GeoImportKind, GeoImportKindCopy> = {
  prompts: {
    title: "Import prompts",
    description: "One prompt per row. Optional enabled column.",
    noun: "prompt",
    nounPlural: "prompts",
    columns: "prompt, enabled",
    templateFilename: "notra-prompts-template.csv",
    template: GEO_PROMPTS_CSV_TEMPLATE,
  },
  competitors: {
    title: "Import competitors",
    description: "One competitor per row. Optional domain, kind and synonyms.",
    noun: "competitor",
    nounPlural: "competitors",
    columns: "name, domain, kind, synonyms",
    templateFilename: "notra-competitors-template.csv",
    template: GEO_COMPETITORS_CSV_TEMPLATE,
  },
};
