import type { UnifiedItem } from '@/types/inventory';

export function findItemsForLabelPrint(
  items: UnifiedItem[],
  articoloQuery: string,
  bancaleFilter: string
): UnifiedItem[] {
  let data = items;
  const q = articoloQuery.trim().toLowerCase();

  if (q) {
    data = data.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.nome.toLowerCase().includes(q) ||
        (i.modello || '').toLowerCase().includes(q) ||
        (i.marca || '').toLowerCase().includes(q)
    );
  }

  const b = bancaleFilter.trim().toUpperCase();
  if (b) {
    data = data.filter((i) => (i.bancale || '').toUpperCase() === b);
  }

  return data;
}

export function formatLabelLocation(item: UnifiedItem): string | null {
  const parts: string[] = [];
  if (item.bancale) parts.push(`Bancale ${item.bancale}`);
  if (item.scaffale != null) parts.push(`Sc. ${item.scaffale}`);
  if (item.ripiano != null) parts.push(`Rip. ${item.ripiano}`);
  if (item.sede) parts.push(item.sede);
  return parts.length ? parts.join(' · ') : null;
}

export function triggerBrowserLabelPrint() {
  document.body.classList.add('inventory-label-printing');
  const cleanup = () => document.body.classList.remove('inventory-label-printing');
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}
