import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  schedeData,
  cabinetData,
  cambiaMoneteData,
  accessoriData,
  monitorData,
} from '../app/src/data/inventory.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

function esc(s) {
  return String(s).replace(/'/g, "''");
}

const rows = [];
for (const i of schedeData)
  rows.push({ id: i.id, cat: 'schede', nome: i.nome, q: i.quantita, p: i.prezzoUnitario, note: i.note, sede: i.sede });
for (const i of cabinetData)
  rows.push({ id: i.id, cat: 'cabinet', nome: i.nome, q: i.quantita, p: i.prezzoUnitario, note: i.note, sede: i.sede });
for (const i of cambiaMoneteData)
  rows.push({ id: i.id, cat: 'cambiamonete', nome: i.nome, q: i.quantita, p: i.prezzoUnitario, note: i.note, sede: i.sede });
for (const i of accessoriData)
  rows.push({ id: i.id, cat: 'accessori', nome: i.nome, q: i.quantita, p: i.prezzoUnitario, note: i.note, sede: i.sede });
for (const i of monitorData)
  rows.push({
    id: i.id,
    cat: 'monitor',
    nome: `${i.marca} ${i.modello}`,
    q: i.quantita,
    p: i.prezzo,
    note: '',
    sede: 'Magazzino Principale',
    tipo: i.tipo,
    modello: i.modello,
    marca: i.marca,
    scaffale: i.scaffale,
    ripiano: i.ripiano,
    bancale: i.bancale,
    grado: i.grado,
  });

const vals = rows.map((r) => {
  const mon =
    r.cat === 'monitor'
      ? `, '${esc(r.tipo)}', '${esc(r.modello)}', '${esc(r.marca)}', ${r.scaffale}, ${r.ripiano}, '${esc(r.bancale)}', '${r.grado}'`
      : ', NULL, NULL, NULL, NULL, NULL, NULL, NULL';
  return `('${esc(r.id)}', '${r.cat}', '${esc(r.nome)}', ${r.q}, ${r.p}, '${esc(r.note)}', '${esc(r.sede)}'${mon})`;
});

const sql =
  'INSERT INTO public.inventory_items (id, category, nome, quantita, prezzo_unitario, note, sede, tipo, modello, marca, scaffale, ripiano, bancale, grado) VALUES\n' +
  vals.join(',\n') +
  ' ON CONFLICT (id) DO NOTHING;';

writeFileSync(join(__dirname, '../supabase/seed_inventory.sql'), sql);
console.log(`Generated ${rows.length} rows`);
