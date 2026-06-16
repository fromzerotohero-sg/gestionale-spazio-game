import { getSupabase, isSupabaseConfigured, supabaseConfigError } from "@/lib/supabase";
import type { Database, ExternalRepairRow } from "@/types/database";

export type Operatore = "Giangrossi" | "Irene" | "Matteo" | "Paolo";

export type RepairStato =
  | "da_inviare"
  | "inviato"
  | "in_riparazione"
  | "rientrato"
  | "montato"
  | "chiuso";

export interface LavoroRow {
  id: string;
  descrizione: string;
  tempoMinuti: number;
  tecnico: string;
}

export interface MaterialeRow {
  id: string;
  nome: string;
  quantita: number;
}

export interface TimelineEntry {
  id: string;
  from: RepairStato | "";
  to: RepairStato;
  timestamp: string;
  user: string;
}

export interface ExternalRepair {
  id: string;
  code: string;
  cliente: string;
  commessa: string;
  fabbisogno: string;
  ubicazione: string;
  dove_montato: string;
  descrizione_guasto: string;
  descrizione_riparazione: string;
  tecnico: Operatore | null;
  dataInizio: string;
  dataFine: string | null;
  tempoImpiegatoMinuti: number;
  fornitore: string;
  dataInvio: string | null;
  consegnaPrevista: string | null;
  dataRientro: string | null;
  stato: RepairStato;
  materiali: MaterialeRow[];
  lavori: LavoroRow[];
  timeline: TimelineEntry[];
  note: string;
  createdAt: string;
  updatedAt: string;
  createdBy: Operatore | null;
  updatedBy: Operatore | null;
}

export type RepairFormInput = Omit<
  ExternalRepair,
  "id" | "code" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
> & { id?: string; code?: string };

const STATO_ORDINE: RepairStato[] = [
  "da_inviare",
  "inviato",
  "in_riparazione",
  "rientrato",
  "montato",
  "chiuso",
];

export function prossimoStato(current: RepairStato): RepairStato | null {
  const idx = STATO_ORDINE.indexOf(current);
  if (idx < STATO_ORDINE.length - 1) return STATO_ORDINE[idx + 1];
  return null;
}

export function statoSprecedente(current: RepairStato): RepairStato | null {
  const idx = STATO_ORDINE.indexOf(current);
  if (idx > 0) return STATO_ORDINE[idx - 1];
  return null;
}

export const STATI_ETICHETTE: Record<RepairStato, string> = {
  da_inviare: "Da Inviare",
  inviato: "Inviato",
  in_riparazione: "In Riparazione",
  rientrato: "Rientrato",
  montato: "Montato",
  chiuso: "Chiuso",
};

export const STATO_COLORE: Record<RepairStato, string> = {
  da_inviare: "#525252",
  inviato: "#F97316",
  in_riparazione: "#3B82F6",
  rientrato: "#22C55E",
  montato: "#8B5CF6",
  chiuso: "#06B6D4",
};

export function generaCodice(esistenti: string[]): string {
  const anno = new Date().getFullYear();
  const prefisso = `RE-${anno}-`;
  const nums = esistenti
    .filter((c) => c.startsWith(prefisso))
    .map((c) => parseInt(c.replace(prefisso, ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefisso}${String(max + 1).padStart(4, "0")}`;
}

/* ─────────── MAPPERS ─────────── */

function rowToRepair(row: ExternalRepairRow): ExternalRepair {
  return {
    id: row.id,
    code: row.code,
    cliente: row.cliente,
    commessa: row.commessa,
    fabbisogno: row.fabbisogno,
    ubicazione: row.ubicazione,
    dove_montato: row.dove_montato,
    descrizione_guasto: row.descrizione_guasto,
    descrizione_riparazione: row.descrizione_riparazione,
    tecnico: row.tecnico,
    dataInizio: row.data_inizio,
    dataFine: row.data_fine,
    tempoImpiegatoMinuti: row.tempo_impiegato_minuti,
    fornitore: row.fornitore,
    dataInvio: row.data_invio,
    consegnaPrevista: row.consegna_prevista,
    dataRientro: row.data_rientro,
    stato: row.stato as RepairStato,
    materiali: (row.materiali ?? []) as unknown as MaterialeRow[],
    lavori: (row.lavori ?? []) as unknown as LavoroRow[],
    timeline: (row.timeline ?? []) as unknown as TimelineEntry[],
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

/* ─────────── CRUD ─────────── */

export async function fetchExternalRepairs(): Promise<ExternalRepair[]> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }
  const { data, error } = await (getSupabase()
    .from("external_repairs" as any)
    .select("*")
    .order("created_at", { ascending: false }) as any);

  if (error) throw error;
  return (data ?? []).map(rowToRepair);
}

export async function createExternalRepair(
  input: RepairFormInput,
  operatore: Operatore,
): Promise<ExternalRepair> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: esistenti } = await (getSupabase()
    .from("external_repairs" as any)
    .select("code") as any);

  const codici = ((esistenti ?? []) as { code: string }[]).map((r) => r.code);
  const code = generaCodice(codici);

  const insertRow: Database["public"]["Tables"]["external_repairs"]["Insert"] = {
    code,
    cliente: input.cliente,
    commessa: input.commessa,
    fabbisogno: input.fabbisogno,
    ubicazione: input.ubicazione,
    dove_montato: input.dove_montato,
    descrizione_guasto: input.descrizione_guasto,
    descrizione_riparazione: input.descrizione_riparazione,
    tecnico: input.tecnico,
    data_inizio: input.dataInizio,
    data_fine: input.dataFine ?? null,
    tempo_impiegato_minuti: input.tempoImpiegatoMinuti,
    fornitore: input.fornitore,
    data_invio: input.dataInvio ?? null,
    consegna_prevista: input.consegnaPrevista ?? null,
    data_rientro: input.dataRientro ?? null,
    stato: input.stato,
    materiali: JSON.parse(JSON.stringify(input.materiali)),
    lavori: JSON.parse(JSON.stringify(input.lavori)),
    timeline: JSON.parse(JSON.stringify(input.timeline)),
    note: input.note,
    created_by: operatore,
    updated_by: operatore,
  };

  const { data, error } = await (getSupabase()
    .from("external_repairs")
    .insert(insertRow as any)
    .select()
    .single());

  if (error) throw error;
  return rowToRepair(data);
}

export async function updateExternalRepair(
  id: string,
  patch: Partial<RepairFormInput>,
  operatore: Operatore,
): Promise<ExternalRepair> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }

  const updateRow: Database["public"]["Tables"]["external_repairs"]["Update"] = {
    updated_by: operatore,
  };

  if (patch.cliente !== undefined) updateRow.cliente = patch.cliente;
  if (patch.commessa !== undefined) updateRow.commessa = patch.commessa;
  if (patch.fabbisogno !== undefined) updateRow.fabbisogno = patch.fabbisogno;
  if (patch.ubicazione !== undefined) updateRow.ubicazione = patch.ubicazione;
  if (patch.dove_montato !== undefined)
    updateRow.dove_montato = patch.dove_montato;
  if (patch.descrizione_guasto !== undefined)
    updateRow.descrizione_guasto = patch.descrizione_guasto;
  if (patch.descrizione_riparazione !== undefined)
    updateRow.descrizione_riparazione = patch.descrizione_riparazione;
  if (patch.tecnico !== undefined) updateRow.tecnico = patch.tecnico;
  if (patch.dataInizio !== undefined) updateRow.data_inizio = patch.dataInizio;
  if (patch.dataFine !== undefined)
    updateRow.data_fine = patch.dataFine ?? null;
  if (patch.tempoImpiegatoMinuti !== undefined)
    updateRow.tempo_impiegato_minuti = patch.tempoImpiegatoMinuti;
  if (patch.fornitore !== undefined) updateRow.fornitore = patch.fornitore;
  if (patch.dataInvio !== undefined)
    updateRow.data_invio = patch.dataInvio ?? null;
  if (patch.consegnaPrevista !== undefined)
    updateRow.consegna_prevista = patch.consegnaPrevista ?? null;
  if (patch.dataRientro !== undefined)
    updateRow.data_rientro = patch.dataRientro ?? null;
  if (patch.stato !== undefined) updateRow.stato = patch.stato;
  if (patch.materiali !== undefined)
    updateRow.materiali = JSON.parse(JSON.stringify(patch.materiali));
  if (patch.lavori !== undefined)
    updateRow.lavori = JSON.parse(JSON.stringify(patch.lavori));
  if (patch.timeline !== undefined)
    updateRow.timeline = JSON.parse(JSON.stringify(patch.timeline));
  if (patch.note !== undefined) updateRow.note = patch.note;

  const { data, error } = await (getSupabase()
    .from("external_repairs")
    // @ts-expect-error - Database generic type inference issue
    .update(updateRow as any)
    .eq("id", id)
    .select()
    .single());

  if (error) throw error;
  return rowToRepair(data);
}

export async function deleteExternalRepair(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }
  const { error } = await (getSupabase()
    .from("external_repairs" as any)
    .delete()
    .eq("id", id) as any);
  if (error) throw error;
}

export async function cambiaStatoRepair(
  id: string,
  nuovoStato: RepairStato,
  operatore: Operatore,
  repairAttuale: ExternalRepair,
): Promise<ExternalRepair> {
  const nuovaTimeline: TimelineEntry[] = [
    ...repairAttuale.timeline,
    {
      id: `tl-${Date.now()}`,
      from: repairAttuale.stato,
      to: nuovoStato,
      timestamp: new Date().toISOString(),
      user: operatore,
    },
  ];

  return updateExternalRepair(
    id,
    {
      stato: nuovoStato,
      timeline: nuovaTimeline,
    },
    operatore,
  );
}
