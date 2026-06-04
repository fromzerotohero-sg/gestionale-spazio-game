import type { Category, Sede } from "@/data/inventory";
import type { Operatore } from "@/data/operators";
import type { BancaleStatoOperativo } from "@/lib/bancale-stato-operativo";
import type { InventoryAction } from "@/lib/inventory-tracking";

export interface UnifiedItem {
  id: string;
  nome: string;
  categoria: Category;
  quantita: number;
  prezzoUnitario: number;
  totale: number;
  note: string;
  fornitore?: string;
  sede: string;
  tipo?: string;
  modello?: string;
  marca?: string;
  scaffale?: number;
  ripiano?: number;
  bancale?: string;
  grado?: string;
  bancaleVerificato?: boolean;
  bancaleVerificatoAt?: string;
  bancaleVerificatoDa?: Operatore;
  bancaleStatoOperativo?: BancaleStatoOperativo;
  bancaleStatoOperativoAt?: string;
  bancaleStatoOperativoDa?: Operatore;
  schedaDocInviataAt?: string;
  nullaostaRicevutoAt?: string;
  nullaostaPrezzoIncrementato?: boolean;
  updatedAt?: string;
  lastModifiedBy?: Operatore;
}

export type InventoryRowInput = {
  id: string;
  categoria: Category;
  nome: string;
  quantita: number;
  prezzoUnitario: number;
  note: string;
  fornitore?: string | null;
  sede: Sede | string;
  tipo?: string;
  modello?: string;
  marca?: string;
  scaffale?: number;
  ripiano?: number;
  bancale?: string;
  grado?: string;
  bancaleVerificato?: boolean;
  bancaleStatoOperativo?: BancaleStatoOperativo;
  schedaDocInviataAt?: string | null;
  nullaostaRicevutoAt?: string | null;
  nullaostaPrezzoIncrementato?: boolean;
};

export type InventoryActivityEntry = {
  id: string;
  itemId: string;
  operatore: Operatore;
  action: InventoryAction;
  quantityBefore: number | null;
  quantityAfter: number | null;
  summary: string;
  note?: string | null;
  createdAt: string;
};
