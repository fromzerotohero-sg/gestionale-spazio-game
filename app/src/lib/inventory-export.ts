import * as XLSX from 'xlsx';
import type { Category } from '@/data/inventory';
import { formatAbsoluteDateTime } from '@/lib/inventory-tracking';
import type { UnifiedItem } from '@/types/inventory';

export const CATEGORY_LABELS: Record<Category, string> = {
  schede: 'Schede',
  cabinet: 'Cabinet',
  cambiamonete: 'Cambia Monete',
  accessori: 'Accessori',
  monitor: 'Monitor',
};

export const EXPORT_COLUMNS = [
  'ID',
  'Nome',
  'Categoria',
  'Quantità',
  'Prezzo unitario (€)',
  'Totale (€)',
  'Sede',
  'Note',
  'Tipo',
  'Modello',
  'Marca',
  'Scaffale',
  'Ripiano',
  'Bancale',
  'Grado',
  'Ultimo aggiornamento',
  'Ultimo operatore',
] as const;

export type ExportScope =
  | { type: 'filtered'; label: string }
  | { type: 'category'; category: Category }
  | { type: 'all' }
  | { type: 'selection' };

function itemToRow(item: UnifiedItem): (string | number)[] {
  return [
    item.id,
    item.nome,
    CATEGORY_LABELS[item.categoria] ?? item.categoria,
    item.quantita,
    item.prezzoUnitario,
    item.totale,
    item.sede,
    item.note ?? '',
    item.tipo ?? '',
    item.modello ?? '',
    item.marca ?? '',
    item.scaffale ?? '',
    item.ripiano ?? '',
    item.bancale ?? '',
    item.grado ?? '',
    item.updatedAt ? formatAbsoluteDateTime(item.updatedAt) : '',
    item.lastModifiedBy ?? '',
  ];
}

function itemsToSheet(items: UnifiedItem[]): XLSX.WorkSheet {
  const data = [EXPORT_COLUMNS.slice(), ...items.map(itemToRow)];
  const sheet = XLSX.utils.aoa_to_sheet(data);

  sheet['!cols'] = [
    { wch: 10 },
    { wch: 36 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 12 },
    { wch: 20 },
    { wch: 28 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 22 },
    { wch: 14 },
  ];

  return sheet;
}

function summarySheet(items: UnifiedItem[]): XLSX.WorkSheet {
  const categories = Object.keys(CATEGORY_LABELS) as Category[];
  const rows: (string | number)[][] = [
    ['Categoria', 'N. articoli', 'Quantità totale', 'Valore totale (€)'],
  ];

  for (const cat of categories) {
    const catItems = items.filter((i) => i.categoria === cat);
    if (catItems.length === 0) continue;
    rows.push([
      CATEGORY_LABELS[cat],
      catItems.length,
      catItems.reduce((s, i) => s + i.quantita, 0),
      catItems.reduce((s, i) => s + i.totale, 0),
    ]);
  }

  rows.push([
    'TOTALE',
    items.length,
    items.reduce((s, i) => s + i.quantita, 0),
    items.reduce((s, i) => s + i.totale, 0),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 18 }];
  return sheet;
}

function sanitizeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, '').slice(0, 31);
}

function downloadWorkbook(workbook: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function buildExportFilename(scope: ExportScope, date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  switch (scope.type) {
    case 'all':
      return `inventario_completo_${stamp}.xlsx`;
    case 'category':
      return `inventario_${scope.category}_${stamp}.xlsx`;
    case 'selection':
      return `inventario_selezionati_${stamp}.xlsx`;
    case 'filtered':
      return `inventario_${scope.label}_${stamp}.xlsx`;
  }
}

export function exportInventoryToExcel(
  allItems: UnifiedItem[],
  scope: ExportScope,
  filteredItems?: UnifiedItem[]
): { count: number; filename: string } {
  let items: UnifiedItem[] = [];
  let filename = '';
  let multiSheet = false;

  switch (scope.type) {
    case 'all':
      items = [...allItems];
      filename = buildExportFilename(scope);
      multiSheet = true;
      break;
    case 'category':
      items = allItems.filter((i) => i.categoria === scope.category);
      filename = buildExportFilename(scope);
      break;
    case 'selection':
      items = filteredItems ?? [];
      filename = buildExportFilename(scope);
      break;
    case 'filtered':
      items = filteredItems ?? [];
      filename = buildExportFilename(scope);
      break;
  }

  if (items.length === 0) {
    throw new Error('Nessun articolo da esportare');
  }

  const workbook = XLSX.utils.book_new();

  if (multiSheet) {
    XLSX.utils.book_append_sheet(workbook, summarySheet(items), sanitizeSheetName('Riepilogo'));
    XLSX.utils.book_append_sheet(workbook, itemsToSheet(items), sanitizeSheetName('Tutti'));

    for (const cat of Object.keys(CATEGORY_LABELS) as Category[]) {
      const catItems = items.filter((i) => i.categoria === cat);
      if (catItems.length > 0) {
        XLSX.utils.book_append_sheet(
          workbook,
          itemsToSheet(catItems),
          sanitizeSheetName(CATEGORY_LABELS[cat])
        );
      }
    }
  } else {
    const sheetTitle =
      scope.type === 'category'
        ? CATEGORY_LABELS[scope.category]
        : scope.type === 'filtered'
          ? 'Export'
          : 'Selezione';
    XLSX.utils.book_append_sheet(workbook, itemsToSheet(items), sanitizeSheetName(sheetTitle));
  }

  downloadWorkbook(workbook, filename);
  return { count: items.length, filename };
}

export function filterItemsForExport(
  allItems: UnifiedItem[],
  activeTab: Category | 'tutti'
): UnifiedItem[] {
  if (activeTab === 'tutti') return allItems;
  return allItems.filter((i) => i.categoria === activeTab);
}
