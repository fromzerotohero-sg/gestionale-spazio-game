import { getSupabase, isSupabaseConfigured, supabaseConfigError } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Operatore = "Giangrossi" | "Irene" | "Matteo" | "Paolo";

export interface Comunicazione {
  id: string;
  autore: Operatore;
  destinatario: Operatore | null;
  messaggio: string;
  urgente: boolean;
  archiviata: boolean;
  scadenza: string | null;
  createdAt: string;
  updatedAt: string;
}

type Row = Database["public"]["Tables"]["comunicazioni"]["Row"];

function rowToComunicazione(row: Row): Comunicazione {
  return {
    id: row.id,
    autore: row.autore as Operatore,
    destinatario: row.destinatario as Operatore | null,
    messaggio: row.messaggio,
    urgente: row.urgente,
    archiviata: row.archiviata,
    scadenza: row.scadenza,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchComunicazioni(): Promise<Comunicazione[]> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }
  const { data, error } = await (getSupabase()
    .from("comunicazioni" as any)
    .select("*")
    .order("updated_at", { ascending: false }) as any);

  if (error) throw error;
  return (data ?? []).map(rowToComunicazione);
}

export async function createComunicazione(
  autore: Operatore,
  messaggio: string,
  urgente: boolean,
  destinatario: Operatore | null,
  scadenza: string | null,
): Promise<Comunicazione> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }

  const insertRow: any = {
    autore,
    messaggio,
    urgente,
    destinatario: destinatario ?? null,
  };
  if (scadenza) insertRow.scadenza = scadenza;

  const { data, error } = await (getSupabase()
    .from("comunicazioni" as any)
    .insert(insertRow)
    .select()
    .single() as any);

  if (error) throw error;
  return rowToComunicazione(data);
}

export async function updateComunicazione(
  id: string,
  patch: {
    messaggio?: string;
    urgente?: boolean;
    archiviata?: boolean;
    scadenza?: string | null;
    destinatario?: Operatore | null;
  },
): Promise<Comunicazione> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }

  const updateRow: any = {};
  if (patch.messaggio !== undefined) updateRow.messaggio = patch.messaggio;
  if (patch.urgente !== undefined) updateRow.urgente = patch.urgente;
  if (patch.archiviata !== undefined) updateRow.archiviata = patch.archiviata;
  if (patch.scadenza !== undefined) updateRow.scadenza = patch.scadenza;
  if (patch.destinatario !== undefined) updateRow.destinatario = patch.destinatario;

  const { data, error } = await (getSupabase()
    .from("comunicazioni" as any)
    .update(updateRow)
    .eq("id", id)
    .select()
    .single() as any);

  if (error) throw error;
  return rowToComunicazione(data);
}

export async function deleteComunicazione(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }
  const { error } = await (getSupabase()
    .from("comunicazioni" as any)
    .delete()
    .eq("id", id) as any);
  if (error) throw error;
}
