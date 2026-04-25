export type ImportCategory = 'ASSET' | 'CASH';

export interface RawImportRow {
  date: string;
  type: string;
  symbol?: string;
  quantity?: number;
  price?: number;
  amount: number;
  description?: string;
  category: ImportCategory;
}

export interface ImportPreviewRow extends RawImportRow {
  id: string;
  status: 'PENDING' | 'VALID' | 'INVALID' | 'DUPLICATE';
  errors?: string[];
  matchedAssetId?: string;
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicates: number;
}
