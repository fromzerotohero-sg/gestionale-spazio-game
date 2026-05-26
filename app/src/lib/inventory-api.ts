import type { Category } from '@/data/inventory';
import { supabase } from '@/lib/supabase';
import type { InventoryRowInput, UnifiedItem } from '@/types/inventory';
import type { Database, Tables } from '@/types/database';

type InventoryRow = Tables<'inventory_items'>;
type InventoryInsert = Database['public']['Tables']['inventory_items']['Insert'];
type InventoryUpdate = Database['public']['Tables']['inventory_items']['Update'];

export function rowToUnified(row: InventoryRow): UnifiedItem {
  const quantita = row.quantita;
  const prezzoUnitario = Number(row.prezzo_unitario);
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.category as Category,
    quantita,
    prezzoUnitario,
    totale: quantita * prezzoUnitario,
    note: row.note,
    sede: row.sede,
    tipo: row.tipo ?? undefined,
    modello: row.modello ?? undefined,
    marca: row.marca ?? undefined,
    scaffale: row.scaffale ?? undefined,
    ripiano: row.ripiano ?? undefined,
    bancale: row.bancale ?? undefined,
    grado: row.grado ?? undefined,
  };
}

function toDbRow(item: InventoryRowInput): InventoryInsert {
  const isMonitor = item.categoria === 'monitor';
  return {
    id: item.id,
    category: item.categoria,
    nome: isMonitor && item.marca && item.modello ? `${item.marca} ${item.modello}` : item.nome,
    quantita: item.quantita,
    prezzo_unitario: item.prezzoUnitario,
    note: item.note ?? '',
    sede: item.sede as InventoryInsert['sede'],
    tipo: item.tipo ?? null,
    modello: item.modello ?? null,
    marca: item.marca ?? null,
    scaffale: item.scaffale ?? null,
    ripiano: item.ripiano ?? null,
    bancale: item.bancale ?? null,
    grado: (item.grado as 'A' | 'B' | undefined) ?? null,
  };
}

export async function fetchInventoryItems(): Promise<UnifiedItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToUnified);
}

export async function createInventoryItem(item: InventoryRowInput): Promise<UnifiedItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(toDbRow(item))
    .select()
    .single();

  if (error) throw error;
  return rowToUnified(data);
}

export async function updateInventoryItem(
  id: string,
  patch: Partial<InventoryRowInput>
): Promise<UnifiedItem> {
  const row: InventoryUpdate = {};
  if (patch.nome !== undefined) row.nome = patch.nome;
  if (patch.quantita !== undefined) row.quantita = patch.quantita;
  if (patch.prezzoUnitario !== undefined) row.prezzo_unitario = patch.prezzoUnitario;
  if (patch.note !== undefined) row.note = patch.note;
  if (patch.sede !== undefined) row.sede = patch.sede as InventoryUpdate['sede'];
  if (patch.categoria !== undefined) row.category = patch.categoria;
  if (patch.tipo !== undefined) row.tipo = patch.tipo;
  if (patch.modello !== undefined) row.modello = patch.modello;
  if (patch.marca !== undefined) row.marca = patch.marca;
  if (patch.scaffale !== undefined) row.scaffale = patch.scaffale;
  if (patch.ripiano !== undefined) row.ripiano = patch.ripiano;
  if (patch.bancale !== undefined) row.bancale = patch.bancale;
  if (patch.grado !== undefined) row.grado = patch.grado as InventoryUpdate['grado'];
  if (patch.marca !== undefined && patch.modello !== undefined) {
    row.nome = `${patch.marca} ${patch.modello}`;
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return rowToUnified(data);
}

export async function deleteInventoryItems(ids: string[]): Promise<void> {
  const { error } = await supabase.from('inventory_items').delete().in('id', ids);
  if (error) throw error;
}

export function nextInventoryId(items: UnifiedItem[], category: Category): string {
  const prefix = { schede: 'SC', cabinet: 'CB', cambiamonete: 'CM', accessori: 'AC', monitor: 'MN' }[
    category
  ];
  const maxNum = items
    .filter((i) => i.categoria === category)
    .reduce((max, i) => {
      const num = parseInt(i.id.split('-')[1] ?? '0', 10);
      return num > max ? num : max;
    }, 0);
  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}
