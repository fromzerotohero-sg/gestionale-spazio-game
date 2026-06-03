import type { Operatore } from "@/data/operators";

export type SchedaPrenotazione = {
  id: string;
  numeroScheda: string;
  cliente: string;
  operatore?: Operatore;
  createdAt: string;
};
