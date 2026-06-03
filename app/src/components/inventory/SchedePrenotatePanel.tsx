import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Bookmark, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  useCreateSchedaPrenotazione,
  useDeleteSchedaPrenotazione,
  useSchedePrenotazioni,
} from "@/hooks/use-schede-prenotazioni";
import type { Operatore } from "@/data/operators";
import { formatRelativeTime } from "@/lib/inventory-tracking";
import { cn } from "@/lib/utils";

type Props = {
  operatore: Operatore | null;
  requireOperatore: () => Operatore | null;
};

export function SchedePrenotatePanel({ operatore, requireOperatore }: Props) {
  const [numeroScheda, setNumeroScheda] = useState("");
  const [cliente, setCliente] = useState("");
  const [expanded, setExpanded] = useState(true);

  const { data: prenotazioni = [], isLoading, isError } = useSchedePrenotazioni();
  const createPrenotazione = useCreateSchedaPrenotazione();
  const deletePrenotazione = useDeleteSchedaPrenotazione();

  function handleAggiungi(e: React.FormEvent) {
    e.preventDefault();
    const op = requireOperatore();
    if (!op) return;
    const num = numeroScheda.trim();
    const cli = cliente.trim();
    if (!num || !cli) {
      toast.error("Inserisci numero scheda e cliente");
      return;
    }
    createPrenotazione.mutate(
      { numeroScheda: num, cliente: cli, operatore: op },
      {
        onSuccess: () => {
          setNumeroScheda("");
          setCliente("");
          toast.success("Prenotazione registrata (non scala giacenza)");
        },
        onError: () => toast.error("Errore salvataggio prenotazione"),
      },
    );
  }

  return (
    <div className="rounded-xl border border-status-viola/30 bg-status-viola/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-status-viola/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bookmark size={18} className="text-status-viola shrink-0" />
          <span className="font-caption text-status-viola uppercase tracking-wide">
            Schede prenotate
          </span>
          <span className="px-2 py-0.5 rounded-full bg-status-viola/15 text-status-viola text-xs font-mono">
            {prenotazioni.length}
          </span>
        </div>
        <span className="font-caption text-text-muted">
          {expanded ? "Nascondi" : "Mostra"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-status-viola/20">
          <p className="font-caption text-text-muted pt-3">
            Registra richieste clienti senza modificare quantità in magazzino.
          </p>

          <form
            onSubmit={handleAggiungi}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3 items-end"
          >
            <div>
              <Label className="text-text-secondary mb-1.5 block text-sm">
                Numero scheda *
              </Label>
              <Input
                value={numeroScheda}
                onChange={(e) => setNumeroScheda(e.target.value)}
                placeholder="es. SC-012 o nome scheda"
                className="bg-bg-elevated border-border-default"
                disabled={!operatore}
              />
            </div>
            <div>
              <Label className="text-text-secondary mb-1.5 block text-sm">
                Cliente *
              </Label>
              <Input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="es. Rossi Gaming"
                className="bg-bg-elevated border-border-default"
                disabled={!operatore}
              />
            </div>
            <Button
              type="submit"
              disabled={!operatore || createPrenotazione.isPending}
              className="bg-status-viola hover:bg-status-viola/90 text-white h-9"
            >
              {createPrenotazione.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  <Plus size={16} className="mr-1" />
                  Aggiungi
                </>
              )}
            </Button>
          </form>

          {isLoading && (
            <div className="flex justify-center py-6">
              <Spinner className="size-6 text-status-viola" />
            </div>
          )}
          {isError && (
            <p className="font-body-small text-status-rosso text-center py-4">
              Impossibile caricare le prenotazioni
            </p>
          )}
          {!isLoading && !isError && prenotazioni.length === 0 && (
            <p className="font-body-small text-text-muted text-center py-4">
              Nessuna prenotazione attiva
            </p>
          )}
          {!isLoading && prenotazioni.length > 0 && (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {prenotazioni.map((p) => (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border border-border-subtle",
                    "bg-bg-elevated/60 px-3 py-2",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-body-small text-text-primary truncate">
                      <span className="font-medium text-status-viola">
                        {p.numeroScheda}
                      </span>
                      {" · "}
                      {p.cliente}
                    </p>
                    <p className="font-caption text-text-muted">
                      {format(new Date(p.createdAt), "d MMM yyyy HH:mm", {
                        locale: it,
                      })}
                      {p.operatore ? ` · ${p.operatore}` : ""}
                      {" · "}
                      {formatRelativeTime(p.createdAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-text-muted hover:text-status-rosso h-8 w-8"
                    disabled={!operatore || deletePrenotazione.isPending}
                    onClick={() => {
                      const op = requireOperatore();
                      if (!op) return;
                      deletePrenotazione.mutate(p.id, {
                        onSuccess: () => toast.success("Prenotazione rimossa"),
                        onError: () =>
                          toast.error("Errore rimozione prenotazione"),
                      });
                    }}
                    aria-label="Rimuovi prenotazione"
                  >
                    <Trash2 size={16} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
