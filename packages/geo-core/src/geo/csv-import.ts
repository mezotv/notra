import { Effect } from "effect";
import type { ZodType } from "zod";

import { GEO_MAX_COMPETITORS } from "../constants/geo";
import {
  GEO_COMPETITORS_CSV_COLUMNS,
  GEO_CSV_FALSE_VALUES,
  GEO_CSV_IMPORT_MAX_ROWS,
  GEO_CSV_SYNONYM_SEPARATOR,
  GEO_CSV_TRUE_VALUES,
  GEO_IMPORT_COPY,
  GEO_PROMPTS_CSV_COLUMNS,
} from "../constants/geo-import";
import { csvCell, csvColumnIndex, parseCsv } from "../csv/parse";
import {
  geoCompetitorImportRowSchema,
  geoPromptImportRowSchema,
} from "../schemas/geo-import";
import type { CsvDocument, CsvRecord } from "../types/csv";
import type {
  GeoCompetitorImportRow,
  GeoCsvIssue,
  GeoCsvParseResult,
  GeoCsvSelection,
  GeoImportKind,
  GeoPromptImportRow,
} from "../types/geo-import";
import { competitorKey } from "./domain";
import { GeoCsvReadError } from "./errors";
import { promptKey } from "./prompt-key";

interface CsvRowReader<TRow> {
  requiredColumn: string;
  maxRows: number;
  schema: ZodType<TRow>;
  toRaw: (record: CsvRecord, document: CsvDocument) => unknown;
  keyOf: (row: TRow) => string;
}

function emptyResult<TRow>(issues: GeoCsvIssue[]): GeoCsvParseResult<TRow> {
  return { rows: [], issues, duplicates: 0, total: 0 };
}

function toCsvBoolean(cell: string): boolean | string | undefined {
  if (cell.length === 0) {
    return undefined;
  }
  const normalized = cell.toLowerCase();
  if (GEO_CSV_TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (GEO_CSV_FALSE_VALUES.has(normalized)) {
    return false;
  }
  return cell;
}

function toOptionalCell(cell: string): string | undefined {
  return cell.length === 0 ? undefined : cell;
}

function toSynonyms(cell: string): string[] | undefined {
  if (cell.length === 0) {
    return undefined;
  }
  return cell
    .split(GEO_CSV_SYNONYM_SEPARATOR)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function readCsvRows<TRow>(
  text: string,
  reader: CsvRowReader<TRow>,
  kind: GeoImportKind
): GeoCsvParseResult<TRow> {
  const document = parseCsv(text);
  if (document.header.length === 0) {
    return emptyResult([{ line: 1, message: "The file is empty" }]);
  }
  if (csvColumnIndex(document.header, reader.requiredColumn) === -1) {
    return emptyResult([
      {
        line: 1,
        message: `Missing required column "${reader.requiredColumn}". Expected columns: ${GEO_IMPORT_COPY[kind].columns}`,
      },
    ]);
  }

  const rows: TRow[] = [];
  const issues: GeoCsvIssue[] = [];
  const seen = new Set<string>();
  let duplicates = 0;

  for (const record of document.records) {
    if (rows.length >= reader.maxRows) {
      issues.push({
        line: record.line,
        message: `Only the first ${reader.maxRows} rows are imported`,
      });
      break;
    }
    const parsed = reader.schema.safeParse(reader.toRaw(record, document));
    if (!parsed.success) {
      const message = parsed.error.issues.at(0)?.message ?? "Invalid row";
      issues.push({ line: record.line, message });
      continue;
    }
    const key = reader.keyOf(parsed.data);
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    rows.push(parsed.data);
  }

  return { rows, issues, duplicates, total: document.records.length };
}

const promptsReader: CsvRowReader<GeoPromptImportRow> = {
  requiredColumn: GEO_PROMPTS_CSV_COLUMNS.prompt,
  maxRows: GEO_CSV_IMPORT_MAX_ROWS,
  schema: geoPromptImportRowSchema,
  toRaw: (record, document) => ({
    prompt: csvCell(
      record,
      csvColumnIndex(document.header, GEO_PROMPTS_CSV_COLUMNS.prompt)
    ),
    enabled: toCsvBoolean(
      csvCell(
        record,
        csvColumnIndex(document.header, GEO_PROMPTS_CSV_COLUMNS.enabled)
      )
    ),
  }),
  keyOf: (row) => promptKey(row.prompt),
};

const competitorsReader: CsvRowReader<GeoCompetitorImportRow> = {
  requiredColumn: GEO_COMPETITORS_CSV_COLUMNS.name,
  maxRows: GEO_MAX_COMPETITORS,
  schema: geoCompetitorImportRowSchema,
  toRaw: (record, document) => ({
    name: csvCell(
      record,
      csvColumnIndex(document.header, GEO_COMPETITORS_CSV_COLUMNS.name)
    ),
    domain: toOptionalCell(
      csvCell(
        record,
        csvColumnIndex(document.header, GEO_COMPETITORS_CSV_COLUMNS.domain)
      )
    ),
    kind: toOptionalCell(
      csvCell(
        record,
        csvColumnIndex(document.header, GEO_COMPETITORS_CSV_COLUMNS.kind)
      ).toLowerCase()
    ),
    synonyms: toSynonyms(
      csvCell(
        record,
        csvColumnIndex(document.header, GEO_COMPETITORS_CSV_COLUMNS.synonyms)
      )
    ),
  }),
  keyOf: (row) => competitorKey(row.name),
};

export function parsePromptsCsv(
  text: string
): GeoCsvParseResult<GeoPromptImportRow> {
  return readCsvRows(text, promptsReader, "prompts");
}

export function parseCompetitorsCsv(
  text: string
): GeoCsvParseResult<GeoCompetitorImportRow> {
  return readCsvRows(text, competitorsReader, "competitors");
}

export const readGeoCsvFile = Effect.fn("geo.csvRead")(function* <TRow>(
  file: File,
  parse: (text: string) => GeoCsvParseResult<TRow>
) {
  const text = yield* Effect.tryPromise({
    try: () => file.text(),
    catch: (cause) => new GeoCsvReadError({ cause }),
  });
  const selection: GeoCsvSelection<TRow> = { file, result: parse(text) };
  return selection;
});
