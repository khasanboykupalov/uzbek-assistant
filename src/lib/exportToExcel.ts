import * as XLSX from 'xlsx';

interface ExportOptions {
  filename: string;
  sheetName?: string;
}

export const exportToExcel = <T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  options: ExportOptions
) => {
  // Transform data to use custom headers
  const exportData = data.map((item) => {
    const row: Record<string, unknown> = {};
    columns.forEach((col) => {
      row[col.header] = item[col.key];
    });
    return row;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const columnWidths = columns.map((col) => ({
    wch: Math.max(
      col.header.length,
      ...data.map((item) => String(item[col.key] || '').length)
    ) + 2
  }));
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `${options.filename}_${date}.xlsx`;

  // Download
  XLSX.writeFile(workbook, filename);
};

// Format number for Excel
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('uz-UZ').format(value);
};

// Format date for Excel
export const formatDate = (date: string | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('uz-UZ');
};
