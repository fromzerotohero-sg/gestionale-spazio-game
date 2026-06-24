import { getSupabase, isSupabaseConfigured, supabaseConfigError } from "@/lib/supabase";
import type { Database } from "@/types/database";
import * as XLSX from "xlsx";

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

/* ------------ EXPORT TO EXCEL ------------ */

function formatDateSafe(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function exportModuloToExcel(modulo: Modulo): void {
  const wb = XLSX.utils.book_new();
  const d = modulo.datiAggiuntivi as Record<string, unknown>;

  if (modulo.tipo === "ordine_monitor") {
    const rows: (string | string)[][] = [
      ["MODULO ORDINE MONITOR", ""],
      ["", ""],
      ["Cliente", modulo.cliente],
      ["Agente", modulo.agente],
      ["Data Ordine", formatDateSafe(modulo.dataOrdine)],
      ["Consegna Stimata", formatDateSafe(modulo.consegnaStimata)],
      ["Offerta Cliente N.", modulo.numeroOfferta],
      ["Ordine Cliente N.", modulo.numeroOrdine],
      ["DDT Cliente N.", (d.ddtCliente as string) ?? ""],
      ["ODA Ricevuto", (d.oda as string) ?? ""],
      ["", ""],
      ["Tipo Cliente", (d.tipoCliente as string) ?? ""],
      ["Schedino+Fascette", (d.schedinoFascette as boolean) ? "SI" : "NO"],
      ["Garanzia", (d.garanzia as boolean) ? "SI" : "NO"],
      ["Cabinet Usati", (d.cabinetUsati as string) ?? ""],
      ["Modelli Acquistati", (d.modelliPrecedenti as string) ?? ""],
      ["Corriere", (d.corriere as string) ?? ""],
      ["Porto", (d.porto as string) ?? ""],
      ["Dimensioni Bancale", (d.dimBancale as string) ?? ""],
      ["Modalita' Pagamento", (d.modalitaPagamento as string) ?? ""],
      ["", ""],
      ["ARTICOLI", ""],
      ["NR", "Cod.Articolo", "Marca", "Modello", "Prezzo", "Note"],
    ];

    for (const a of modulo.articoli) {
      rows.push([
        String(a.nr),
        a.codArticolo,
        a.marca ?? "",
        a.modello ?? "",
        a.prezzo > 0 ? String(a.prezzo) : "",
        a.note,
      ]);
    }

    rows.push(["", ""]);
    rows.push(["Note", modulo.note]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 24 }, { wch: 14 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Ordine Monitor");
  } else {
    const rows: (string | string)[][] = [
      ["MODULO ORDINE CLIENTE SCHEDE 65%", ""],
      ["", ""],
      ["Cliente", modulo.cliente],
      ["Agente", modulo.agente],
      ["Data Ordine", formatDateSafe(modulo.dataOrdine)],
      ["Consegna Stimata", formatDateSafe(modulo.consegnaStimata)],
      ["Offerta N.", modulo.numeroOfferta],
      ["Ordine N.", modulo.numeroOrdine],
      ["", ""],
      ["DDT da Richiedere", (d.ddtRichiedere as string) ?? ""],
      ["Si Ritirano / Resi", (d.resi as string) ?? ""],
      ["Mobili", (d.mobili as string) ?? ""],
      ["Schede", (d.schede as string) ?? ""],
      ["Anticipare NOD", (d.anticipareNod as boolean) ? "SI" : "NO"],
      ["NOD Anticipato il", (d.noteNod as string) ?? ""],
      ["Modalita' Pagamento", (d.modalitaPagamento as string) ?? ""],
      ["Condizioni Pagamento", (d.condizioniPagamento as string) ?? ""],
      ["", ""],
      ["ARTICOLI", ""],
      ["NR", "Cod.Articolo", "Articolo", "Rende Base", "Resa", "Prezzo", "Note"],
    ];

    for (const a of modulo.articoli) {
      rows.push([
        String(a.nr),
        a.codArticolo,
        a.articolo,
        a.rendeBase != null ? String(a.rendeBase) : "",
        a.resa != null ? String(a.resa) : "",
        a.prezzo > 0 ? String(a.prezzo) : "",
        a.note,
      ]);
    }

    rows.push(["", ""]);
    rows.push(["Note", modulo.note]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 8 }, { wch: 16 }, { wch: 24 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Ordine Schede 65%");
  }

  const nome = `${modulo.tipo}_${modulo.cliente || "senza_cliente"}_${modulo.dataOrdine}.xlsx`;
  XLSX.writeFile(wb, nome);
}

/* ------------ PRINT ------------ */

export function apriStampaModulo(modulo: Modulo): void {
  const d = modulo.datiAggiuntivi as Record<string, unknown>;
  let html = `
<style>
  body { font-family: 'Segoe UI', sans-serif; color: #111; padding: 40px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .sub { color: #666; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  td { padding: 4px 8px; font-size: 13px; border-bottom: 1px solid #eee; }
  td:first-child { font-weight: 600; width: 200px; color: #555; }
  .section { font-size: 14px; font-weight: 700; margin: 16px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #333; }
  .art table { margin-top: 8px; }
  .art th { background: #f5f5f5; text-align: left; font-size: 11px; padding: 4px 8px; }
  .art td { font-size: 12px; }
  .note { white-space: pre-wrap; font-size: 12px; color: #444; margin-top: 16px; padding: 12px; background: #f9f9f9; border-radius: 6px; }
  @media print { body { padding: 20px; } }
</style>
<h1>${modulo.tipo === "ordine_monitor" ? "MODULO ORDINE MONITOR" : "MODULO ORDINE CLIENTE SCHEDE 65%"}</h1>
<p class="sub">Generato il ${new Date().toLocaleDateString("it-IT")}</p>
<div class="section">Dati Ordine</div>
<table>
  <tr><td>Cliente</td><td>${modulo.cliente || "-"}</td></tr>
  <tr><td>Agente</td><td>${modulo.agente || "-"}</td></tr>
  <tr><td>Data Ordine</td><td>${formatDateSafe(modulo.dataOrdine) || "-"}</td></tr>
  <tr><td>Consegna Stimata</td><td>${formatDateSafe(modulo.consegnaStimata) || "-"}</td></tr>
  <tr><td>Offerta N.</td><td>${modulo.numeroOfferta || "-"}</td></tr>
  <tr><td>Ordine N.</td><td>${modulo.numeroOrdine || "-"}</td></tr>
`;

  if (modulo.tipo === "ordine_monitor") {
    html += `
  <tr><td>DDT Cliente N.</td><td>${d.ddtCliente ?? "-"}</td></tr>
  <tr><td>ODA Ricevuto</td><td>${d.oda ?? "-"}</td></tr>
  <tr><td>Tipo Cliente</td><td>${d.tipoCliente ?? "-"}</td></tr>
  <tr><td>Schedino+Fascette</td><td>${d.schedinoFascette ? "SI" : "NO"} &nbsp;|&nbsp; Garanzia: ${d.garanzia ? "SI" : "NO"}</td></tr>
  <tr><td>Corriere</td><td>${d.corriere ?? "-"}</td></tr>
  <tr><td>Porto</td><td>${d.porto ?? "-"}</td></tr>
  <tr><td>Dimensioni Bancale</td><td>${d.dimBancale ?? "-"}</td></tr>
`;
  } else {
    html += `
  <tr><td>DDT da Richiedere</td><td>${d.ddtRichiedere ?? "-"}</td></tr>
  <tr><td>Si Ritirano / Resi</td><td>${d.resi ?? "-"}</td></tr>
  <tr><td>Anticipare NOD</td><td>${d.anticipareNod ? "SI" : "NO"}</td></tr>
  ${d.anticipareNod ? `<tr><td>NOD Anticipato il</td><td>${d.noteNod ?? "-"}</td></tr>` : ""}
`;
  }

  html += `
  <tr><td>Modalita' Pagamento</td><td>${d.modalitaPagamento ?? "-"}</td></tr>
  ${modulo.tipo !== "ordine_monitor" ? `<tr><td>Condizioni Pagamento</td><td>${d.condizioniPagamento ?? "-"}</td></tr>` : ""}
</table>
`;

  if (modulo.tipo === "ordine_monitor") {
    html += `
  <div class="section">Cabinet</div>
  <table>
    <tr><td>Cabinet Usati</td><td>${(d.cabinetUsati as string) || "-"}</td></tr>
    <tr><td>Modelli Acquistati</td><td>${(d.modelliPrecedenti as string) || "-"}</td></tr>
  </table>
`;
  } else {
    html += `
  <div class="section">Dettagli</div>
  <table>
    <tr><td>Mobili</td><td>${(d.mobili as string) || "-"}</td></tr>
    <tr><td>Schede</td><td>${(d.schede as string) || "-"}</td></tr>
  </table>
`;
  }

  html += `<div class="section">Articoli</div><div class="art"><table><tr>`;

  if (modulo.tipo === "ordine_monitor") {
    html += `<th>NR</th><th>Cod.Articolo</th><th>Marca</th><th>Modello</th><th>Prezzo</th><th>Note</th>`;
  } else {
    html += `<th>NR</th><th>Cod.Articolo</th><th>Articolo</th><th>Rende Base</th><th>Resa</th><th>Prezzo</th><th>Note</th>`;
  }
  html += `</tr>`;

  for (const a of modulo.articoli) {
    html += `<tr>`;
    if (modulo.tipo === "ordine_monitor") {
      html += `<td>${a.nr}</td><td>${a.codArticolo}</td><td>${a.marca ?? ""}</td><td>${a.modello ?? ""}</td><td>${a.prezzo > 0 ? a.prezzo : ""}</td><td>${a.note}</td>`;
    } else {
      html += `<td>${a.nr}</td><td>${a.codArticolo}</td><td>${a.articolo}</td><td>${a.rendeBase ?? ""}</td><td>${a.resa ?? ""}</td><td>${a.prezzo > 0 ? a.prezzo : ""}</td><td>${a.note}</td>`;
    }
    html += `</tr>`;
  }
  html += `</table></div>`;

  if (modulo.note) {
    html += `<div class="note"><strong>Note:</strong><br>${modulo.note.replace(/\n/g, "<br>")}</div>`;
  }

  html += `</body>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    // Auto-print after short delay
    setTimeout(() => w.print(), 400);
  }
}
