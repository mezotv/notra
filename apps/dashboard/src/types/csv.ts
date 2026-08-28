export interface CsvRecord {
  line: number;
  cells: string[];
}

export interface CsvDocument {
  delimiter: string;
  header: string[];
  records: CsvRecord[];
}
