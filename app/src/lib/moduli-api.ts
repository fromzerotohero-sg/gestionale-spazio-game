import { getSupabase, isSupabaseConfigured, supabaseConfigError } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type ModuloTipo = "ordine_monitor" | "ordine_schede_65";
export type Operatore = "Giangrossi" | "Irene" | "Matteo" | "Paolo";

export interface Modulo {
  id: string;
  tipo: ModuloTipo;
  titolo: string;
  cliente: string;
  agente: string;
  dataOrdine: string;
  consegnaStimata: string | null;
  numeroOfferta: string;
  numeroOrdine: string;
  articoli: ArticoloOrdine[];
  datiAggiuntivi: Record<string, unknown>;
  note: string;
  createdAt: string;
  updatedAt: string;
  createdBy: Operatore | null;
}

export interface ArticoloOrdine {
  nr: number;
  codArticolo: string;
  articolo: string;   // or marca/modello for monitor
  prezzo: number;
  note: string;
  // Schede-specific
  rendeBase?: number;
  resa?: number;
  // Monitor-specific
  marca?: string;
  modello?: string;
}

type Row = Database["public"]["Tables"]["moduli"]["Row"];

function rowToModulo(row: Row): Modulo {
  return {
    id: row.id,
    tipo: row.tipo as ModuloTipo,
    titolo: row.titolo,
    cliente: row.cliente,
    agente: row.agente,
    dataOrdine: row.data_ordine,
    consegnaStimata: row.consegna_stimata,
    numeroOfferta: row.numero_offerta,
    numeroOrdine: row.numero_ordine,
    articoli: (row.articoli as unknown as ArticoloOrdine[]) ?? [],
    datiAggiuntivi: (row.dati_aggiuntivi as Record<string, unknown>) ?? {},
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by as Operatore | null,
  };
}

export async function fetchModuli(): Promise<Modulo[]> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }
  const { data, error } = await (getSupabase()
    .from("moduli" as any)
    .select("*")
    .order("created_at", { ascending: false }) as any);

  if (error) throw error;
  return (data ?? []).map(rowToModulo);
}

export async function createModulo(
  tipo: ModuloTipo,
  cliente: string,
  agente: string,
  dataOrdine: string,
  articoli: ArticoloOrdine[],
  extras: {
    titolo?: string;
    consegnaStimata?: string | null;
    numeroOfferta?: string;
    numeroOrdine?: string;
    datiAggiuntivi?: Record<string, unknown>;
    note?: string;
    createdBy?: Operatore | null;
  },
): Promise<Modulo> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }

  const insertRow: any = {
    tipo,
    cliente,
    agente,
    data_ordine: dataOrdine,
    articoli,
    titolo: extras.titolo ?? "",
    consegna_stimata: extras.consegnaStimata ?? null,
    numero_offerta: extras.numeroOfferta ?? "",
    numero_ordine: extras.numeroOrdine ?? "",
    dati_aggiuntivi: extras.datiAggiuntivi ?? {},
    note: extras.note ?? "",
    created_by: extras.createdBy ?? null,
  };

  const { data, error } = await (getSupabase()
    .from("moduli" as any)
    .insert(insertRow)
    .select()
    .single() as any);

  if (error) throw error;
  return rowToModulo(data);
}

export async function updateModulo(
  id: string,
  patch: Partial<{
    titolo: string;
    cliente: string;
    agente: string;
    dataOrdine: string;
    consegnaStimata: string | null;
    numeroOfferta: string;
    numeroOrdine: string;
    articoli: ArticoloOrdine[];
    datiAggiuntivi: Record<string, unknown>;
    note: string;
  }>,
): Promise<Modulo> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }

  const updateRow: any = {};
  if (patch.titolo !== undefined) updateRow.titolo = patch.titolo;
  if (patch.cliente !== undefined) updateRow.cliente = patch.cliente;
  if (patch.agente !== undefined) updateRow.agente = patch.agente;
  if (patch.dataOrdine !== undefined) updateRow.data_ordine = patch.dataOrdine;
  if (patch.consegnaStimata !== undefined) updateRow.consegna_stimata = patch.consegnaStimata;
  if (patch.numeroOfferta !== undefined) updateRow.numero_offerta = patch.numeroOfferta;
  if (patch.numeroOrdine !== undefined) updateRow.numero_ordine = patch.numeroOrdine;
  if (patch.articoli !== undefined) updateRow.articoli = patch.articoli;
  if (patch.datiAggiuntivi !== undefined) updateRow.dati_aggiuntivi = patch.datiAggiuntivi;
  if (patch.note !== undefined) updateRow.note = patch.note;

  const { data, error } = await (getSupabase()
    .from("moduli" as any)
    .update(updateRow)
    .eq("id", id)
    .select()
    .single() as any);

  if (error) throw error;
  return rowToModulo(data);
}

export async function deleteModulo(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }
  const { error } = await (getSupabase()
    .from("moduli" as any)
    .delete()
    .eq("id", id) as any);
  if (error) throw error;
}

/* Template download — embedded base64 Excel files */

const TEMPLATE_MONITOR_B64 = ""; // placeholder — verra' usato l'Excel caricato
const TEMPLATE_SCHEDE_B64 = ""; // placeholder

export interface TemplateInfo {
  key: ModuloTipo;
  label: string;
  descrizione: string;
  rev: string;
  blob: () => Blob;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    key: "ordine_monitor",
    label: "Modulo Ordine Monitor",
    descrizione: "Ordine per monitor — cliente, articoli, tipo cliente, trasporto, pagamento",
    rev: "rev. 1.0 del 20/12/2021",
    blob: () => new Blob([TEMPLATE_MONITOR_B64], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  },
  {
    key: "ordine_schede_65",
    label: "Modulo Ordine Cliente Schede 65%",
    descrizione: "Ordine per schede al 65% — cliente, articoli, resi, DDT, NOD, pagamento",
    rev: "rev. 1.3 del 18/12/2023",
    blob: () => new Blob([TEMPLATE_SCHEDE_B64], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  },
];
