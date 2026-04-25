import { RawImportRow, ImportCategory } from "./types";

export function parseCSV(csvText: string): RawImportRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  // Robust CSV splitting regex to handle quoted commas
  const splitLine = (text: string) => {
    const result = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map(h => h.toLowerCase());
  const rows: RawImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    const row: any = {};

    headers.forEach((header, index) => {
      const value = values[index] || "";
      if (header === 'date') row.date = value;
      else if (header === 'type') row.type = value.toUpperCase();
      else if (header === 'symbol') row.symbol = value.toUpperCase();
      else if (header === 'quantity') row.quantity = parseFloat(value.replace(/,/g, '')) || 0;
      else if (header === 'price') row.price = parseFloat(value.replace(/,/g, '')) || 0;
      else if (header === 'amount') row.amount = parseFloat(value.replace(/,/g, '')) || 0;
      else if (header === 'description') row.description = value;
      else if (header === 'category') row.category = value.toUpperCase() as ImportCategory;
    });

    if (!row.category) {
      row.category = (row.symbol || row.quantity) ? 'ASSET' : 'CASH';
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
