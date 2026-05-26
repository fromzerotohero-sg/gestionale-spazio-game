import type { Operatore } from '@/data/operators';
import { getSupabase } from '@/lib/supabase';
import type { UnifiedItem } from '@/types/inventory';

export type InventoryAction = 'creazione' | 'modifica' | 'prelievo' | 'carico' | 'eliminazione';

export function resolveQuantityAction(
  before: number | undefined,
  after: number | undefined
): InventoryAction {
  if (before === undefined || after === undefined || before === after) return 'modifica';
  if (after < before) return 'prelievo';
  return 'carico';
}

export function buildActivitySummary(
  action: InventoryAction,
  itemName: string,
  before?: number,
  after?: number
): string {
  if (action === 'prelievo' && before !== undefined && after !== undefined) {
    const delta = before - after;
    return `Prelevati ${delta} pezzi di «${itemName}» (${before} → ${after})`;
  }
  if (action === 'carico' && before !== undefined && after !== undefined) {
    const delta = after - before;
    return `Caricati ${delta} pezzi di «${itemName}» (${before} → ${after})`;
  }
  if (action === 'creazione') return `Creato articolo «${itemName}»`;
  if (action === 'eliminazione') return `Eliminato articolo «${itemName}»`;
  return `Modificato «${itemName}»`;
}

export async function logInventoryActivity(params: {
  itemId: string;
  operatore: Operatore;
  action: InventoryAction;
  quantityBefore?: number | null;
  quantityAfter?: number | null;
  summary: string;
}): Promise<void> {
  const { error } = await getSupabase().from('inventory_activity').insert({
    item_id: params.itemId,
    operatore: params.operatore,
    action: params.action,
    quantity_before: params.quantityBefore ?? null,
    quantity_after: params.quantityAfter ?? null,
    summary: params.summary,
  });
  if (error) console.error('logInventoryActivity', error);
}

export function inventoryUpdateToast(
  operatore: Operatore,
  item: UnifiedItem,
  action?: InventoryAction
): string {
  const when = item.updatedAt ? formatRelativeTime(item.updatedAt) : 'adesso';
  const verb =
    action === 'creazione'
      ? 'Articolo creato'
      : action === 'prelievo'
        ? 'Prelievo registrato'
        : action === 'carico'
          ? 'Carico registrato'
          : 'Aggiornamento registrato';
  return `${verb} · ${operatore} · ${when}`;
}

export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '—';

  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 45) return 'poco fa';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return diffH === 1 ? '1 ora fa' : `${diffH} ore fa`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return diffD === 1 ? '1 giorno fa' : `${diffD} giorni fa`;

  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatAbsoluteDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
