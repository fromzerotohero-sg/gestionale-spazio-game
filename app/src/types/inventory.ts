import type { Category, Sede } from "@/data/inventory";
import type { Operatore } from "@/data/operators";
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
  schedaDocInviataAt?: string;
  nullaostaRicevutoAt?: string;
  nullaostaPrezzoIncrementato?: boolean;
  nullaostaSegretariaOk?: boolean;
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
  schedaDocInviataAt?: string | null;
  nullaostaRicevutoAt?: string | null;
  nullaostaPrezzoIncrementato?: boolean;
  nullaostaSegretariaOk?: boolean;
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
