import type { Category } from '@/data/inventory';
import type { Operatore } from '@/data/operators';
import {
  buildActivitySummary,
  logInventoryActivity,
  resolveQuantityAction,
  type InventoryAction,
} from '@/lib/inventory-tracking';
import { getSupabase, isSupabaseConfigured, supabaseConfigError } from '@/lib/supabase';
import type { InventoryRowInput, UnifiedItem } from '@/types/inventory';
import type { Database, Tables } from '@/types/database';

type InventoryRow = Tables<'inventory_items'>;
type InventoryInsert = Database['public']['Tables']['inventory_items']['Insert'];
type InventoryUpdate = Database['public']['Tables']['inventory_items']['Update'];

export type InventoryMutationOptions = {
  operatore: Operatore;
  previous?: UnifiedItem;
};

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
    updatedAt: row.updated_at,
    lastModifiedBy: row.last_modified_by ?? undefined,
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
    grado: (item.grado as 'A' | 'B' | 'C' | undefined) ?? null,
  };
}

async function recordActivity(
  itemId: string,
  operatore: Operatore,
  action: InventoryAction,
  summary: string,
  quantityBefore?: number,
  quantityAfter?: number
): Promise<void> {
  await logInventoryActivity({
    itemId,
    operatore,
    action,
    summary,
    quantityBefore,
    quantityAfter,
  });
}

export async function fetchInventoryItems(): Promise<UnifiedItem[]> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? 'Supabase non configurato');
  }
  const { data, error } = await getSupabase()
    .from('inventory_items')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToUnified);
}

export async function createInventoryItem(
  item: InventoryRowInput,
  { operatore }: InventoryMutationOptions
): Promise<UnifiedItem> {
  const { data, error } = await getSupabase()
    .from('inventory_items')
    .insert({ ...toDbRow(item), last_modified_by: operatore })
    .select()
    .single();

  if (error) throw error;

  const unified = rowToUnified(data);
  await recordActivity(
    unified.id,
    operatore,
    'creazione',
    buildActivitySummary('creazione', unified.nome),
    undefined,
    unified.quantita
  );
  return unified;
}

export async function updateInventoryItem(
  id: string,
  patch: Partial<InventoryRowInput>,
  { operatore, previous }: InventoryMutationOptions
): Promise<UnifiedItem> {
  const row: InventoryUpdate = { last_modified_by: operatore };
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

  const qtyBefore = previous?.quantita;
  const qtyAfter = patch.quantita ?? previous?.quantita;
  const itemName = patch.nome ?? previous?.nome ?? id;
  const action = resolveQuantityAction(qtyBefore, qtyAfter);

  const { data, error } = await getSupabase()
    .from('inventory_items')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  const unified = rowToUnified(data);
  await recordActivity(
    id,
    operatore,
    action,
    buildActivitySummary(action, itemName, qtyBefore, qtyAfter),
    qtyBefore,
    qtyAfter
  );
  return unified;
}

export async function deleteInventoryItems(
  ids: string[],
  { operatore, items }: InventoryMutationOptions & { items: UnifiedItem[] }
): Promise<void> {
  for (const item of items) {
    await recordActivity(
      item.id,
      operatore,
      'eliminazione',
      buildActivitySummary('eliminazione', item.nome),
      item.quantita,
      undefined
    );
  }

  const { error } = await getSupabase().from('inventory_items').delete().in('id', ids);
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
