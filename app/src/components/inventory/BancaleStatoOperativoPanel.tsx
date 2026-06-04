import { Label } from "@/components/ui/label";
import { formatAbsoluteDateTime } from "@/lib/inventory-tracking";
import {
  BANCALE_STATI_OPERATIVI,
  BANCALE_STATO_COLORS,
  BANCALE_STATO_LABELS,
  type BancaleStatoOperativo,
} from "@/lib/bancale-stato-operativo";
import type { UnifiedItem } from "@/types/inventory";
import { cn } from "@/lib/utils";

type Props = {
  value: BancaleStatoOperativo;
  onChange: (stato: BancaleStatoOperativo) => void;
  item?: UnifiedItem | null;
  disabled?: boolean;
};

export function BancaleStatoOperativoPanel({
  value,
  onChange,
  item,
  disabled,
}: Props) {
  const showMeta =
    value !== "a_riposo" &&
    item?.bancaleStatoOperativo === value &&
    item.bancaleStatoOperativoAt;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-elevated/40 p-3 space-y-2">
      <Label className="text-text-secondary block text-sm font-medium">
        Stato operativo bancale
      </Label>
      <p className="font-caption text-text-muted -mt-1">
        Ubicazione magazzino sopra; qui tracci quando il bancale è tirato o in
        postazione operatore.
      </p>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as BancaleStatoOperativo)}
        className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
      >
        {BANCALE_STATI_OPERATIVI.map((s) => (
          <option key={s} value={s}>
            {BANCALE_STATO_LABELS[s]}
          </option>
        ))}
      </select>
      {showMeta && (
        <p className="font-caption text-text-muted">
          Dal {formatAbsoluteDateTime(item!.bancaleStatoOperativoAt!)}
          {item!.bancaleStatoOperativoDa
            ? ` · ${item!.bancaleStatoOperativoDa}`
            : ""}
        </p>
      )}
    </div>
  );
}

export function BancaleStatoOperativoBadge({
  stato,
}: {
  stato: BancaleStatoOperativo;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded font-badge border text-xs whitespace-nowrap",
        BANCALE_STATO_COLORS[stato],
      )}
    >
      {BANCALE_STATO_LABELS[stato]}
    </span>
  );
}
