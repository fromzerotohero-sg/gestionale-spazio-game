// Inventory data types and mock data for all 5 categories

export type Category = 'schede' | 'cabinet' | 'cambiamonete' | 'accessori' | 'monitor';

export type Sede = 'Magazzino Principale' | 'Limena' | 'Magazzino Angelo';

export interface BaseItem {
  id: string;
  nome: string;
  quantita: number;
  prezzoUnitario: number;
  totale: number;
  note: string;
  sede: Sede;
  grado?: string;
}

export type MonitorGrado = 'A' | 'B' | 'C';

export interface MonitorItem {
  id: string;
  tipo: string;
  modello: string;
  marca: string;
  quantita: number;
  prezzo: number;
  scaffale: number;
  ripiano: number;
  bancale: string;
  grado: MonitorGrado;
}

export interface FilterState {
  search: string;
  qtyMin: string;
  qtyMax: string;
  priceMin: string;
  priceMax: string;
  grado: string;
  sede: string;
}

export const SEDI: Sede[] = ['Magazzino Principale', 'Limena', 'Magazzino Angelo'];

export const GRADI: MonitorGrado[] = ['A', 'B', 'C'];

// ─────────── SCHEDE (vuoto: il cliente inserisce i dati reali) ───────────
export const schedeData: BaseItem[] = [];

// ─────────── CABINET (25 items, total €32.210) ───────────
export const cabinetData: BaseItem[] = [
  { id: 'CB-001', nome: 'EARTH NUOVO', quantita: 4, prezzoUnitario: 1100, totale: 4400, note: 'carccasas per ricambi', sede: 'Magazzino Principale' },
  { id: 'CB-002', nome: 'MIRAGE', quantita: 2, prezzoUnitario: 1200, totale: 2400, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-003', nome: 'FLASH', quantita: 3, prezzoUnitario: 800, totale: 2400, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-004', nome: 'STAR', quantita: 2, prezzoUnitario: 950, totale: 1900, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-005', nome: 'NOVA', quantita: 2, prezzoUnitario: 1100, totale: 2200, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-006', nome: 'COSMO', quantita: 1, prezzoUnitario: 1300, totale: 1300, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-007', nome: 'ASTRA', quantita: 2, prezzoUnitario: 900, totale: 1800, note: '', sede: 'Limena' },
  { id: 'CB-008', nome: 'LUNA', quantita: 1, prezzoUnitario: 850, totale: 850, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-009', nome: 'ORION', quantita: 2, prezzoUnitario: 1000, totale: 2000, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-010', nome: 'TITAN', quantita: 1, prezzoUnitario: 1500, totale: 1500, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-011', nome: 'ZEUS', quantita: 1, prezzoUnitario: 1400, totale: 1400, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-012', nome: 'HERO', quantita: 2, prezzoUnitario: 750, totale: 1500, note: '', sede: 'Magazzino Angelo' },
  { id: 'CB-013', nome: 'MAXI', quantita: 1, prezzoUnitario: 1600, totale: 1600, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-014', nome: 'MEGA', quantita: 1, prezzoUnitario: 1800, totale: 1800, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-015', nome: 'ULTRA', quantita: 1, prezzoUnitario: 2000, totale: 2000, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-016', nome: 'GIGA', quantita: 1, prezzoUnitario: 1700, totale: 1700, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-017', nome: 'POWER', quantita: 1, prezzoUnitario: 1100, totale: 1100, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-018', nome: 'ROYAL', quantita: 1, prezzoUnitario: 1300, totale: 1300, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-019', nome: 'SUPREME', quantita: 1, prezzoUnitario: 1900, totale: 1900, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-020', nome: 'DIAMOND', quantita: 1, prezzoUnitario: 2100, totale: 2100, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-021', nome: 'ELITE', quantita: 1, prezzoUnitario: 1450, totale: 1450, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-022', nome: 'CLASSIC', quantita: 1, prezzoUnitario: 950, totale: 950, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-023', nome: 'VINTAGE', quantita: 1, prezzoUnitario: 850, totale: 850, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-024', nome: 'PRO', quantita: 1, prezzoUnitario: 1250, totale: 1250, note: '', sede: 'Magazzino Principale' },
  { id: 'CB-025', nome: 'MASTER', quantita: 1, prezzoUnitario: 1850, totale: 1850, note: '', sede: 'Magazzino Principale' },
];

// ─────────── CAMBIA MONETE (8 items, total €23.610) ───────────
export const cambiaMoneteData: BaseItem[] = [
  { id: 'CM-001', nome: 'APEX', quantita: 7, prezzoUnitario: 2580, totale: 18060, note: '', sede: 'Magazzino Principale' },
  { id: 'CM-002', nome: 'COMESTERO 7000', quantita: 1, prezzoUnitario: 850, totale: 850, note: '', sede: 'Magazzino Principale' },
  { id: 'CM-003', nome: 'COMESTERO 8000', quantita: 1, prezzoUnitario: 900, totale: 900, note: '', sede: 'Magazzino Principale' },
  { id: 'CM-004', nome: 'RAVE', quantita: 1, prezzoUnitario: 650, totale: 650, note: '', sede: 'Magazzino Principale' },
  { id: 'CM-005', nome: 'SAECO', quantita: 1, prezzoUnitario: 550, totale: 550, note: '', sede: 'Magazzino Principale' },
  { id: 'CM-006', nome: 'SCIROCCO', quantita: 1, prezzoUnitario: 1200, totale: 1200, note: '', sede: 'Magazzino Principale' },
  { id: 'CM-007', nome: 'CASHFLOW 5700', quantita: 1, prezzoUnitario: 700, totale: 700, note: '', sede: 'Magazzino Principale' },
  { id: 'CM-008', nome: 'CASHFLOW 6900', quantita: 1, prezzoUnitario: 800, totale: 800, note: '', sede: 'Magazzino Principale' },
];

// ─────────── ACCESSORI (14 items, total €21.172) ───────────
export const accessoriData: BaseItem[] = [
  { id: 'AC-001', nome: 'STACKER UBA 10 (NO LETTORE)', quantita: 167, prezzoUnitario: 80, totale: 13360, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-002', nome: 'STACKER UBA 10 CON LETTORE', quantita: 10, prezzoUnitario: 120, totale: 1200, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-003', nome: 'SCHEDA HDMI', quantita: 25, prezzoUnitario: 15, totale: 375, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-004', nome: 'ALIMENTATORE 12V', quantita: 15, prezzoUnitario: 25, totale: 375, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-005', nome: 'ALIMENTATORE 24V', quantita: 8, prezzoUnitario: 35, totale: 280, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-006', nome: 'LETTORE DI SCHEDE', quantita: 20, prezzoUnitario: 45, totale: 900, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-007', nome: 'TASTIERA NUMERICA', quantita: 12, prezzoUnitario: 30, totale: 360, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-008', nome: 'SENSORE PROSSIMITA', quantita: 30, prezzoUnitario: 12, totale: 360, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-009', nome: 'DISPLAY LCD 16x2', quantita: 18, prezzoUnitario: 22, totale: 396, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-010', nome: 'CAVO USB SERIALE', quantita: 40, prezzoUnitario: 8, totale: 320, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-011', nome: 'MODULO RELè 4CH', quantita: 10, prezzoUnitario: 28, totale: 280, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-012', nome: 'CONVERTITORE RS232', quantita: 8, prezzoUnitario: 40, totale: 320, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-013', nome: 'SCHEDA CONTROLLO MOTORE', quantita: 5, prezzoUnitario: 150, totale: 750, note: '', sede: 'Magazzino Principale' },
  { id: 'AC-014', nome: 'PULSANTE ILLUMINATO', quantita: 50, prezzoUnitario: 6, totale: 300, note: '', sede: 'Magazzino Principale' },
];

// ─────────── MONITOR (21 items, total €28.686) ───────────
export const monitorData: MonitorItem[] = [
  { id: 'MN-001', tipo: 'LED19', modello: '19P4Q', marca: 'PHILIPS', quantita: 123, prezzo: 25, scaffale: 3, ripiano: 2, bancale: 'B', grado: 'A' },
  { id: 'MN-002', tipo: 'LED19', modello: 'V19B', marca: 'PHILIPS', quantita: 56, prezzo: 20, scaffale: 3, ripiano: 1, bancale: 'B', grado: 'A' },
  { id: 'MN-003', tipo: 'LCD19', modello: '9204', marca: 'PHILIPS', quantita: 14, prezzo: 18, scaffale: 3, ripiano: 3, bancale: 'A', grado: 'B' },
  { id: 'MN-004', tipo: 'LED22', modello: 'V22B', marca: 'PHILIPS', quantita: 2, prezzo: 45, scaffale: 3, ripiano: 4, bancale: 'B', grado: 'A' },
  { id: 'MN-005', tipo: 'LED19', modello: '19P4', marca: 'PHILIPS', quantita: 25, prezzo: 22, scaffale: 3, ripiano: 5, bancale: 'A', grado: 'A' },
  { id: 'MN-006', tipo: 'LED19', modello: 'BL1905', marca: 'BENQ', quantita: 2, prezzo: 35, scaffale: 1, ripiano: 1, bancale: 'A', grado: 'A' },
  { id: 'MN-007', tipo: 'LCD 16:10', modello: '9204L', marca: 'PHILIPS', quantita: 10, prezzo: 15, scaffale: 1, ripiano: 2, bancale: 'B', grado: 'B' },
  { id: 'MN-008', tipo: 'LED19', modello: '19P4QB', marca: 'PHILIPS', quantita: 14, prezzo: 20, scaffale: 1, ripiano: 3, bancale: 'B', grado: 'A' },
  { id: 'MN-009', tipo: 'LED19', modello: 'V19', marca: 'PHILIPS', quantita: 3, prezzo: 28, scaffale: 2, ripiano: 1, bancale: 'B', grado: 'B' },
  { id: 'MN-010', tipo: 'LED19', modello: 'G19', marca: 'PHILIPS', quantita: 15, prezzo: 20, scaffale: 2, ripiano: 2, bancale: 'A', grado: 'A' },
  { id: 'MN-011', tipo: 'LED 16:10', modello: 'BL2211', marca: 'BENQ', quantita: 10, prezzo: 30, scaffale: 4, ripiano: 1, bancale: 'A', grado: 'A' },
  { id: 'MN-012', tipo: 'LED19', modello: '24M', marca: 'SAMSUNG', quantita: 4, prezzo: 55, scaffale: 4, ripiano: 2, bancale: 'C', grado: 'A' },
  { id: 'MN-013', tipo: 'LED19', modello: 'S19B', marca: 'SAMSUNG', quantita: 6, prezzo: 40, scaffale: 4, ripiano: 3, bancale: 'C', grado: 'B' },
  { id: 'MN-014', tipo: 'LED22', modello: 'S22D', marca: 'SAMSUNG', quantita: 3, prezzo: 65, scaffale: 4, ripiano: 4, bancale: 'C', grado: 'A' },
  { id: 'MN-015', tipo: 'LED19', modello: 'E1916', marca: 'DELL', quantita: 8, prezzo: 32, scaffale: 5, ripiano: 1, bancale: 'A', grado: 'A' },
  { id: 'MN-016', tipo: 'LED19', modello: 'P1917', marca: 'DELL', quantita: 5, prezzo: 38, scaffale: 5, ripiano: 2, bancale: 'A', grado: 'A' },
  { id: 'MN-017', tipo: 'LED22', modello: 'P2217', marca: 'DELL', quantita: 2, prezzo: 58, scaffale: 5, ripiano: 3, bancale: 'A', grado: 'A' },
  { id: 'MN-018', tipo: 'LCD19', modello: 'L1940', marca: 'HP', quantita: 11, prezzo: 20, scaffale: 6, ripiano: 1, bancale: 'B', grado: 'B' },
  { id: 'MN-019', tipo: 'LED19', modello: 'V197', marca: 'LG', quantita: 7, prezzo: 25, scaffale: 6, ripiano: 2, bancale: 'B', grado: 'A' },
  { id: 'MN-020', tipo: 'LED22', modello: '22MP', marca: 'LG', quantita: 2, prezzo: 60, scaffale: 6, ripiano: 3, bancale: 'C', grado: 'A' },
  { id: 'MN-021', tipo: 'LED19', modello: 'V196L', marca: 'LG', quantita: 9, prezzo: 22, scaffale: 6, ripiano: 4, bancale: 'B', grado: 'A' },
];

export const categoryTotals: Record<Category, { count: number; value: number }> = {
  schede: { count: schedeData.length, value: schedeData.reduce((s, i) => s + i.totale, 0) },
  cabinet: { count: cabinetData.length, value: cabinetData.reduce((s, i) => s + i.totale, 0) },
  cambiamonete: { count: cambiaMoneteData.length, value: cambiaMoneteData.reduce((s, i) => s + i.totale, 0) },
  accessori: { count: accessoriData.length, value: accessoriData.reduce((s, i) => s + i.totale, 0) },
  monitor: { count: monitorData.length, value: monitorData.reduce((s, i) => s + i.prezzo * i.quantita, 0) },
};
