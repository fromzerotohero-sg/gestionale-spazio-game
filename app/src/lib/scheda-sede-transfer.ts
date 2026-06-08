import type { Sede } from "@/data/inventory";
import type { Operatore } from "@/data/operators";
import {
  createInventoryItem,
  nextInventoryId,
  updateInventoryItem,
} from "@/lib/inventory-api";
import type { UnifiedItem } from "@/types/inventory";

export function findSchedaAtSede(
  items: UnifiedItem[],
  nome: string,
  sede: Sede,
): UnifiedItem | undefined {
  const key = nome.trim().toLowerCase();
  return items.find(
    (i) =>
      i.categoria === "schede" &&
      i.sede === sede &&
      i.nome.trim().toLowerCase() === key,
  );
}

export type TransferSchedaResult = {
  source: UnifiedItem | null;
  destination: UnifiedItem;
  merged: boolean;
};

export async function transferSchedaPartial(
  allItems: UnifiedItem[],
  source: UnifiedItem,
  qty: number,
  destSede: Sede,
  operatore: Operatore,
  note?: string,
): Promise<TransferSchedaResult> {
  if (source.categoria !== "schede") {
    throw new Error("Il trasferimento parziale è disponibile solo per le schede");
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Inserisci una quantità valida");
  }
  if (qty > source.quantita) {
    throw new Error(
      `Quantità superiore alla giacenza: massimo ${source.quantita}`,
    );
  }
  if (source.sede === destSede) {
    throw new Error("La sede di destinazione deve essere diversa da quella attuale");
  }

  const activityNote =
    note?.trim() ||
    `Trasferimento ${qty} pz: ${source.sede} → ${destSede}`;

  const destMatch = findSchedaAtSede(allItems, source.nome, destSede);
  const sourceAfter = source.quantita - qty;

  let destination: UnifiedItem;
  let merged = false;

  if (destMatch) {
    merged = true;
    destination = await updateInventoryItem(
      destMatch.id,
      { quantita: destMatch.quantita + qty },
      {
        operatore,
        previous: destMatch,
        activityNote,
      },
    );
  } else {
    const newId = nextInventoryId(allItems, "schede");
    destination = await createInventoryItem(
      {
        id: newId,
        categoria: "schede",
        nome: source.nome,
        quantita: qty,
        prezzoUnitario: source.prezzoUnitario,
        fornitore: source.fornitore ?? null,
        note: source.note ?? "",
        sede: destSede,
      },
      { operatore },
    );
  }

  let sourceResult: UnifiedItem | null;
  if (sourceAfter === 0) {
    await updateInventoryItem(
      source.id,
      { quantita: 0 },
      {
        operatore,
        previous: source,
        activityNote,
      },
    );
    sourceResult = null;
  } else {
    sourceResult = await updateInventoryItem(
      source.id,
      { quantita: sourceAfter },
      {
        operatore,
        previous: source,
        activityNote,
      },
    );
  }

  return { source: sourceResult, destination, merged };
}
