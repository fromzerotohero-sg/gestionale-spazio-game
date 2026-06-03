import { format } from "date-fns";
import { it } from "date-fns/locale";

export const NULLAOSTA_PREZZO_INCREMENTO = 100;

export function parseDateOnly(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function toDateIso(date: Date | undefined): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T12:00:00.000Z`;
}

export function formatSchedaDate(iso: string | undefined): string {
  const d = parseDateOnly(iso);
  if (!d) return "";
  return format(d, "d MMM yyyy", { locale: it });
}

export type SchedaNullaostaLabel =
  | { kind: "none"; text: "—" }
  | { kind: "doc"; text: string }
  | { kind: "nullaosta"; text: string };

export function schedaNullaostaLabel(item: {
  schedaDocInviataAt?: string;
  nullaostaRicevutoAt?: string;
}): SchedaNullaostaLabel {
  if (item.nullaostaRicevutoAt) {
    return {
      kind: "nullaosta",
      text: `Nullaosta ${formatSchedaDate(item.nullaostaRicevutoAt)}`,
    };
  }
  if (item.schedaDocInviataAt) {
    return {
      kind: "doc",
      text: `Doc. inviata ${formatSchedaDate(item.schedaDocInviataAt)}`,
    };
  }
  return { kind: "none", text: "—" };
}
