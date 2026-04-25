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
  status: 'PENDING' | 'VALID' | 'INVALID' | 'DUPLICATE' | 'MAPPED';
  errors?: string[];
  matchedAssetId?: string;
  matchedAssetName?: string;
  isNewAsset?: boolean;
  suggestedSymbol?: string;
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  newAssets: number;
  matchedAssets: number;
  totalAmount: number;
}
