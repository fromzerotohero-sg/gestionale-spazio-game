import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Send, X, Download, Trash2, FileText, Monitor, User, Calendar, Hash, FileSpreadsheet,
  Printer, FileDown,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  fetchModuli, createModulo, updateModulo, deleteModulo,
  type Modulo, type ModuloTipo, type ArticoloOrdine,
  TEMPLATES, type TemplateInfo,
  exportModuloToExcel, apriStampaModulo,
} from "@/lib/moduli-api";

/* ------------ CONSTANTS ------------ */

const OPERATORI_LABEL: Record<ModuloTipo, string> = {
  ordine_monitor: "Ordine Monitor",
  ordine_schede_65: "Ordine Schede 65%",
};

const OPERATORI_ICON: Record<ModuloTipo, React.ReactNode> = {
  ordine_monitor: <Monitor size={18} />,
  ordine_schede_65: <FileSpreadsheet size={18} />,
};

const easeSmooth = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ------------ MAIN ------------ */

export default function Modulistica() {
  const [moduli, setModuli] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingModulo, setEditingModulo] = useState<Modulo | null>(null);
  const [formTipo, setFormTipo] = useState<ModuloTipo>("ordine_monitor");

  const caricaDati = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchModuli();
      setModuli(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore caricamento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { caricaDati(); }, [caricaDati]);

  const stats = useMemo(() => {
    const monitor = moduli.filter((m) => m.tipo === "ordine_monitor").length;
    const schede = moduli.filter((m) => m.tipo === "ordine_schede_65").length;
    return { totali: moduli.length, monitor, schede };
  }, [moduli]);

  const handleCrea = useCallback(async (
    tipo: ModuloTipo, cliente: string, agente: string, dataOrdine: string,
    articoli: ArticoloOrdine[],
    extras: Parameters<typeof createModulo>[5],
  ) => {
    try {
      const nuovo = await createModulo(tipo, cliente, agente, dataOrdine, articoli, extras);
      setModuli((prev) => [nuovo, ...prev]);
      setShowForm(false);
      setEditingModulo(null);
    } catch (err) {
      alert("Errore: " + (err instanceof Error ? err.message : "Errore"));
    }
  }, []);

  const handleModifica = useCallback(async (id: string, patch: Parameters<typeof updateModulo>[1]) => {
    try {
      const aggiornato = await updateModulo(id, patch);
      setModuli((prev) => prev.map((m) => m.id === aggiornato.id ? aggiornato : m));
      setShowForm(false);
      setEditingModulo(null);
    } catch (err) {
      alert("Errore: " + (err instanceof Error ? err.message : "Errore"));
    }
  }, []);

  const handleElimina = useCallback(async (id: string) => {
    if (!window.confirm("Eliminare questo modulo?")) return;
    try {
      await deleteModulo(id);
      setModuli((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert("Errore: " + (err instanceof Error ? err.message : "Errore"));
    }
  }, []);

  const apriFormNuovo = (tipo: ModuloTipo) => {
    setFormTipo(tipo);
    setEditingModulo(null);
    setShowForm(true);
  };

  const apriFormModifica = (modulo: Modulo) => {
    setFormTipo(modulo.tipo);
    setEditingModulo(modulo);
    setShowForm(true);
  };

  /* Scarica template */
  const downloadTemplate = (t: TemplateInfo) => {
    const url = URL.createObjectURL(t.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = `modulo_${t.key}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <p className="font-caption text-text-muted mb-1">Dashboard / Modulistica</p>
          <h1 className="font-display-lg text-text-primary">Modulistica</h1>
          <p className="font-body text-text-secondary mt-1">
            Template moduli e ordini compilati
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Moduli Compilati" value={String(stats.totali)} color="#3B82F6" delay={0} />
        <StatCard label="Ordini Monitor" value={String(stats.monitor)} color="#F97316" delay={0.06} />
        <StatCard label="Ordini Schede 65%" value={String(stats.schede)} color="#22C55E" delay={0.12} />
      </div>

      {/* Template Section */}
      <div>
        <h2 className="font-heading-2 text-text-primary mb-4">Template disponibili</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((t, i) => (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.08, ease: easeSmooth }}
              className="bg-bg-elevated border border-border-subtle rounded-xl p-5 hover:border-border-hover transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0 text-accent-primary">
                  {OPERATORI_ICON[t.key]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-text-primary">{t.label}</h3>
                  <p className="font-caption text-text-muted mt-0.5">{t.rev}</p>
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">{t.descrizione}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" onClick={() => apriFormNuovo(t.key)}>
                      <Plus size={14} /> Compila
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadTemplate(t)}>
                      <Download size={14} /> Template
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Salvataggi */}
      <div>
        <h2 className="font-heading-2 text-text-primary mb-4">
          Ordini salvati ({stats.totali})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-status-rosso/10 border border-status-rosso/30 rounded-xl p-6 text-center">
            <p className="font-body text-status-rosso mb-2">{error}</p>
            <Button onClick={caricaDati}>Riprova</Button>
          </div>
        ) : moduli.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted bg-bg-elevated border border-border-subtle rounded-xl">
            <FileText size={48} className="mb-3 opacity-30" />
            <p className="font-body">Nessun ordine salvato</p>
            <p className="font-caption mt-1">Usa i template sopra per compilare il primo</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {moduli.map((m) => (
                <ModuloRow
                  key={m.id}
                  modulo={m}
                  onEdit={() => apriFormModifica(m)}
                  onDelete={() => handleElimina(m.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ModuloFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingModulo(null); }}
        tipo={formTipo}
        modulo={editingModulo}
        onSalva={(patch) => {
          if (editingModulo) {
            handleModifica(editingModulo.id, patch as Parameters<typeof updateModulo>[1]);
          } else {
            const { tipo, cliente, agente, dataOrdine, articoli, ...extras } = patch as any;
            handleCrea(tipo, cliente, agente, dataOrdine, articoli, extras);
          }
        }}
      />
    </motion.div>
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

/* ------------ MODULO ROW ------------ */

function ModuloRow({ modulo, onEdit, onDelete }: {
  modulo: Modulo;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: easeSmooth }}
      className="flex items-center gap-4 bg-bg-elevated border border-border-subtle rounded-xl px-5 py-3 hover:border-border-hover transition-colors group"
    >
      <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0 text-accent-primary">
        {OPERATORI_ICON[modulo.tipo]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-text-primary">
            {modulo.titolo || modulo.cliente || "Senza titolo"}
          </span>
          <span className="font-caption text-[10px] px-1.5 py-0.5 rounded bg-bg-hover text-text-muted">
            {OPERATORI_LABEL[modulo.tipo]}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
          {modulo.cliente && <span><User size={10} className="inline mr-1" />{modulo.cliente}</span>}
          <span><Calendar size={10} className="inline mr-1" />{format(new Date(modulo.dataOrdine + "T00:00:00"), "d MMM yyyy", { locale: it })}</span>
          {modulo.numeroOrdine && <span><Hash size={10} className="inline mr-1" />Ord. {modulo.numeroOrdine}</span>}
          <span>{modulo.articoli.length} articoli</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => apriStampaModulo(modulo)} title="Stampa"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors">
          <Printer size={14} />
        </button>
        <button onClick={() => exportModuloToExcel(modulo)} title="Esporta Excel"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors">
          <FileDown size={14} />
        </button>
        <button onClick={onEdit} title="Modifica"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </button>
        <button onClick={onDelete} title="Elimina"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-status-rosso/20 text-text-muted hover:text-status-rosso transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

/* ------------ FORM MODAL ------------ */

interface FormState {
  tipo: ModuloTipo;
  cliente: string;
  agente: string;
  dataOrdine: string;
  consegnaStimata: string;
  numeroOfferta: string;
  numeroOrdine: string;
  articoli: ArticoloOrdine[];
  // Monitor extras
  tipoCliente: string;
  schedinoFascette: boolean;
  garanzia: boolean;
  cabinetUsati: string;
  modelliPrecedenti: string;
  corriere: string;
  porto: string;
  dimBancale: string;
  modalitaPagamento: string;
  // Schede extras
  ddtRichiedere: string;
  mobili: string;
  schede: string;
  anticipareNod: boolean;
  noteNod: string;
  resi: string;
  condizioniPagamento: string;
  note: string;
}

function emptyForm(tipo: ModuloTipo, existing?: Modulo): FormState {
  if (existing) {
    const d = existing.datiAggiuntivi as any;
    return {
      tipo: existing.tipo,
      cliente: existing.cliente,
      agente: existing.agente,
      dataOrdine: existing.dataOrdine,
      consegnaStimata: existing.consegnaStimata ?? "",
      numeroOfferta: existing.numeroOfferta,
      numeroOrdine: existing.numeroOrdine,
      articoli: existing.articoli.length > 0 ? existing.articoli : [{ nr: 1, codArticolo: "", articolo: "", prezzo: 0, note: "" }],
      tipoCliente: d?.tipoCliente ?? "",
      schedinoFascette: d?.schedinoFascette ?? false,
      garanzia: d?.garanzia ?? false,
      cabinetUsati: d?.cabinetUsati ?? "",
      modelliPrecedenti: d?.modelliPrecedenti ?? "",
      corriere: d?.corriere ?? "",
      porto: d?.porto ?? "",
      dimBancale: d?.dimBancale ?? "",
      modalitaPagamento: d?.modalitaPagamento ?? "",
      ddtRichiedere: d?.ddtRichiedere ?? "",
      mobili: d?.mobili ?? "",
      schede: d?.schede ?? "",
      anticipareNod: d?.anticipareNod ?? false,
      noteNod: d?.noteNod ?? "",
      resi: d?.resi ?? "",
      condizioniPagamento: d?.condizioniPagamento ?? "",
      note: existing.note,
    };
  }
  return {
    tipo,
    cliente: "",
    agente: "",
    dataOrdine: new Date().toISOString().split("T")[0],
    consegnaStimata: "",
    numeroOfferta: "",
    numeroOrdine: "",
    articoli: [{ nr: 1, codArticolo: "", articolo: "", prezzo: 0, note: "" }],
    tipoCliente: "",
    schedinoFascette: false,
    garanzia: false,
    cabinetUsati: "",
    modelliPrecedenti: "",
    corriere: "",
    porto: "",
    dimBancale: "",
    modalitaPagamento: "",
    ddtRichiedere: "",
    mobili: "",
    schede: "",
    anticipareNod: false,
    noteNod: "",
    resi: "",
    condizioniPagamento: "",
    note: "",
  };
}

function ModuloFormModal({
  isOpen, onClose, tipo, modulo, onSalva,
}: {
  isOpen: boolean;
  onClose: () => void;
  tipo: ModuloTipo;
  modulo: Modulo | null;
  onSalva: (state: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(() => emptyForm(tipo, modulo ?? undefined));

  useEffect(() => {
    setForm(emptyForm(tipo, modulo ?? undefined));
  }, [tipo, modulo, isOpen]);

  if (!isOpen) return null;

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const updateArticolo = (i: number, patch: Partial<ArticoloOrdine>) => {
    setForm((prev) => {
      const arr = [...prev.articoli];
      arr[i] = { ...arr[i], ...patch };
      return { ...prev, articoli: arr };
    });
  };

  const addArticolo = () => {
    setForm((prev) => ({
      ...prev,
      articoli: [...prev.articoli, { nr: prev.articoli.length + 1, codArticolo: "", articolo: "", prezzo: 0, note: "" }],
    }));
  };

  const removeArticolo = (i: number) => {
    setForm((prev) => ({
      ...prev,
      articoli: prev.articoli.filter((_, idx) => idx !== i),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const datiAggiuntivi: Record<string, unknown> = {};
    if (tipo === "ordine_monitor") {
      datiAggiuntivi.tipoCliente = form.tipoCliente;
      datiAggiuntivi.schedinoFascette = form.schedinoFascette;
      datiAggiuntivi.garanzia = form.garanzia;
      datiAggiuntivi.cabinetUsati = form.cabinetUsati;
      datiAggiuntivi.modelliPrecedenti = form.modelliPrecedenti;
      datiAggiuntivi.corriere = form.corriere;
      datiAggiuntivi.porto = form.porto;
      datiAggiuntivi.dimBancale = form.dimBancale;
      datiAggiuntivi.modalitaPagamento = form.modalitaPagamento;
    } else {
      datiAggiuntivi.ddtRichiedere = form.ddtRichiedere;
      datiAggiuntivi.mobili = form.mobili;
      datiAggiuntivi.schede = form.schede;
      datiAggiuntivi.anticipareNod = form.anticipareNod;
      datiAggiuntivi.noteNod = form.noteNod;
      datiAggiuntivi.resi = form.resi;
      datiAggiuntivi.condizioniPagamento = form.condizioniPagamento;
    }

    onSalva({
      ...form,
      articoli: form.articoli.filter((a) => a.articolo || a.codArticolo),
      datiAggiuntivi: datiAggiuntivi as any,
    } as any);
  };

  const isMonitor = tipo === "ordine_monitor";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "#00000080", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: easeSmooth }}
        className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-[680px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border-subtle sticky top-0 bg-bg-surface z-10">
          <h2 className="font-heading-2 text-text-primary">
            {modulo ? "Modifica" : "Nuovo"} {OPERATORI_LABEL[tipo]}
          </h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Header comune */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cliente">
              <input value={form.cliente} onChange={(e) => set({ cliente: e.target.value })}
                className="input-field" placeholder="Nome cliente" />
            </Field>
            <Field label="Agente">
              <input value={form.agente} onChange={(e) => set({ agente: e.target.value })}
                className="input-field" placeholder="Agente" />
            </Field>
            <Field label="Data Ordine">
              <input type="date" value={form.dataOrdine} onChange={(e) => set({ dataOrdine: e.target.value })}
                className="input-field" />
            </Field>
            <Field label="Consegna Stimata">
              <input type="date" value={form.consegnaStimata} onChange={(e) => set({ consegnaStimata: e.target.value })}
                className="input-field" />
            </Field>
            <Field label={isMonitor ? "Offerta a Cliente N." : "Offerta N."}>
              <input value={form.numeroOfferta} onChange={(e) => set({ numeroOfferta: e.target.value })}
                className="input-field" placeholder="Numero offerta" />
            </Field>
            <Field label={isMonitor ? "Ordine a Cliente N." : "Ordine N."}>
              <input value={form.numeroOrdine} onChange={(e) => set({ numeroOrdine: e.target.value })}
                className="input-field" placeholder="Numero ordine" />
            </Field>
          </div>

          {isMonitor && (
            <>
              <Field label="DDT a Cliente N.">
                <input value={(form as any).ddtCliente ?? ""} onChange={(e) => set({ ...form, ddtCliente: e.target.value } as any)}
                  className="input-field" placeholder="Numero DDT" />
              </Field>
              <Field label="ODA Ricevuto dal Cliente">
                <input value={(form as any).oda ?? ""} onChange={(e) => set({ ...form, oda: e.target.value } as any)}
                  className="input-field" placeholder="ODA" />
              </Field>
            </>
          )}

          {/* Articoli */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-body-small text-text-secondary">Articoli</label>
              <Button type="button" size="sm" variant="ghost" onClick={addArticolo}>
                <Plus size={14} /> Aggiungi
              </Button>
            </div>
            <div className="space-y-2">
              {form.articoli.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-text-muted w-5">{a.nr}</span>
                  <input value={a.codArticolo} onChange={(e) => updateArticolo(i, { codArticolo: e.target.value })}
                    className="input-field flex-1" placeholder="Cod. articolo" />
                  {isMonitor ? (
                    <>
                      <input value={a.marca ?? ""} onChange={(e) => updateArticolo(i, { marca: e.target.value })}
                        className="input-field flex-1" placeholder="Marca" />
                      <input value={a.modello ?? ""} onChange={(e) => updateArticolo(i, { modello: e.target.value })}
                        className="input-field flex-1" placeholder="Modello" />
                    </>
                  ) : (
                    <input value={a.articolo} onChange={(e) => updateArticolo(i, { articolo: e.target.value })}
                      className="input-field flex-[2]" placeholder="Articolo" />
                  )}
                  <input type="number" value={a.prezzo || ""} onChange={(e) => updateArticolo(i, { prezzo: Number(e.target.value) })}
                    className="input-field w-24" placeholder="Prezzo" />
                  <input value={a.note} onChange={(e) => updateArticolo(i, { note: e.target.value })}
                    className="input-field flex-1" placeholder="Note" />
                  {form.articoli.length > 1 && (
                    <button type="button" onClick={() => removeArticolo(i)}
                      className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-status-rosso">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Campi specifici */}
          {isMonitor ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo Cliente">
                  <select value={form.tipoCliente} onChange={(e) => set({ tipoCliente: e.target.value })}
                    className="input-field">
                    <option value="">Seleziona...</option>
                    <option value="noleggiatore">Noleggiatore</option>
                    <option value="rivenditore">Rivenditore</option>
                    <option value="grossista">Grossista</option>
                    <option value="altro">Altro</option>
                  </select>
                </Field>
                <Field label="Corriere">
                  <input value={form.corriere} onChange={(e) => set({ corriere: e.target.value })}
                    className="input-field" placeholder="Corriere" />
                </Field>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={form.schedinoFascette} onChange={(e) => set({ schedinoFascette: e.target.checked })}
                    className="rounded border-border-default" />
                  Schedino + Fascette
                </label>
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={form.garanzia} onChange={(e) => set({ garanzia: e.target.checked })}
                    className="rounded border-border-default" />
                  Garanzia
                </label>
              </div>
              <Field label="Cabinet Utilizzati dal Cliente">
                <textarea value={form.cabinetUsati} onChange={(e) => set({ cabinetUsati: e.target.value })}
                  className="input-field resize-none" rows={2} placeholder="Elenco cabinet..." />
              </Field>
              <Field label="Modelli Gia' Acquistati">
                <textarea value={form.modelliPrecedenti} onChange={(e) => set({ modelliPrecedenti: e.target.value })}
                  className="input-field resize-none" rows={2} placeholder="Modelli precedenti..." />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Porto">
                  <select value={form.porto} onChange={(e) => set({ porto: e.target.value })}
                    className="input-field">
                    <option value="">Seleziona...</option>
                    <option value="franco">Franco</option>
                    <option value="assegnato">Assegnato</option>
                  </select>
                </Field>
                <Field label="Dimensioni Bancale">
                  <input value={form.dimBancale} onChange={(e) => set({ dimBancale: e.target.value })}
                    className="input-field" placeholder="L x L x H, peso" />
                </Field>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="DDT da Richiedere">
                  <input value={form.ddtRichiedere} onChange={(e) => set({ ddtRichiedere: e.target.value })}
                    className="input-field" placeholder="DDT" />
                </Field>
                <Field label="Si Ritirano / Il Cliente Rende">
                  <input value={form.resi} onChange={(e) => set({ resi: e.target.value })}
                    className="input-field" placeholder="Resi" />
                </Field>
              </div>
              <Field label="Mobili">
                <textarea value={form.mobili} onChange={(e) => set({ mobili: e.target.value })}
                  className="input-field resize-none" rows={2} placeholder="Mobili..." />
              </Field>
              <Field label="Schede">
                <textarea value={form.schede} onChange={(e) => set({ schede: e.target.value })}
                  className="input-field resize-none" rows={2} placeholder="Schede..." />
              </Field>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={form.anticipareNod} onChange={(e) => set({ anticipareNod: e.target.checked })}
                    className="rounded border-border-default" />
                  Anticipare NOD
                </label>
                {form.anticipareNod && (
                  <input value={form.noteNod} onChange={(e) => set({ noteNod: e.target.value })}
                    className="input-field w-40" placeholder="NOD anticipato il..." />
                )}
              </div>
            </>
          )}

          <Field label="Modalita' di Pagamento">
            <textarea value={form.modalitaPagamento} onChange={(e) => set({ modalitaPagamento: e.target.value })}
              className="input-field resize-none" rows={2} placeholder="Modalita' di pagamento..." />
          </Field>

          {!isMonitor && (
            <Field label="Condizioni di Pagamento">
              <input value={form.condizioniPagamento} onChange={(e) => set({ condizioniPagamento: e.target.value })}
                className="input-field" placeholder="Condizioni..." />
            </Field>
          )}

          <Field label="Note">
            <textarea value={form.note} onChange={(e) => set({ note: e.target.value })}
              className="input-field resize-none" rows={3} placeholder="Note generali..." />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-subtle">
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            {modulo && (
              <>
                <Button type="button" size="sm" variant="ghost" onClick={() => apriStampaModulo(modulo)} title="Stampa">
                  <Printer size={14} />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => exportModuloToExcel(modulo)} title="Esporta Excel">
                  <FileDown size={14} />
                </Button>
              </>
            )}
            <Button type="submit" className="flex items-center gap-2">
              <Send size={14} /> Salva
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ------------ FIELD ------------ */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-body-small text-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}
