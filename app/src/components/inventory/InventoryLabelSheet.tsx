import {
  formatLabelCliente,
  formatLabelDataStampa,
  formatLabelTipoProdotto,
  formatLabelVerificato,
} from "@/lib/inventory-label-print";
import type { UnifiedItem } from "@/types/inventory";
import "@/styles/inventory-label.css";

function LabelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="inventory-label-card__row">
      <span className="inventory-label-card__label">{label}</span>
      <span className="inventory-label-card__value">{value}</span>
    </div>
  );
}

function LabelCard({ item }: { item: UnifiedItem }) {
  return (
    <article className="inventory-label-card">
      <p className="inventory-label-card__title">Spazio Games</p>
      <LabelRow label="Cliente" value={formatLabelCliente(item)} />
      <LabelRow label="Tipo prodotto" value={formatLabelTipoProdotto(item)} />
      <LabelRow label="Data" value={formatLabelDataStampa()} />
      <LabelRow label="Verificato" value={formatLabelVerificato(item)} />
      <LabelRow label="Quantità" value={String(item.quantita)} />
    </article>
  );
}

export function InventoryLabelSheet({ items }: { items: UnifiedItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="inventory-label-print-root" aria-hidden>
      <div
        className={
          items.length === 1
            ? "inventory-label-sheet inventory-label-sheet--single"
            : "inventory-label-sheet"
        }
      >
        {items.map((item) => (
          <LabelCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
