import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEDI, type Sede } from "@/data/inventory";
import type { UnifiedItem } from "@/types/inventory";

type Props = {
  item: UnifiedItem;
  qty: string;
  onQtyChange: (value: string) => void;
  destSede: Sede;
  onDestSedeChange: (sede: Sede) => void;
  note: string;
  onNoteChange: (value: string) => void;
  onTransfer: () => void;
  saving?: boolean;
  disabled?: boolean;
};

export function SchedeTrasferimentoSedePanel({
  item,
  qty,
  onQtyChange,
  destSede,
  onDestSedeChange,
  note,
  onNoteChange,
  onTransfer,
  saving,
  disabled,
}: Props) {
  const altreSedi = SEDI.filter((s) => s !== item.sede);

  return (
    <div className="rounded-lg border border-status-viola/30 bg-status-viola/5 p-3 space-y-3">
      <div>
        <p className="font-body-small text-text-primary font-medium flex items-center gap-2">
          <Truck size={15} className="text-status-viola shrink-0" />
          Trasferimento tra sedi
        </p>
        <p className="font-caption text-text-muted mt-1">
          Sposta solo una parte da <strong>{item.sede}</strong> senza svuotare
          tutto il magazzino. Se la scheda esiste già in destinazione, le
          quantità si sommano.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-[100px]">
          <Label className="text-text-secondary mb-1 block font-caption">
            Quantità
          </Label>
          <Input
            type="number"
            min={1}
            max={item.quantita}
            value={qty}
            onChange={(e) => onQtyChange(e.target.value)}
            placeholder="es. 5"
            disabled={saving || disabled}
            className="bg-bg-surface border-border-default h-9"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <Label className="text-text-secondary mb-1 block font-caption">
            Sede destinazione
          </Label>
          <select
            value={destSede}
            onChange={(e) => onDestSedeChange(e.target.value as Sede)}
            disabled={saving || disabled || altreSedi.length === 0}
            className="h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
          >
            {altreSedi.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-[1.4] min-w-[200px]">
          <Label className="text-text-secondary mb-1 block font-caption">
            Nota (facoltativa)
          </Label>
          <Input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="es. invio a Limena per ordine cliente..."
            disabled={saving || disabled}
            className="bg-bg-surface border-border-default h-9"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={saving || disabled || item.quantita <= 0}
          onClick={onTransfer}
          className="h-9 shrink-0 border-status-viola/50 text-status-viola hover:bg-status-viola/10 hover:text-status-viola"
        >
          {saving ? "Trasferimento..." : "Trasferisci"}
        </Button>
      </div>
      <p className="font-caption text-text-muted">
        Giacenza attuale in <span className="text-text-secondary">{item.sede}</span>
        :{" "}
        <span className="font-semibold text-text-primary">{item.quantita}</span>
      </p>
    </div>
  );
}
