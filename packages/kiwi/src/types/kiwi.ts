export type KiwiValue = unknown;

export interface FieldDef {
  name: string;
  typeCode: number;
  isArray: boolean;
  value: number;
}

export interface Definition {
  name: string;
  kind: number;
  fields: FieldDef[];
}
