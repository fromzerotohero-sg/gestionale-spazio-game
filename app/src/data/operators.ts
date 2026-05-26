export const OPERATORS = ['Giangrossi', 'Irene', 'Matteo', 'Paolo'] as const;

export type Operatore = (typeof OPERATORS)[number];

const STORAGE_KEY = 'gestionale-operatore';

export function getStoredOperatore(): Operatore | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(STORAGE_KEY);
  return OPERATORS.includes(value as Operatore) ? (value as Operatore) : null;
}

export function setStoredOperatore(operatore: Operatore): void {
  localStorage.setItem(STORAGE_KEY, operatore);
}
