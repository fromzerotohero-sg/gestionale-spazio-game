import type { Operatore } from "@/data/operators";
import {
  getSupabase,
  isSupabaseConfigured,
  supabaseConfigError,
} from "@/lib/supabase";
import type { SchedaPrenotazione } from "@/types/schede-prenotazioni";

type PrenotazioneRow = {
  id: string;
  numero_scheda: string;
  cliente: string;
  operatore: Operatore | null;
  created_at: string;
};

function rowToPrenotazione(row: PrenotazioneRow): SchedaPrenotazione {
  return {
    id: row.id,
    numeroScheda: row.numero_scheda,
    cliente: row.cliente,
    operatore: row.operatore ?? undefined,
    createdAt: row.created_at,
  };
}

export async function fetchSchedePrenotazioni(): Promise<SchedaPrenotazione[]> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }
  const { data, error } = await getSupabase()
    .from("schede_prenotazioni")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowToPrenotazione(row as PrenotazioneRow));
}

export async function createSchedaPrenotazione(
  numeroScheda: string,
  cliente: string,
  operatore: Operatore,
): Promise<SchedaPrenotazione> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }
  const { data, error } = await getSupabase()
    .from("schede_prenotazioni")
    .insert({
      numero_scheda: numeroScheda.trim(),
      cliente: cliente.trim(),
      operatore,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToPrenotazione(data as PrenotazioneRow);
}

export async function deleteSchedaPrenotazione(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }
  const { error } = await getSupabase()
    .from("schede_prenotazioni")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
