import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAbsoluteDateTime } from "@/lib/inventory-tracking";
import {
  BANCALE_STATI_OPERATIVI,
  BANCALE_STATO_COLORS,
  BANCALE_STATO_LABELS,
  BANCALE_STATO_SELECT_EMPTY,
  bancaleStatoToSelectValue,
  selectValueToBancaleStato,
  type BancaleStatoOperativo,
} from "@/lib/bancale-stato-operativo";
import type { UnifiedItem } from "@/types/inventory";
import { cn } from "@/lib/utils";

type Props = {
  stato: BancaleStatoOperativo | null;
  onStatoChange: (stato: BancaleStatoOperativo | null) => void;
  nota: string;
  onNotaChange: (nota: string) => void;
  item?: UnifiedItem | null;
  disabled?: boolean;
};

export function BancaleStatoOperativoPanel({
  stato,
  onStatoChange,
  nota,
  onNotaChange,
  item,
  disabled,
}: Props) {
  const showMeta =
    stato &&
    item?.bancaleStatoOperativo === stato &&
    item.bancaleStatoOperativoAt;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-3",
        stato === "a_terra"
          ? "border-status-arancione/40 bg-status-arancione/10"
          : stato === "da_sbancalare"
            ? "border-status-giallo/40 bg-status-giallo/10"
            : "border-border-subtle bg-bg-elevated/40",
      )}
    >
      <div>
        <Label className="text-text-secondary block text-sm font-medium">
          Stato bancale
        </Label>
        <p className="font-caption text-text-muted mt-1">
          Se è da sbancalare o a terra, non ha più ubicazione a scaffale.
        </p>
      </div>
      <select
        value={bancaleStatoToSelectValue(stato)}
        disabled={disabled}
        onChange={(e) => onStatoChange(selectValueToBancaleStato(e.target.value))}
        className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
      >
        <option value={BANCALE_STATO_SELECT_EMPTY}>— Non impostato</option>
        {BANCALE_STATI_OPERATIVI.map((s) => (
          <option key={s} value={s}>
            {BANCALE_STATO_LABELS[s]}
          </option>
        ))}
      </select>
      <div>
        <Label className="text-text-secondary mb-1.5 block text-sm">
          Nota (facoltativa)
        </Label>
        <Input
          value={nota}
          onChange={(e) => onNotaChange(e.target.value)}
          disabled={disabled}
          placeholder="es. postazione 3, operatore Mario…"
          className="bg-bg-elevated border-border-default"
        />
      </div>
      {showMeta && (
        <p className="font-caption text-text-muted">
          Stato dal {formatAbsoluteDateTime(item!.bancaleStatoOperativoAt!)}
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
  nota,
}: {
  stato: BancaleStatoOperativo | null;
  nota?: string | null;
}) {
  if (!stato) {
    const n = nota?.trim();
    if (n) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded font-badge border text-xs max-w-[200px] truncate bg-bg-hover text-text-muted border-border-default">
          {n}
        </span>
      );
    }
    return <span className="font-caption text-text-muted">—</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded font-badge border text-xs max-w-[220px] truncate",
        BANCALE_STATO_COLORS[stato],
      )}
      title={nota?.trim() || undefined}
    >
      {BANCALE_STATO_LABELS[stato]}
      {nota?.trim() ? ` · ${nota.trim()}` : ""}
    </span>
  );
}
