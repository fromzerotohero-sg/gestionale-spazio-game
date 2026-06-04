import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CATEGORY_LABELS } from "@/lib/inventory-export";
import type { UnifiedItem } from "@/types/inventory";

export function findItemsForLabelPrint(
  items: UnifiedItem[],
  articoloQuery: string,
  bancaleFilter: string,
): UnifiedItem[] {
  let data = items;
  const q = articoloQuery.trim().toLowerCase();

  if (q) {
    data = data.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.nome.toLowerCase().includes(q) ||
        (i.modello || "").toLowerCase().includes(q) ||
        (i.marca || "").toLowerCase().includes(q),
    );
  }

  const b = bancaleFilter.trim().toUpperCase();
  if (b) {
    data = data.filter((i) => (i.bancale || "").toUpperCase() === b);
  }

  return data;
}

export function formatLabelCliente(item: UnifiedItem): string {
  const v = item.fornitore?.trim();
  return v || "—";
}

export function formatLabelTipoProdotto(item: UnifiedItem): string {
  const cat = CATEGORY_LABELS[item.categoria] ?? item.categoria;
  if (item.categoria === "monitor" && item.tipo) {
    return `${cat} · ${item.tipo}`;
  }
  return cat;
}

export function formatLabelDataStampa(): string {
  return format(new Date(), "d MMMM yyyy", { locale: it });
}

export function formatLabelVerificato(item: UnifiedItem): string {
  return item.bancaleVerificato ? "Sì" : "No";
}

export function triggerBrowserLabelPrint() {
  document.body.classList.add("inventory-label-printing");
  const cleanup = () =>
    document.body.classList.remove("inventory-label-printing");
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
}
