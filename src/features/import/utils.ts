import { RawImportRow, ImportCategory } from "./types";

export function parseCSV(csvText: string): RawImportRow[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: RawImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Basic CSV split (doesn't handle quoted commas yet)
    const values = line.split(',').map(v => v.trim());
    const row: any = {};

    headers.forEach((header, index) => {
      const value = values[index];
      if (header === 'date') row.date = value;
      else if (header === 'type') row.type = value.toUpperCase();
      else if (header === 'symbol') row.symbol = value;
      else if (header === 'quantity') row.quantity = parseFloat(value);
      else if (header === 'price') row.price = parseFloat(value);
      else if (header === 'amount') row.amount = parseFloat(value);
      else if (header === 'description') row.description = value;
      else if (header === 'category') row.category = value.toUpperCase() as ImportCategory;
    });

    // Auto-detect category if missing
    if (!row.category) {
      row.category = row.symbol ? 'ASSET' : 'CASH';
    }

    rows.push(row as RawImportRow);
  }

  return rows;
}

export function validateImportRow(row: RawImportRow): string[] {
  const errors: string[] = [];
  
  if (!row.date || isNaN(Date.parse(row.date))) errors.push('Invalid date');
  if (!row.type) errors.push('Type is required');
  if (row.category === 'ASSET' && !row.symbol) errors.push('Symbol is required for asset transactions');
  if (isNaN(row.amount)) errors.push('Valid amount is required');
  
  return errors;
}
