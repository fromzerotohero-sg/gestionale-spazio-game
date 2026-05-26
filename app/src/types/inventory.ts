import type { Category, Sede } from '@/data/inventory';
import type { Operatore } from '@/data/operators';

export interface UnifiedItem {
  id: string;
  nome: string;
  categoria: Category;
  quantita: number;
  prezzoUnitario: number;
  totale: number;
  note: string;
  sede: string;
  tipo?: string;
  modello?: string;
  marca?: string;
  scaffale?: number;
  ripiano?: number;
  bancale?: string;
  grado?: string;
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
  sede: Sede | string;
  tipo?: string;
  modello?: string;
  marca?: string;
  scaffale?: number;
  ripiano?: number;
  bancale?: string;
  grado?: string;
};
