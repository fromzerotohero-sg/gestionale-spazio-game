import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Send, X, Mail, Archive, Trash2, AlertTriangle,
  MessageSquare, User, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  fetchComunicazioni, createComunicazione, updateComunicazione, deleteComunicazione,
  type Comunicazione, type Operatore,
} from "@/lib/comunicazioni-api";

/* ------------ TYPES ------------ */

type FiltroVista = "tutte" | "generali" | "mie" | "archiviate";

/* ------------ CONSTANTS ------------ */

const OPERATORI: Operatore[] = ["Giangrossi", "Irene", "Matteo", "Paolo"];

const AUTORE_CORRENTE: Operatore = "Giangrossi";

const COLORE_AUTORI: Record<Operatore, string> = {
  Giangrossi: "#3B82F6",
  Irene: "#EC4899",
  Matteo: "#22C55E",
  Paolo: "#F97316",
};

const easeSmooth = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ------------ INITIALE AUTORE ------------ */

function inizialiAutore(nome: Operatore): string {
  return nome.slice(0, 2).toUpperCase();
}

/* ------------ MAIN ------------ */

export default function Supporto() {
  const [comunicazioni, setComunicazioni] = useState<Comunicazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroVista>("tutte");
  const [mostraArchiviate, setMostraArchiviate] = useState(false);
  const [showScrivi, setShowScrivi] = useState(false);

  /* Carica dati */
  const caricaDati = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchComunicazioni();
      setComunicazioni(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore caricamento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { caricaDati(); }, [caricaDati]);

  /* Filtra */
  const filtrate = useMemo(() => {
    let result = [...comunicazioni];

    if (!mostraArchiviate) {
      result = result.filter((c) => !c.archiviata);
    }

    switch (filtro) {
      case "generali":
        result = result.filter((c) => c.destinatario === null);
        break;
      case "mie":
        result = result.filter(
          (c) => c.destinatario === AUTORE_CORRENTE || c.autore === AUTORE_CORRENTE,
        );
        break;
      case "archiviate":
        result = result.filter((c) => c.archiviata);
        break;
    }

    return result;
  }, [comunicazioni, filtro, mostraArchiviate]);

  /* Stats */
  const stats = useMemo(() => {
    const nonArchiviate = comunicazioni.filter((c) => !c.archiviata);
    const urgenti = comunicazioni.filter((c) => c.urgente && !c.archiviata);
    const perMe = comunicazioni.filter(
      (c) => c.destinatario === AUTORE_CORRENTE && !c.archiviata,
    );
    return {
      totali: nonArchiviate.length,
      urgenti: urgenti.length,
      perMe: perMe.length,
      archiviate: comunicazioni.filter((c) => c.archiviata).length,
    };
  }, [comunicazioni]);

  /* CRUD handlers */
  const handleCrea = useCallback(
    async (messaggio: string, urgente: boolean, destinatario: Operatore | null) => {
      try {
        const nuova = await createComunicazione(AUTORE_CORRENTE, messaggio, urgente, destinatario);
        setComunicazioni((prev) => [nuova, ...prev]);
        setShowScrivi(false);
      } catch (err) {
        alert("Errore: " + (err instanceof Error ? err.message : "Errore"));
      }
    },
    [],
  );

  const handleModifica = useCallback(
    async (id: string, patch: { messaggio?: string; urgente?: boolean }) => {
      try {
        const aggiornata = await updateComunicazione(id, patch);
        setComunicazioni((prev) => prev.map((c) => (c.id === aggiornata.id ? aggiornata : c)));
      } catch (err) {
        alert("Errore: " + (err instanceof Error ? err.message : "Errore"));
      }
    },
    [],
  );

  const handleArchivia = useCallback(async (id: string) => {
    try {
      const aggiornata = await updateComunicazione(id, { archiviata: true });
      setComunicazioni((prev) => prev.map((c) => (c.id === aggiornata.id ? aggiornata : c)));
    } catch (err) {
      alert("Errore: " + (err instanceof Error ? err.message : "Errore"));
    }
  }, []);

  const handleElimina = useCallback(async (id: string) => {
    if (!window.confirm("Eliminare questa comunicazione?")) return;
    try {
      await deleteComunicazione(id);
      setComunicazioni((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Errore: " + (err instanceof Error ? err.message : "Errore"));
    }
  }, []);

  const handleInviaEmail = useCallback((com: Comunicazione) => {
    const destinatario = com.destinatario ? " (a " + com.destinatario + ")" : "";
    const oggetto = encodeURIComponent("[Comunicazione] " + (com.urgente ? "URGENTE " : "") + destinatario);
    const corpo = encodeURIComponent(
      "Da: " + com.autore +
      destinatario +
      "\n\n" + com.messaggio +
      "\n\n---\nBacheca Comunicazioni - Spazio Game",
    );
    window.open("mailto:?subject=" + oggetto + "&body=" + corpo, "_blank");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: easeSmooth }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-caption text-text-muted mb-1">Dashboard / Comunicazioni</p>
          <h1 className="font-display-lg text-text-primary">Bacheca Comunicazioni</h1>
          <p className="font-body text-text-secondary mt-1">
            Messaggi interni tra operatori — in ordine cronologico
          </p>
        </div>
        <Button onClick={() => setShowScrivi(true)}>
          <Plus size={16} /> Nuova Comunicazione
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="In Bacheca" value={String(stats.totali)} color="#3B82F6" delay={0} />
        <StatCard label="Urgenti" value={String(stats.urgenti)} color="#EF4444" delay={0.06} />
        <StatCard label="Per Me" value={String(stats.perMe)} color="#22C55E" delay={0.12} />
        <StatCard label="Archiviate" value={String(stats.archiviate)} color="#525252" delay={0.18} />
      </div>

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-bg-elevated border border-border-subtle rounded-lg p-0.5">
          {([
            { key: "tutte" as FiltroVista, label: "Tutte" },
            { key: "generali" as FiltroVista, label: "Generali" },
            { key: "mie" as FiltroVista, label: "Per Me" },
            { key: "archiviate" as FiltroVista, label: "Archiviate" },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setFiltro(t.key)}
              className={cn(
                "px-3 h-8 rounded-md text-sm font-medium transition-colors",
                filtro === t.key
                  ? "bg-accent-primary/20 text-accent-primary"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={mostraArchiviate}
            onChange={(e) => setMostraArchiviate(e.target.checked)}
            className="rounded border-border-default"
          />
          Mostra archiviate
        </label>
      </div>

      {/* Loading / Error / Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-status-rosso/10 border border-status-rosso/30 rounded-xl p-6 text-center">
          <p className="font-body text-status-rosso mb-2">{error}</p>
          <Button onClick={caricaDati}>Riprova</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtrate.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-text-muted"
              >
                <MessageSquare size={48} className="text-bg-hover mb-4" />
                <p className="font-body">Nessuna comunicazione</p>
              </motion.div>
            )}
            {filtrate.map((com) => (
              <ComunicazioneCard
                key={com.id}
                com={com}
                isMia={com.autore === AUTORE_CORRENTE}
                onModifica={handleModifica}
                onArchivia={handleArchivia}
                onElimina={handleElimina}
                onInviaEmail={handleInviaEmail}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal scrivi */}
      <ScriviModal
        isOpen={showScrivi}
        onClose={() => setShowScrivi(false)}
        onInvia={handleCrea}
      />
    </motion.div>
  );
}

/* ------------ CARD COMUNICAZIONE ------------ */

function ComunicazioneCard({
  com,
  isMia,
  onModifica,
  onArchivia,
  onElimina,
  onInviaEmail,
}: {
  com: Comunicazione;
  isMia: boolean;
  onModifica: (id: string, patch: { messaggio?: string; urgente?: boolean }) => void;
  onArchivia: (id: string) => void;
  onElimina: (id: string) => void;
  onInviaEmail: (com: Comunicazione) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(com.messaggio);
  
  const colore = COLORE_AUTORI[com.autore] || "#525252";
  const coloreBg = colore + "15";
  const coloreBordo = colore + "30";

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== com.messaggio) {
      onModifica(com.id, { messaggio: editText.trim() });
    }
    setEditing(false);
  };

  const toggleUrgente = () => {
    onModifica(com.id, { urgente: !com.urgente });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: easeSmooth }}
      className={cn(
        "rounded-xl border p-4 transition-all duration-200",
        com.urgente
          ? "border-status-rosso/40 bg-status-rosso/[0.04]"
          : com.destinatario
            ? "border-accent-primary/30 bg-accent-primary/[0.03]"
            : "border-border-subtle bg-bg-elevated",
        com.archiviata && "opacity-50",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar autore */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ backgroundColor: coloreBg, color: colore, border: "1px solid " + coloreBordo }}
        >
          {inizialiAutore(com.autore)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: colore }}>
              {com.autore}
            </span>
            {com.destinatario && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ backgroundColor: COLORE_AUTORI[com.destinatario] + "15", color: COLORE_AUTORI[com.destinatario] }}>
                <User size={10} />
                {com.destinatario}
              </span>
            )}
            {!com.destinatario && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-bg-hover text-text-muted">
                <MessageSquare size={10} />
                Generale
              </span>
            )}
            {com.urgente && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-status-rosso/15 text-status-rosso">
                <AlertTriangle size={10} />
                URGENTE
              </span>
            )}
            <span className="font-caption text-text-muted ml-auto text-xs flex items-center gap-1">
              <Clock size={10} />
              {format(new Date(com.createdAt), "d MMM HH:mm", { locale: it })}
            </span>
          </div>

          {/* Messaggio */}
          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full bg-bg-base border border-border-default rounded-md px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-primary resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>Salva</Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditText(com.messaggio); }}>
                  Annulla
                </Button>
              </div>
            </div>
          ) : (
            <p className={cn(
              "text-sm leading-relaxed mt-1",
              com.archiviata ? "text-text-muted" : "text-text-primary",
            )}>
              {com.messaggio}
            </p>
          )}
        </div>

        {/* Actions */}
        {!editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {isMia && (
              <>
                <button onClick={() => setEditing(true)} title="Modifica"
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button onClick={toggleUrgente} title={com.urgente ? "Togli urgenza" : "Segna urgente"}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover transition-colors"
                  style={{ color: com.urgente ? "#EF4444" : "#525252" }}>
                  <AlertTriangle size={14} />
                </button>
              </>
            )}
            <button onClick={() => onArchivia(com.id)} title="Archivia"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors">
              <Archive size={14} />
            </button>
            <button onClick={() => onInviaEmail(com)} title="Invia via email"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors">
              <Mail size={14} />
            </button>
            {isMia && (
              <button onClick={() => onElimina(com.id)} title="Elimina"
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-status-rosso/20 text-text-muted hover:text-status-rosso transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ------------ MODAL SCRIVI ------------ */

function ScriviModal({
  isOpen,
  onClose,
  onInvia,
}: {
  isOpen: boolean;
  onClose: () => void;
  onInvia: (messaggio: string, urgente: boolean, destinatario: Operatore | null) => void;
}) {
  const [messaggio, setMessaggio] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [destinatario, setDestinatario] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messaggio.trim()) return;
    onInvia(
      messaggio.trim(),
      urgente,
      (destinatario || null) as Operatore | null,
    );
    setMessaggio("");
    setUrgente(false);
    setDestinatario("");
  };

  const handleClose = () => {
    onClose();
    setMessaggio("");
    setUrgente(false);
    setDestinatario("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "#00000080", backdropFilter: "blur(4px)" }}
      onClick={handleClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: easeSmooth }}
        className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-[520px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <h2 className="font-heading-2 text-text-primary">Nuova Comunicazione</h2>
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-body-small text-text-secondary mb-1.5">Destinatario</label>
            <select
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 text-sm text-text-primary outline-none focus:border-accent-primary appearance-none"
            >
              <option value="">Tutti (comunicazione generale)</option>
              {OPERATORI.filter((o) => o !== AUTORE_CORRENTE).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-body-small text-text-secondary mb-1.5">
              Messaggio <span className="text-status-rosso">*</span>
            </label>
            <textarea
              value={messaggio}
              onChange={(e) => setMessaggio(e.target.value)}
              rows={5}
              placeholder="Scrivi il tuo messaggio..."
              className="w-full bg-bg-base border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary resize-none"
              required
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={urgente}
              onChange={(e) => setUrgente(e.target.checked)}
              className="rounded border-border-default"
            />
            <span className="text-sm text-text-primary flex items-center gap-1">
              <AlertTriangle size={14} className="text-status-rosso" />
              Segna come urgente
            </span>
          </label>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle">
            <Button type="button" variant="outline" onClick={handleClose}>Annulla</Button>
            <Button type="submit" className="flex items-center gap-2">
              <Send size={14} /> Invia
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ------------ STAT CARD ------------ */
function StatCard({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: easeSmooth }}
      className="bg-bg-elevated border border-border-subtle rounded-lg p-4"
    >
      <p className="font-caption text-text-muted mb-1">{label}</p>
      <p className="font-data-md" style={{ color }}>{value}</p>
    </motion.div>
  );
}
