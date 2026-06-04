export const BANCALE_STATI_OPERATIVI = ["da_sbancalare", "a_terra"] as const;

export type BancaleStatoOperativo = (typeof BANCALE_STATI_OPERATIVI)[number];

export const BANCALE_STATO_SELECT_EMPTY = "";

export const BANCALE_STATO_LABELS: Record<BancaleStatoOperativo, string> = {
  da_sbancalare: "Da sbancalare",
  a_terra: "A terra",
};

export const BANCALE_STATO_COLORS: Record<BancaleStatoOperativo, string> = {
  da_sbancalare:
    "bg-status-giallo/15 text-status-giallo border-status-giallo/30",
  a_terra:
    "bg-status-arancione/15 text-status-arancione border-status-arancione/30",
};

const LEGACY_MAP: Record<string, BancaleStatoOperativo | null> = {
  a_riposo: null,
  in_prelievo: "da_sbancalare",
  in_postazione: "a_terra",
  da_sbancalare: "da_sbancalare",
  a_terra: "a_terra",
};

export function normalizeBancaleStatoOperativo(
  value: string | null | undefined,
): BancaleStatoOperativo | null {
  if (!value) return null;
  const mapped = LEGACY_MAP[value];
  if (mapped !== undefined) return mapped;
  if (value === "da_sbancalare" || value === "a_terra") return value;
  return null;
}

export function bancaleStatoToSelectValue(
  stato: BancaleStatoOperativo | null | undefined,
): string {
  return stato ?? BANCALE_STATO_SELECT_EMPTY;
}

export function selectValueToBancaleStato(
  value: string,
): BancaleStatoOperativo | null {
  if (value === BANCALE_STATO_SELECT_EMPTY) return null;
  return normalizeBancaleStatoOperativo(value);
}

export function isBancaleFuoriUbicazione(
  stato: BancaleStatoOperativo | null | undefined,
): boolean {
  return stato === "da_sbancalare" || stato === "a_terra";
}

export function formatBancaleStatoDisplay(
  stato: BancaleStatoOperativo | null | undefined,
  nota?: string | null,
): string {
  const parts: string[] = [];
  if (stato) parts.push(BANCALE_STATO_LABELS[stato]);
  const n = nota?.trim();
  if (n) parts.push(n);
  return parts.length ? parts.join(" · ") : "—";
}
