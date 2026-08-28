import type { CsvDocument, CsvRecord } from "@/types/csv";

const BYTE_ORDER_MARK = "﻿";
const CANDIDATE_DELIMITERS = [",", ";", "\t"] as const;
const QUOTE = '"';

function headerSample(text: string): string {
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === QUOTE) {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && (char === "\n" || char === "\r")) {
      return text.slice(0, index);
    }
  }
  return text;
}

function countOutsideQuotes(sample: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (const char of sample) {
    if (char === QUOTE) {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char === delimiter) {
      count += 1;
    }
  }
  return count;
}

function detectCsvDelimiter(text: string): string {
  const sample = headerSample(text);
  let best: string = CANDIDATE_DELIMITERS[0];
  let bestCount = -1;
  for (const delimiter of CANDIDATE_DELIMITERS) {
    const count = countOutsideQuotes(sample, delimiter);
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

function isBlankRecord(cells: string[]): boolean {
  return cells.every((cell) => cell.trim().length === 0);
}

function parseCsvRecords(text: string, delimiter: string): CsvRecord[] {
  const source = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text;
  const records: CsvRecord[] = [];
  let cells: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const endRecord = () => {
    cells.push(field);
    if (!isBlankRecord(cells)) {
      records.push({ line: recordLine, cells });
    }
    cells = [];
    field = "";
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inQuotes) {
      if (char === QUOTE && next === QUOTE) {
        field += QUOTE;
        index += 1;
        continue;
      }
      if (char === QUOTE) {
        inQuotes = false;
        continue;
      }
      if (char === "\r" && next === "\n") {
        field += "\n";
        line += 1;
        index += 1;
        continue;
      }
      if (char === "\n" || char === "\r") {
        line += 1;
      }
      field += char;
      continue;
    }

    if (char === QUOTE) {
      inQuotes = true;
      continue;
    }
    if (char === delimiter) {
      cells.push(field);
      field = "";
      continue;
    }
    if (char === "\r" || char === "\n") {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      endRecord();
      line += 1;
      recordLine = line;
      continue;
    }
    field += char;
  }

  if (field.length > 0 || cells.length > 0) {
    endRecord();
  }

  return records;
}

function normalizeCsvHeaderCell(cell: string): string {
  return cell.trim().toLowerCase();
}

export function parseCsv(text: string): CsvDocument {
  const delimiter = detectCsvDelimiter(text);
  const records = parseCsvRecords(text, delimiter);
  const [headerRecord, ...rest] = records;
  if (!headerRecord) {
    return { delimiter, header: [], records: [] };
  }
  return {
    delimiter,
    header: headerRecord.cells.map(normalizeCsvHeaderCell),
    records: rest,
  };
}

export function csvColumnIndex(header: string[], name: string): number {
  return header.indexOf(normalizeCsvHeaderCell(name));
}

export function csvCell(record: CsvRecord, index: number): string {
  if (index < 0) {
    return "";
  }
  return (record.cells[index] ?? "").trim();
}
