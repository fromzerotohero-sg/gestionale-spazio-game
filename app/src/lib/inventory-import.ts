import * as XLSX from 'xlsx';
import type { Category } from '@/data/inventory';
import { CATEGORY_LABELS } from '@/lib/inventory-export';
import type { InventoryRowInput } from '@/types/inventory';

type RawRow = Record<string, unknown>;

const CATEGORY_BY_LABEL: Record<string, Category> = {
  schede: 'schede',
  cabinet: 'cabinet',
  'cambia monete': 'cambiamonete',
  cambiamonete: 'cambiamonete',
  accessori: 'accessori',
  monitor: 'monitor',
};

function norm(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const num = Number(String(value ?? '').replace(',', '.').trim());
  return Number.isFinite(num) ? num : fallback;
}

function firstNonEmpty(row: RawRow, keys: string[]): string {
  for (const key of keys) {
    const match = Object.keys(row).find((k) => norm(k) === norm(key));
    if (!match) continue;
    const value = String(row[match] ?? '').trim();
    if (value) return value;
  }
  return '';
}

function parseCategory(value: string, fallback?: Category): Category | null {
  const n = norm(value);
  if (!n) return fallback ?? null;
  if (CATEGORY_BY_LABEL[n]) return CATEGORY_BY_LABEL[n];
  const byLabel = (Object.entries(CATEGORY_LABELS) as [Category, string][])
    .find(([, label]) => norm(label) === n)?.[0];
  return byLabel ?? fallback ?? null;
}

function mapRowToInventory(
  row: RawRow,
  idx: number,
  fallbackCategory?: Category
): { item: InventoryRowInput | null; reason?: string } {
  const id = firstNonEmpty(row, ['ID', 'id']);
  const nome = firstNonEmpty(row, ['Nome', 'nome', 'Articolo']);
  const categoryRaw = firstNonEmpty(row, ['Categoria', 'categoria']);
  const categoria = parseCategory(categoryRaw, fallbackCategory);
  const quantita = toNumber(firstNonEmpty(row, ['Quantità', 'Quantita', 'quantita']), 0);
  const prezzo = toNumber(
    firstNonEmpty(row, ['Prezzo unitario (€)', 'Prezzo Unitario', 'prezzoUnitario', 'prezzo']),
    0
  );
  const note = firstNonEmpty(row, ['Note', 'note']);
  const sede = firstNonEmpty(row, ['Sede', 'sede']) || 'Magazzino Principale';
  const tipo = firstNonEmpty(row, ['Tipo', 'tipo']) || undefined;
  const modello = firstNonEmpty(row, ['Modello', 'modello']) || undefined;
  const marca = firstNonEmpty(row, ['Marca', 'marca']) || undefined;
  const scaffaleRaw = firstNonEmpty(row, ['Scaffale', 'scaffale']);
  const ripianoRaw = firstNonEmpty(row, ['Ripiano', 'ripiano']);
  const bancale = firstNonEmpty(row, ['Bancale', 'bancale']) || undefined;
  const grado = firstNonEmpty(row, ['Grado', 'grado']) || undefined;

  if (!categoria) return { item: null, reason: `Riga ${idx}: categoria mancante/non valida` };
  if (!nome) return { item: null, reason: `Riga ${idx}: nome mancante` };

  return {
    item: {
      id,
      nome,
      categoria,
      quantita: Math.max(0, quantita),
      prezzoUnitario: Math.max(0, prezzo),
      note,
      sede,
      tipo,
      modello,
      marca,
      scaffale: scaffaleRaw ? toNumber(scaffaleRaw, 1) : undefined,
      ripiano: ripianoRaw ? toNumber(ripianoRaw, 1) : undefined,
      bancale,
      grado,
    },
  };
}

export function parseInventoryImportFile(
  file: File,
  fallbackCategory?: Category
): Promise<{ rows: InventoryRowInput[]; warnings: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossibile leggere il file'));
    reader.onload = () => {
      try {
        const data = reader.result;
        if (!data) throw new Error('File vuoto');
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet) throw new Error('Nessun foglio trovato');
        const rawRows = XLSX.utils.sheet_to_json<RawRow>(firstSheet, { defval: '' });

        const rows: InventoryRowInput[] = [];
        const warnings: string[] = [];

        rawRows.forEach((row, i) => {
          const parsed = mapRowToInventory(row, i + 2, fallbackCategory);
          if (!parsed.item) {
            if (parsed.reason) warnings.push(parsed.reason);
            return;
          }
          rows.push(parsed.item);
        });

        resolve({ rows, warnings });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Errore parsing Excel'));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
