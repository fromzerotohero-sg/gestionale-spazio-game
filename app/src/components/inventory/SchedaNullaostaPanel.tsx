import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  NULLAOSTA_PREZZO_INCREMENTO,
  parseDateOnly,
} from "@/lib/scheda-nullaosta";

type Props = {
  docInviataAt: Date | undefined;
  onDocInviataAtChange: (date: Date | undefined) => void;
  nullaostaRicevuto: boolean;
  onNullaostaRicevutoChange: (checked: boolean) => void;
  nullaostaRicevutoAt: Date | undefined;
  onNullaostaRicevutoAtChange: (date: Date | undefined) => void;
  segretariaOk: boolean;
  onSegretariaOkChange: (checked: boolean) => void;
  prezzoIncrementato: boolean;
  disabled?: boolean;
};

export function SchedaNullaostaPanel({
  docInviataAt,
  onDocInviataAtChange,
  nullaostaRicevuto,
  onNullaostaRicevutoChange,
  nullaostaRicevutoAt,
  onNullaostaRicevutoAtChange,
  segretariaOk,
  onSegretariaOkChange,
  prezzoIncrementato,
  disabled,
}: Props) {
  const [docOpen, setDocOpen] = useState(false);
  const [nullaostaOpen, setNullaostaOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-3",
        nullaostaRicevuto
          ? "border-status-verde/40 bg-status-verde/10"
          : "border-border-subtle bg-bg-elevated/40",
      )}
    >
      <p className="font-caption text-text-muted uppercase tracking-wide">
        Nullaosta
      </p>

      <div>
        <Label className="text-text-secondary mb-1.5 block text-sm">
          Documentazione inviata
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={docOpen} onOpenChange={setDocOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className={cn(
                  "justify-start font-normal bg-bg-elevated border-border-default",
                  !docInviataAt && "text-text-muted",
                )}
              >
                <CalendarIcon className="mr-2 size-4 opacity-70" />
                {docInviataAt
                  ? format(docInviataAt, "d MMMM yyyy", { locale: it })
                  : "Scegli data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-bg-surface border-border-default"
              align="start"
            >
              <Calendar
                mode="single"
                selected={docInviataAt}
                onSelect={(d) => {
                  onDocInviataAtChange(d);
                  if (d) setDocOpen(false);
                }}
                locale={it}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {docInviataAt && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="text-text-muted h-8"
              onClick={() => onDocInviataAtChange(undefined)}
            >
              Rimuovi data
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="nullaosta-ricevuto"
          checked={nullaostaRicevuto}
          disabled={disabled}
          onCheckedChange={(v) => {
            const checked = v === true;
            onNullaostaRicevutoChange(checked);
            if (checked && !nullaostaRicevutoAt) {
              onNullaostaRicevutoAtChange(new Date());
            }
            if (!checked) {
              onNullaostaRicevutoAtChange(undefined);
              onSegretariaOkChange(false);
            }
          }}
        />
        <div className="flex-1 space-y-1.5">
          <Label
            htmlFor="nullaosta-ricevuto"
            className={cn(
              "text-sm font-medium cursor-pointer",
              nullaostaRicevuto
                ? "text-status-verde"
                : "text-text-secondary",
            )}
          >
            Nullaosta ricevuto
          </Label>
          {nullaostaRicevuto && (
            <>
              <p className="font-caption text-text-muted">
                {prezzoIncrementato
                  ? "Incremento prezzo (+100 €) già applicato"
                  : `Al salvataggio: +${NULLAOSTA_PREZZO_INCREMENTO} € sul prezzo unitario`}
              </p>
              <Popover open={nullaostaOpen} onOpenChange={setNullaostaOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="justify-start font-normal bg-bg-elevated border-border-default h-8"
                  >
                    <CalendarIcon className="mr-2 size-3.5 opacity-70" />
                    {nullaostaRicevutoAt
                      ? format(nullaostaRicevutoAt, "d MMMM yyyy", {
                          locale: it,
                        })
                      : "Data ricezione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-bg-surface border-border-default"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={nullaostaRicevutoAt}
                    onSelect={(d) => {
                      onNullaostaRicevutoAtChange(d);
                      if (d) setNullaostaOpen(false);
                    }}
                    locale={it}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1 border-t border-border-subtle/80">
        <Checkbox
          id="nullaosta-segretaria"
          checked={segretariaOk}
          disabled={disabled || !nullaostaRicevuto}
          onCheckedChange={(v) => onSegretariaOkChange(v === true)}
        />
        <Label
          htmlFor="nullaosta-segretaria"
          className={cn(
            "text-sm cursor-pointer",
            !nullaostaRicevuto && "text-text-muted",
            segretariaOk && "text-status-verde font-medium",
          )}
        >
          Confermato segreteria
        </Label>
      </div>
    </div>
  );
}

export function initSchedaNullaostaFromItem(item?: {
  schedaDocInviataAt?: string;
  nullaostaRicevutoAt?: string;
  nullaostaSegretariaOk?: boolean;
}) {
  return {
    docInviataAt: parseDateOnly(item?.schedaDocInviataAt),
    nullaostaRicevuto: !!item?.nullaostaRicevutoAt,
    nullaostaRicevutoAt: parseDateOnly(item?.nullaostaRicevutoAt),
    segretariaOk: !!item?.nullaostaSegretariaOk,
  };
}
