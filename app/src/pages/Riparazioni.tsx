import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  User,
  Clock,
  Filter,
  Wrench,
  StickyNote,
  Package,
  MapPin,
  Building2,
  ArrowRight,
  Truck,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchExternalRepairs,
  createExternalRepair,
  updateExternalRepair,
  deleteExternalRepair,
  cambiaStatoRepair,
  type ExternalRepair,
  type RepairFormInput,
  type RepairStato,
  type Operatore,
  type LavoroRow,
  type MaterialeRow,
  STATI_ETICHETTE,
  STATO_COLORE,
  prossimoStato,
} from "@/lib/external-repairs-api";

/* ──────────────────────────── CONSTANTS ──────────────────────────── */

const OPERATORI: Operatore[] = ["Giangrossi", "Irene", "Matteo", "Paolo"];

const STATI_FLUSSO: RepairStato[] = [
  "da_inviare", "inviato", "in_riparazione", "rientrato", "montato", "chiuso",
];

const easeSmooth = [0.16, 1, 0.3, 1] as [number, number, number, number];


/* ──────────────────── HELPER: format tempo ──────────────────── */

function formatTempo(minuti: number): string {
  if (minuti <= 0) return "—";
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/* ──────────────────── STAT CARD ──────────────────── */

function StatCard({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: easeSmooth }}
      className="bg-bg-elevated border border-border-subtle rounded-lg p-4 hover:border-border-hover transition-colors duration-200"
    >
      <p className="font-caption text-text-muted mb-1">{label}</p>
      <p className="font-data-md" style={{ color }}>{value}</p>
    </motion.div>
  );
}

/* ──────────────────── ADD/EDIT MODAL ──────────────────── */


/* ──────────────────── STATO BADGE ──────────────────── */

function StatoBadge({ stato }: { stato: RepairStato }) {
  const colore = STATO_COLORE[stato];
  const label = STATI_ETICHETTE[stato];
  return (
    <span
      className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded font-badge"
      style={{
        background: `linear-gradient(135deg, ${colore}20, ${colore}05)`,
        border: `1px solid ${colore}30`,
        color: colore,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colore }} />
      {label}
    </span>
  );
}
function ListaView({
  repairs,
  onRowClick,
}: {
  repairs: ExternalRepair[];
  onRowClick: (r: ExternalRepair) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-bg-elevated border border-border-subtle rounded-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-surface h-12 border-b border-border-subtle">
              <th className="text-left px-4 font-caption text-text-muted">Codice</th>
              <th className="text-left px-4 font-caption text-text-muted">Cliente</th>
              <th className="text-left px-4 font-caption text-text-muted">Commessa</th>
              <th className="text-left px-4 font-caption text-text-muted">Fornitore</th>
              <th className="text-left px-4 font-caption text-text-muted">Stato</th>
              <th className="text-left px-4 font-caption text-text-muted">Tecnico</th>
              <th className="text-left px-4 font-caption text-text-muted">Invio</th>
              <th className="text-left px-4 font-caption text-text-muted">Rientro</th>
              <th className="text-left px-4 font-caption text-text-muted">Tempo</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {repairs.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  onClick={() => onRowClick(r)}
                  className="h-12 border-b border-bg-elevated hover:bg-bg-hover cursor-pointer transition-colors"
                >
                  <td className="px-4 font-mono text-xs text-text-secondary">{r.code}</td>
                  <td className="px-4">
                    <span className="font-body text-text-primary font-medium">{r.cliente || "—"}</span>
                  </td>
                  <td className="px-4 font-body text-text-secondary">{r.commessa || "—"}</td>
                  <td className="px-4 font-body text-text-secondary">{r.fornitore || "—"}</td>
                  <td className="px-4"><StatoBadge stato={r.stato} /></td>
                  <td className="px-4 font-body text-text-secondary">{r.tecnico || "—"}</td>
                  <td className="px-4 font-mono text-xs text-text-secondary">
                    {r.dataInvio ? format(new Date(r.dataInvio), "dd/MM/yyyy") : "—"}
                  </td>
                  <td className="px-4 font-mono text-xs text-text-secondary">
                    {r.dataRientro ? format(new Date(r.dataRientro), "dd/MM/yyyy") : "—"}
                  </td>
                  <td className="px-4 font-mono text-xs text-text-secondary">
                    {formatTempo(r.tempoImpiegatoMinuti)}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {repairs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Wrench size={48} className="text-bg-hover mb-4" />
          <p className="font-body-small text-text-muted">Nessuna riparazione esterna trovata</p>
        </div>
      )}
    </motion.div>
  );
}

/* ──────────────────── DETAIL PANEL ──────────────────── */

function DetailPanel({
  repair,
  onClose,
  onEdit,
  onAvanzamento,
  onDelete,
}: {
  repair: ExternalRepair | null;
  onClose: () => void;
  onEdit: (r: ExternalRepair) => void;
  onAvanzamento: (r: ExternalRepair, nuovo: RepairStato) => void;
  onDelete: (r: ExternalRepair) => void;
}) {
  if (!repair) return null;

  const prossimo = prossimoStato(repair.stato);
  const totLavori = repair.lavori.reduce((s, l) => s + l.tempoMinuti, 0);

  return (
    <AnimatePresence>
      {repair && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "#00000060", backdropFilter: "blur(2px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: easeSmooth }}
            className="fixed right-0 top-0 bottom-0 w-[520px] max-w-full bg-bg-elevated border-l border-border-subtle z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-bg-elevated border-b border-border-subtle p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="font-caption text-text-muted">{repair.code}</span>
                  <h2 className="font-heading-1 text-text-primary mt-1">{repair.cliente || "N/A"}</h2>
                </div>
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary">
                  <X size={18} />
                </button>
              </div>
              <StatoBadge stato={repair.stato} />
            </div>

            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {repair.commessa && (
                  <div>
                    <span className="font-caption text-text-muted block mb-1">Commessa</span>
                    <span className="font-body text-text-primary">{repair.commessa}</span>
                  </div>
                )}
                {repair.fabbisogno && (
                  <div>
                    <span className="font-caption text-text-muted block mb-1">Fabbisogno</span>
                    <span className="font-body text-text-primary">{repair.fabbisogno}</span>
                  </div>
                )}
                <div>
                  <span className="font-caption text-text-muted block mb-1">Tecnico</span>
                  <span className="font-body text-text-primary">{repair.tecnico || "Non assegnato"}</span>
                </div>
                <div>
                  <span className="font-caption text-text-muted block mb-1">Ubicazione</span>
                  <span className="font-body text-text-primary">{repair.ubicazione || "—"}</span>
                </div>
                <div>
                  <span className="font-caption text-text-muted block mb-1">Data Inizio</span>
                  <span className="font-body text-text-primary">
                    {format(new Date(repair.dataInizio), "dd/MM/yyyy")}
                  </span>
                </div>
                <div>
                  <span className="font-caption text-text-muted block mb-1">Data Fine</span>
                  <span className="font-body text-text-primary">
                    {repair.dataFine ? format(new Date(repair.dataFine), "dd/MM/yyyy") : "—"}
                  </span>
                </div>
                {(repair.stato === "rientrato" || repair.stato === "montato" || repair.stato === "chiuso") && repair.dove_montato && (
                  <div>
                    <span className="font-caption text-text-muted block mb-1">Montato su</span>
                    <span className="font-body text-text-primary">{repair.dove_montato}</span>
                  </div>
                )}
              </div>

              {/* Fornitore e date esterne */}
              {repair.fornitore && (
                <>
                  <div className="h-px bg-border-subtle" />
                  <div>
                    <h3 className="font-heading-3 text-text-primary mb-3 flex items-center gap-2">
                      <Truck size={16} className="text-text-muted" />
                      Riparazione Esterna
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-caption text-text-muted block mb-1">Fornitore</span>
                        <span className="font-body text-text-primary">{repair.fornitore}</span>
                      </div>
                      <div>
                        <span className="font-caption text-text-muted block mb-1">Data Invio</span>
                        <span className="font-body text-text-primary">
                          {repair.dataInvio ? format(new Date(repair.dataInvio), "dd/MM/yyyy") : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="font-caption text-text-muted block mb-1">Consegna Prevista</span>
                        <span className="font-body text-text-primary">
                          {repair.consegnaPrevista ? format(new Date(repair.consegnaPrevista), "dd/MM/yyyy") : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="font-caption text-text-muted block mb-1">Data Rientro</span>
                        <span className="font-body text-text-primary">
                          {repair.dataRientro ? format(new Date(repair.dataRientro), "dd/MM/yyyy") : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="h-px bg-border-subtle" />

              {/* Descrizione Guasto */}
              <div>
                <h3 className="font-heading-3 text-text-primary mb-2 flex items-center gap-2">
                  <Wrench size={16} className="text-text-muted" />
                  Descrizione Guasto
                </h3>
                <p className="font-body text-text-secondary leading-relaxed bg-bg-surface rounded-lg p-4 border border-border-subtle">
                  {repair.descrizione_guasto || "Nessuna descrizione"}
                </p>
              </div>

              {/* Descrizione Riparazione */}
              {repair.descrizione_riparazione && (
                <div>
                  <h3 className="font-heading-3 text-text-primary mb-2 flex items-center gap-2">
                    <RefreshCw size={16} className="text-text-muted" />
                    Descrizione Riparazione
                  </h3>
                  <p className="font-body text-text-secondary leading-relaxed bg-bg-surface rounded-lg p-4 border border-border-subtle">
                    {repair.descrizione_riparazione}
                  </p>
                </div>
              )}

              {/* Tabella Lavori */}
              {repair.lavori.length > 0 && (
                <div>
                  <h3 className="font-heading-3 text-text-primary mb-2 flex items-center gap-2">
                    <Clock size={16} className="text-text-muted" />
                    Dettaglio Lavori
                    <span className="font-caption text-text-muted bg-bg-hover px-2 py-0.5 rounded">{repair.lavori.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {repair.lavori.map((l) => (
                      <div key={l.id} className="flex items-center justify-between bg-bg-surface rounded-lg p-3 border border-border-subtle">
                        <div className="flex-1">
                          <p className="font-body text-text-primary">{l.descrizione}</p>
                          <p className="font-caption text-text-muted">{l.tecnico}</p>
                        </div>
                        <span className="font-mono text-sm text-accent-primary ml-4">{formatTempo(l.tempoMinuti)}</span>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1">
                      <span className="font-data-md text-text-muted">Totale: {formatTempo(totLavori)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Materiali */}
              {repair.materiali.length > 0 && (
                <div>
                  <h3 className="font-heading-3 text-text-primary mb-2 flex items-center gap-2">
                    <Package size={16} className="text-text-muted" />
                    Materiali Utilizzati
                  </h3>
                  <div className="space-y-2">
                    {repair.materiali.map((m) => (
                      <div key={m.id} className="flex items-center justify-between bg-bg-surface rounded-lg p-3 border border-border-subtle">
                        <span className="font-body text-text-primary">{m.nome}</span>
                        <span className="font-caption text-text-muted">Qta: {m.quantita}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              {repair.note && (
                <div>
                  <h3 className="font-heading-3 text-text-primary mb-2 flex items-center gap-2">
                    <StickyNote size={16} className="text-text-muted" />
                    Note
                  </h3>
                  <p className="font-body text-text-secondary leading-relaxed bg-bg-surface rounded-lg p-4 border border-border-subtle">{repair.note}</p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 className="font-heading-3 text-text-primary mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-text-muted" />
                  Cronologia
                </h3>
                <div className="relative pl-4 border-l border-border-subtle space-y-4">
                  {repair.timeline.map((entry) => (
                    <div key={entry.id} className="relative">
                      <div
                        className="absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-bg-elevated"
                        style={{
                          backgroundColor: entry.from
                            ? STATO_COLORE[entry.from]
                            : STATO_COLORE[entry.to],
                        }}
                      />
                      <p className="font-body-small text-text-secondary">
                        {entry.from
                          ? `${STATI_ETICHETTE[entry.from]} → ${STATI_ETICHETTE[entry.to]}`
                          : `Creata: ${STATI_ETICHETTE[entry.to]}`}
                      </p>
                      <p className="font-caption text-text-muted mt-0.5">
                        {format(new Date(entry.timestamp), "dd/MM/yyyy HH:mm", { locale: it })} — {entry.user}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-bg-elevated border-t border-border-subtle p-4 flex items-center gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onEdit(repair)}>
                Modifica
              </Button>
              {prossimo && (
                <Button onClick={() => onAvanzamento(repair, prossimo)} className="flex items-center gap-2">
                  <ArrowRight size={16} />
                  {STATI_ETICHETTE[prossimo]}
                </Button>
              )}
              <Button variant="destructive" onClick={() => onDelete(repair)}>
                Elimina
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


/* ──────────────────── ADD/EDIT MODAL ──────────────────── */

function RepairModal({
  isOpen,
  onClose,
  onSave,
  repair,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RepairFormInput) => void;
  repair?: ExternalRepair | null;
}) {
  const emptyForm = (): RepairFormInput => ({
    cliente: "", commessa: "", fabbisogno: "", ubicazione: "", dove_montato: "",
    descrizione_guasto: "", descrizione_riparazione: "", tecnico: null,
    dataInizio: format(new Date(), "yyyy-MM-dd"), dataFine: null,
    tempoImpiegatoMinuti: 0, fornitore: "", dataInvio: null,
    consegnaPrevista: null, dataRientro: null, stato: "da_inviare" as RepairStato,
    materiali: [], lavori: [], timeline: [], note: "",
  });

  const [form, setForm] = useState<RepairFormInput>(emptyForm());
  const isEditing = !!repair;

  if (isOpen && repair && form.id !== "init_" + repair.id) {
    setForm({
      id: "init_" + repair.id, code: repair.code,
      cliente: repair.cliente, commessa: repair.commessa, fabbisogno: repair.fabbisogno,
      ubicazione: repair.ubicazione, dove_montato: repair.dove_montato,
      descrizione_guasto: repair.descrizione_guasto, descrizione_riparazione: repair.descrizione_riparazione,
      tecnico: repair.tecnico, dataInizio: repair.dataInizio, dataFine: repair.dataFine,
      tempoImpiegatoMinuti: repair.tempoImpiegatoMinuti, fornitore: repair.fornitore,
      dataInvio: repair.dataInvio, consegnaPrevista: repair.consegnaPrevista, dataRientro: repair.dataRientro,
      stato: repair.stato,
      materiali: repair.materiali.map((m) => ({ ...m })),
      lavori: repair.lavori.map((l) => ({ ...l })),
      timeline: repair.timeline.map((t) => ({ ...t })),
      note: repair.note,
    });
  }

  const uf = <K extends keyof RepairFormInput>(field: K, value: RepairFormInput[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addLav = () => uf("lavori", [...form.lavori, { id: "lv-" + Date.now(), descrizione: "", tempoMinuti: 0, tecnico: "" }]);
  const updLav = (i: number, f: keyof LavoroRow, v: string | number) => {
    const c = form.lavori.map((l) => ({ ...l }));
    (c[i] as any)[f] = v;
    uf("lavori", c);
    uf("tempoImpiegatoMinuti", c.reduce((s, l) => s + l.tempoMinuti, 0));
  };
  const delLav = (i: number) => {
    const c = form.lavori.filter((_, j) => j !== i);
    uf("lavori", c);
    uf("tempoImpiegatoMinuti", c.reduce((s, l) => s + l.tempoMinuti, 0));
  };

  const addMat = () => uf("materiali", [...form.materiali, { id: "mt-" + Date.now(), nome: "", quantita: 1 }]);
  const updMat = (i: number, f: keyof MaterialeRow, v: string | number) => {
    const c = form.materiali.map((m) => ({ ...m }));
    (c[i] as any)[f] = v;
    uf("materiali", c);
  };
  const delMat = (i: number) => uf("materiali", form.materiali.filter((_, j) => j !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente || !form.descrizione_guasto) return;
    onSave({
      ...form,
      materiali: form.materiali.filter((m) => m.nome.trim()),
      lavori: form.lavori.filter((l) => l.descrizione.trim()),
      tempoImpiegatoMinuti: form.lavori.reduce((s, l) => s + (l.tempoMinuti || 0), 0),
    });
    handleClose();
  };

  const handleClose = () => { onClose(); setForm(emptyForm()); };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#00000080", backdropFilter: "blur(4px)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: easeSmooth }}
            className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-[680px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <h2 className="font-heading-2 text-text-primary">
                {isEditing ? "Modifica " + repair!.code : "Nuova Riparazione Esterna"}
              </h2>
              <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <fieldset className="border border-border-subtle rounded-lg p-4 space-y-4">
                <legend className="font-heading-3 text-text-primary px-2 flex items-center gap-2">
                  <Building2 size={16} className="text-text-muted" />
                  Cliente e Commessa
                </legend>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Cliente <span className="text-status-rosso">*</span></label>
                    <Input type="text" value={form.cliente} onChange={(e) => uf("cliente", e.target.value)} placeholder="Nome cliente"
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" required />
                  </div>
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Commessa</label>
                    <Input type="text" value={form.commessa} onChange={(e) => uf("commessa", e.target.value)} placeholder="N. commessa"
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Fabbisogno</label>
                    <Input type="text" value={form.fabbisogno} onChange={(e) => uf("fabbisogno", e.target.value)} placeholder="Ordine di rif."
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" />
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-border-subtle rounded-lg p-4 space-y-4">
                <legend className="font-heading-3 text-text-primary px-2 flex items-center gap-2">
                  <MapPin size={16} className="text-text-muted" />
                  Ubicazione
                </legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Ubicazione Attuale</label>
                    <Input type="text" value={form.ubicazione} onChange={(e) => uf("ubicazione", e.target.value)} placeholder="Es. Magazzino, Limena..."
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Montato su (dopo rientro)</label>
                    <Input type="text" value={form.dove_montato} onChange={(e) => uf("dove_montato", e.target.value)} placeholder="Cabinet / Postazione / Scheda"
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" />
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-border-subtle rounded-lg p-4 space-y-4">
                <legend className="font-heading-3 text-text-primary px-2 flex items-center gap-2">
                  <Wrench size={16} className="text-text-muted" />
                  Problema e Riparazione
                </legend>
                <div>
                  <label className="block font-body-small text-text-secondary mb-1.5">Descrizione Guasto <span className="text-status-rosso">*</span></label>
                  <textarea value={form.descrizione_guasto} onChange={(e) => uf("descrizione_guasto", e.target.value)}
                    rows={3} placeholder="Descrizione del problema..."
                    className="w-full bg-bg-base border border-border-default rounded-md px-3 py-2 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors resize-none" required />
                </div>
                <div>
                  <label className="block font-body-small text-text-secondary mb-1.5">Descrizione Riparazione</label>
                  <textarea value={form.descrizione_riparazione} onChange={(e) => uf("descrizione_riparazione", e.target.value)}
                    rows={3} placeholder="Intervento effettuato..."
                    className="w-full bg-bg-base border border-border-default rounded-md px-3 py-2 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors resize-none" />
                </div>
              </fieldset>

              <fieldset className="border border-border-subtle rounded-lg p-4 space-y-4">
                <legend className="font-heading-3 text-text-primary px-2 flex items-center gap-2">
                  <Truck size={16} className="text-text-muted" />
                  Riparazione Esterna
                </legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Fornitore / Laboratorio</label>
                    <Input type="text" value={form.fornitore} onChange={(e) => uf("fornitore", e.target.value)} placeholder="Nome fornitore"
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Data Invio</label>
                    <Input type="date" value={form.dataInvio || ""} onChange={(e) => uf("dataInvio", e.target.value || null)}
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Consegna Prevista</label>
                    <Input type="date" value={form.consegnaPrevista || ""} onChange={(e) => uf("consegnaPrevista", e.target.value || null)}
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Data Rientro</label>
                    <Input type="date" value={form.dataRientro || ""} onChange={(e) => uf("dataRientro", e.target.value || null)}
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" />
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-border-subtle rounded-lg p-4 space-y-4">
                <legend className="font-heading-3 text-text-primary px-2 flex items-center gap-2">
                  <User size={16} className="text-text-muted" />
                  Assegnazione e Date
                </legend>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Tecnico</label>
                    <select value={form.tecnico || ""} onChange={(e) => uf("tecnico", (e.target.value || null) as Operatore | null)}
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors appearance-none">
                      <option value="">--</option>
                      {OPERATORI.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Data Inizio</label>
                    <Input type="date" value={form.dataInizio} onChange={(e) => uf("dataInizio", e.target.value)}
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block font-body-small text-text-secondary mb-1.5">Data Fine</label>
                    <Input type="date" value={form.dataFine || ""} onChange={(e) => uf("dataFine", e.target.value || null)}
                      className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" />
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-border-subtle rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <legend className="font-heading-3 text-text-primary flex items-center gap-2">
                    <Clock size={16} className="text-text-muted" />
                    Dettaglio Lavori
                    <span className="font-caption text-text-muted bg-bg-hover px-2 py-0.5 rounded">{form.lavori.length}</span>
                  </legend>
                  <button type="button" onClick={addLav}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors font-body-small">
                    <Plus size={14} /> Aggiungi Riga
                  </button>
                </div>
                {form.lavori.map((l, i) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <Input type="text" value={l.descrizione} onChange={(e) => updLav(i, "descrizione", e.target.value)}
                      placeholder="Descrizione lavoro" className="flex-1 h-9 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary text-sm" />
                    <Input type="number" value={l.tempoMinuti || ""} onChange={(e) => updLav(i, "tempoMinuti", parseInt(e.target.value) || 0)}
                      placeholder="Minuti" min={0} className="w-20 h-9 bg-bg-base border border-border-default rounded-md px-2 font-body text-text-primary text-center focus:outline-none focus:border-accent-primary text-sm" />
                    <select value={l.tecnico} onChange={(e) => updLav(i, "tecnico", e.target.value)}
                      className="w-[130px] h-9 bg-bg-base border border-border-default rounded-md px-2 font-body text-text-primary text-sm focus:outline-none focus:border-accent-primary appearance-none">
                      <option value="">Tecnico</option>
                      {OPERATORI.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <button type="button" onClick={() => delLav(i)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-status-rosso/20 text-text-muted hover:text-status-rosso transition-colors flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {form.lavori.length === 0 && <p className="font-body-small text-text-muted text-center py-3">Nessun lavoro registrato</p>}
                {form.tempoImpiegatoMinuti > 0 && (
                  <div className="flex justify-end pt-1"><span className="font-data-md text-accent-primary">Totale: {formatTempo(form.tempoImpiegatoMinuti)}</span></div>
                )}
              </fieldset>

              <fieldset className="border border-border-subtle rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <legend className="font-heading-3 text-text-primary flex items-center gap-2">
                    <Package size={16} className="text-text-muted" />
                    Materiali Utilizzati
                    <span className="font-caption text-text-muted bg-bg-hover px-2 py-0.5 rounded">{form.materiali.length}</span>
                  </legend>
                  <button type="button" onClick={addMat}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors font-body-small">
                    <Plus size={14} /> Aggiungi Materiale
                  </button>
                </div>
                {form.materiali.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Input type="text" value={m.nome} onChange={(e) => updMat(i, "nome", e.target.value)}
                      placeholder="Nome materiale" className="flex-1 h-9 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary text-sm" />
                    <Input type="number" value={m.quantita} onChange={(e) => updMat(i, "quantita", parseInt(e.target.value) || 0)}
                      placeholder="Qta" min={1} className="w-16 h-9 bg-bg-base border border-border-default rounded-md px-2 font-body text-text-primary text-center focus:outline-none focus:border-accent-primary text-sm" />
                    <button type="button" onClick={() => delMat(i)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-status-rosso/20 text-text-muted hover:text-status-rosso transition-colors flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {form.materiali.length === 0 && <p className="font-body-small text-text-muted text-center py-3">Nessun materiale aggiunto</p>}
              </fieldset>

              <div>
                <label className="block font-body-small text-text-secondary mb-1.5">Note</label>
                <textarea value={form.note} onChange={(e) => uf("note", e.target.value)}
                  rows={2} placeholder="Note aggiuntive..."
                  className="w-full bg-bg-base border border-border-default rounded-md px-3 py-2 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors resize-none" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                <Button type="button" variant="outline" onClick={handleClose}>Annulla</Button>
                <Button type="submit">
                  {isEditing ? "Salva Modifiche" : "Crea Riparazione"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


/* ═══════════════════════ MAIN PAGE ═══════════════════════ */

export default function Riparazioni() {
  const [repairs, setRepairs] = useState<ExternalRepair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [filterStato, setFilterStato] = useState<RepairStato[]>([]);
  const [filterTecnico, setFilterTecnico] = useState<string[]>([]);
  const [filterFornitore, setFilterFornitore] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState<ExternalRepair | null>(null);
  const [detailRepair, setDetailRepair] = useState<ExternalRepair | null>(null);

  const operatoreCorrente: Operatore = "Giangrossi";

  /* Carica dati */
  const caricaDati = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchExternalRepairs();
      setRepairs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { caricaDati(); }, [caricaDati]);

  /* Filtered */
  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        r.code.toLowerCase().includes(q) ||
        r.cliente.toLowerCase().includes(q) ||
        r.commessa.toLowerCase().includes(q) ||
        r.fornitore.toLowerCase().includes(q) ||
        r.descrizione_guasto.toLowerCase().includes(q) ||
        (r.tecnico && r.tecnico.toLowerCase().includes(q)) || false;
      const matchesStato = filterStato.length === 0 || filterStato.includes(r.stato);
      const matchesTecnico = filterTecnico.length === 0 || (r.tecnico && filterTecnico.includes(r.tecnico));
      const matchesFornitore = !filterFornitore || r.fornitore.toLowerCase().includes(filterFornitore.toLowerCase());
      return matchesSearch && matchesStato && matchesTecnico && matchesFornitore;
    });
  }, [repairs, searchQuery, filterStato, filterTecnico, filterFornitore]);

  /* Stats */
  const stats = useMemo(() => {
    const daInviare = repairs.filter((r) => r.stato === "da_inviare").length;
    const inCorso = repairs.filter((r) => r.stato === "inviato" || r.stato === "in_riparazione").length;
    const rientratiMese = repairs.filter((r) => {
      if (r.stato !== "rientrato" && r.stato !== "montato" && r.stato !== "chiuso") return false;
      if (!r.dataRientro) return false;
      const d = new Date(r.dataRientro);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const chiusi = repairs.filter((r) => r.stato === "chiuso").length;
    return { daInviare, inCorso, rientratiMese, chiusi };
  }, [repairs]);

  /* Toggle helpers */
  const toggleFilter = <T,>(_arr: T[], val: T, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    setter((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };

  const clearFilters = () => {
    setFilterStato([]);
    setFilterTecnico([]);
    setFilterFornitore("");
    setSearchQuery("");
  };

  const activeFilterCount = filterStato.length + filterTecnico.length + (filterFornitore ? 1 : 0);

  /* CRUD */
  const handleSave = useCallback(async (data: RepairFormInput) => {
    try {
      if (editingRepair) {
        const updated = await updateExternalRepair(editingRepair.id, data, operatoreCorrente);
        setRepairs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        setDetailRepair(updated);
      } else {
        const created = await createExternalRepair(data, operatoreCorrente);
        setRepairs((prev) => [created, ...prev]);
      }
    } catch (err) {
      alert("Errore: " + (err instanceof Error ? err.message : "Errore sconosciuto"));
    }
  }, [editingRepair]);

  const handleAvanzamento = useCallback(async (repair: ExternalRepair, nuovo: RepairStato) => {
    try {
      const updated = await cambiaStatoRepair(repair.id, nuovo, operatoreCorrente, repair);
      setRepairs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setDetailRepair(updated);
    } catch (err) {
      alert("Errore: " + (err instanceof Error ? err.message : "Errore sconosciuto"));
    }
  }, []);

  const handleDelete = useCallback(async (repair: ExternalRepair) => {
    if (!window.confirm("Eliminare " + repair.code + "?")) return;
    try {
      await deleteExternalRepair(repair.id);
      setRepairs((prev) => prev.filter((r) => r.id !== repair.id));
      setDetailRepair(null);
    } catch (err) {
      alert("Errore: " + (err instanceof Error ? err.message : "Errore sconosciuto"));
    }
  }, []);

  const handleEdit = useCallback((repair: ExternalRepair) => {
    setEditingRepair(repair);
    setDetailRepair(null);
    setShowAddModal(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: easeSmooth }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeSmooth }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <p className="font-caption text-text-muted mb-1">Dashboard / Riparazioni Esterne</p>
          <h1 className="font-display-lg text-text-primary">Riparazioni Esterne</h1>
          <p className="font-body text-text-secondary mt-1">
            Tracciamento spedizioni a laboratori esterni e fornitori
          </p>
        </div>
        <Button
          onClick={() => { setEditingRepair(null); setShowAddModal(true); }}
        >
          <Plus size={16} /> Nuova Riparazione Esterna
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Da Inviare" value={String(stats.daInviare)} color="#525252" delay={0} />
        <StatCard label="In Corso (Inv. + Rip.)" value={String(stats.inCorso)} color="#3B82F6" delay={0.06} />
        <StatCard label="Rientrati (Mese)" value={String(stats.rientratiMese)} color="#22C55E" delay={0.12} />
        <StatCard label="Chiuse" value={String(stats.chiusi)} color="#06B6D4" delay={0.18} />
      </div>

      {/* Search + Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: easeSmooth }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca codice, cliente, fornitore..."
            className="w-full h-10 bg-bg-elevated border-border-subtle rounded-lg pl-10 font-body"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          )}
        </div>
        <Button
          variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters || activeFilterCount > 0 ? "bg-accent-primary text-bg-base" : ""}
        >
          <Filter size={16} />
          Filtri
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-accent-primary text-bg-base flex items-center justify-center text-xs font-semibold">{activeFilterCount}</span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="font-body-small text-text-muted hover:text-status-rosso transition-colors">Cancella filtri</button>
        )}
      </motion.div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: easeSmooth }}
            className="overflow-hidden"
          >
            <div className="bg-bg-elevated border border-border-subtle rounded-xl p-5 space-y-4">
              <div>
                <span className="font-caption text-text-muted block mb-2">Stato</span>
                <div className="flex flex-wrap gap-2">
                  {STATI_FLUSSO.map((s) => (
                    <button key={s} onClick={() => toggleFilter(filterStato, s, setFilterStato)}
                      className={cn("h-8 px-3 rounded-md border font-body-small transition-colors",
                        filterStato.includes(s)
                          ? "border-opacity-40 bg-opacity-15 text-white"
                          : "border-border-default text-text-muted hover:text-text-secondary hover:bg-bg-hover")}
                      style={filterStato.includes(s) ? {
                        backgroundColor: STATO_COLORE[s] + "15",
                        borderColor: STATO_COLORE[s] + "40",
                        color: STATO_COLORE[s],
                      } : {}}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5" style={{ backgroundColor: STATO_COLORE[s] }} />
                      {STATI_ETICHETTE[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-caption text-text-muted block mb-2">Tecnico</span>
                  <div className="flex flex-wrap gap-2">
                    {OPERATORI.map((t) => (
                      <button key={t} onClick={() => toggleFilter(filterTecnico, t, setFilterTecnico)}
                        className={cn("h-8 px-3 rounded-md border font-body-small transition-colors",
                          filterTecnico.includes(t)
                            ? "bg-accent-muted border-accent-primary/40 text-accent-primary"
                            : "border-border-default text-text-muted hover:text-text-secondary hover:bg-bg-hover")}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-caption text-text-muted block mb-2">Fornitore</span>
                  <Input type="text" value={filterFornitore} onChange={(e) => setFilterFornitore(e.target.value)}
                    placeholder="Filtra per fornitore..."
                    className="w-full h-9 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary text-sm" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-status-rosso/10 border border-status-rosso/30 rounded-xl p-6 text-center">
          <p className="font-body text-status-rosso mb-2">{error}</p>
          <Button onClick={caricaDati}>
            Riprova
          </Button>
        </div>
      ) : (
        <ListaView repairs={filteredRepairs} onRowClick={setDetailRepair} />
      )}

      <DetailPanel
        repair={detailRepair}
        onClose={() => setDetailRepair(null)}
        onEdit={handleEdit}
        onAvanzamento={handleAvanzamento}
        onDelete={handleDelete}
      />

      <RepairModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingRepair(null); }}
        onSave={handleSave}
        repair={editingRepair}
      />
    </motion.div>
  );
}
