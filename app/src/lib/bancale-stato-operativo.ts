import type { Operatore } from "@/data/operators";

export const BANCALE_STATI_OPERATIVI = [
  "a_riposo",
  "in_prelievo",
  "in_postazione",
] as const;

export type BancaleStatoOperativo = (typeof BANCALE_STATI_OPERATIVI)[number];

export const BANCALE_STATO_LABELS: Record<BancaleStatoOperativo, string> = {
  a_riposo: "A riposo",
  in_prelievo: "In prelievo",
  in_postazione: "In postazione operatore",
};

export const BANCALE_STATO_COLORS: Record<BancaleStatoOperativo, string> = {
  a_riposo: "bg-bg-hover text-text-muted border-border-default",
  in_prelievo: "bg-status-giallo/15 text-status-giallo border-status-giallo/30",
  in_postazione:
    "bg-status-arancione/15 text-status-arancione border-status-arancione/30",
};

export function normalizeBancaleStatoOperativo(
  value: string | null | undefined,
): BancaleStatoOperativo {
  if (value === "in_prelievo" || value === "in_postazione") return value;
  return "a_riposo";
}

export function isBancaleStatoAttivo(stato: BancaleStatoOperativo): boolean {
  return stato !== "a_riposo";
}

export type BancaleStatoMeta = {
  stato: BancaleStatoOperativo;
  at?: string;
  da?: Operatore;
};
