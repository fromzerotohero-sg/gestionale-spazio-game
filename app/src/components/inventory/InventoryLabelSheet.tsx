import { createPortal } from "react-dom";
import {
  formatLabelCliente,
  formatLabelDataStampa,
  formatLabelTipoProdotto,
  formatLabelVerificato,
} from "@/lib/inventory-label-print";
import type { UnifiedItem } from "@/types/inventory";
import "@/styles/inventory-label.css";

const LABEL_FIELDS = [
  { key: "cliente", label: "Cliente", format: formatLabelCliente },
  { key: "tipo", label: "Tipo prodotto", format: formatLabelTipoProdotto },
  { key: "data", label: "Data", format: () => formatLabelDataStampa() },
  { key: "verificato", label: "Verificato", format: formatLabelVerificato },
  {
    key: "quantita",
    label: "Quantità",
    format: (item: UnifiedItem) => String(item.quantita),
  },
] as const;

function LabelCard({ item }: { item: UnifiedItem }) {
  return (
    <article className="inventory-label-card">
      <p className="inventory-label-card__title">Spazio Games</p>
      <div className="inventory-label-card__grid">
        {LABEL_FIELDS.map(({ key, label, format }) => (
          <div key={key} className="contents">
            <span className="inventory-label-card__label">{label}</span>
            <span className="inventory-label-card__value">{format(item)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export function InventoryLabelSheet({ items }: { items: UnifiedItem[] }) {
  if (items.length === 0) return null;

  const sheet = (
    <div className="inventory-label-print-root" aria-hidden>
      <div className="inventory-label-sheet inventory-label-sheet--single">
        <LabelCard item={items[0]} />
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
