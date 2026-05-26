import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  X,
  User,
  Calendar,
  Tag,
  Euro,
  MoreHorizontal,
  Clock,
  Filter,
  Wrench,
  StickyNote,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';

/* ──────────────────────────── TYPES ──────────────────────────── */

type Status = 'da_assegnare' | 'in_attesa' | 'in_corso' | 'completata';
type Priority = 'urgente' | 'alta' | 'normale' | 'bassa';
type Category = 'Cabinet' | 'Schede' | 'Cambia Monete' | 'Accessori' | 'Monitor';

interface RepairPart {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

interface TimelineEntry {
  id: string;
  from: Status | '';
  to: Status;
  timestamp: string;
  user: string;
}

interface Repair {
  id: string;
  code: string;
  device: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  technician: string;
  dateOpened: string;
  dateExpected?: string;
  dateCompleted?: string;
  estimatedCost: number;
  finalCost?: number;
  notes: string;
  parts: RepairPart[];
  timeline: TimelineEntry[];
}

/* ────────────────────────── CONSTANTS ────────────────────────── */

const STATUS_CONFIG: Record<Status, { label: string; color: string; dot: string }> = {
  da_assegnare: { label: 'Da Assegnare', color: '#525252', dot: '#525252' },
  in_attesa:    { label: 'In Attesa',    color: '#EAB308', dot: '#EAB308' },
  in_corso:     { label: 'In Corso',     color: '#3B82F6', dot: '#3B82F6' },
  completata:   { label: 'Completate',   color: '#22C55E', dot: '#22C55E' },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  urgente: { label: 'Urgente', color: '#EF4444', bg: '#EF444420', border: '#EF444430' },
  alta:    { label: 'Alta',    color: '#F97316', bg: '#F9731620', border: '#F9731630' },
  normale: { label: 'Normale', color: '#3B82F6', bg: '#3B82F620', border: '#3B82F630' },
  bassa:   { label: 'Bassa',   color: '#525252', bg: '#52525220', border: '#52525230' },
};

const CATEGORIES: Category[] = ['Cabinet', 'Schede', 'Cambia Monete', 'Accessori', 'Monitor'];
const TECHNICIANS = ['Marco R.', 'Luca B.', 'Paolo M.', 'Giovanni F.', 'Andrea S.'];

const COLUMNS: Status[] = ['da_assegnare', 'in_attesa', 'in_corso', 'completata'];

const easeSmooth = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ─────────────────────── SAMPLE DATA ─────────────────────── */

const INITIAL_REPAIRS: Repair[] = [
  {
    id: '1', code: 'RP-2025-0048', device: 'FLASH cabinet #2',
    description: 'Sostituzione monitor interno — schermo non si accende, necessario smontaggio pannello posteriore.', category: 'Cabinet',
    priority: 'normale', status: 'da_assegnare', technician: '',
    dateOpened: '2025-01-18', dateExpected: '2025-01-25', estimatedCost: 150,
    notes: 'Monitor in attesa da inventario.', parts: [{ id: 'p1', name: 'Monitor LCD 22"', quantity: 1, unitCost: 120 }],
    timeline: [{ id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-18T09:00:00', user: 'System' }],
  },
  {
    id: '2', code: 'RP-2025-0047', device: 'APEX cambiamonete #1',
    description: 'Errore lettore banconote — non riconosce banconote da 20€ e 50€, codice errore E-42.', category: 'Cambia Monete',
    priority: 'alta', status: 'da_assegnare', technician: '',
    dateOpened: '2025-01-17', dateExpected: '2025-01-22', estimatedCost: 500,
    notes: 'Contattare fornitore lettore.', parts: [{ id: 'p2', name: 'Lettore banconote JCM', quantity: 1, unitCost: 450 }],
    timeline: [{ id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-17T14:30:00', user: 'System' }],
  },
  {
    id: '3', code: 'RP-2025-0045', device: 'CLASSIC 19" cabinet',
    description: 'Manutenzione ordinaria — pulizia filtri aria, controllo connessioni, sostituzione lampade.', category: 'Cabinet',
    priority: 'bassa', status: 'da_assegnare', technician: '',
    dateOpened: '2025-01-15', dateExpected: '2025-02-01', estimatedCost: 50,
    notes: '', parts: [],
    timeline: [{ id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-15T10:00:00', user: 'System' }],
  },
  {
    id: '4', code: 'RP-2025-0044', device: 'CAB-001 EARTH cabinet',
    description: 'Schermo non si accende — probabile guasto alimentatore interno, nessun LED di stato.', category: 'Cabinet',
    priority: 'alta', status: 'da_assegnare', technician: '',
    dateOpened: '2025-01-14', dateExpected: '2025-01-21', estimatedCost: 300,
    notes: 'Verificare alimentatore 24V.', parts: [{ id: 'p3', name: 'Alimentatore 24V 300W', quantity: 1, unitCost: 180 }],
    timeline: [{ id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-14T11:15:00', user: 'System' }],
  },
  {
    id: '5', code: 'RP-2025-0042', device: 'CAM-003 APEX cambiamonete',
    description: 'Non eroga monete — hopper 2 bloccato, errore meccanico sul separatore.', category: 'Cambia Monete',
    priority: 'urgente', status: 'da_assegnare', technician: '',
    dateOpened: '2025-01-12', dateExpected: '2025-01-15', estimatedCost: 650,
    notes: 'Cliente lamenta disservizio.', parts: [{ id: 'p4', name: 'Hopper monete', quantity: 1, unitCost: 520 }],
    timeline: [{ id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-12T08:45:00', user: 'System' }],
  },
  {
    id: '6', code: 'RP-2025-0043', device: 'EARTH NUOVO #1',
    description: 'Guasto scheda madre — non effettua il boot, bip continuo all\'accensione.', category: 'Cabinet',
    priority: 'alta', status: 'in_attesa', technician: 'Luca B.',
    dateOpened: '2025-01-14', dateExpected: '2025-01-24', estimatedCost: 1100,
    notes: 'In attesa scheda madre dal fornitore.', parts: [{ id: 'p5', name: 'Scheda madre ASUS H610', quantity: 1, unitCost: 950 }],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-14T09:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_attesa', timestamp: '2025-01-15T10:30:00', user: 'Admin' },
    ],
  },
  {
    id: '7', code: 'RP-2025-0041', device: 'NEXUS cambiamonete',
    description: 'Calibrazione sensori — lettore troppo lento nell\'accettazione, necessaria ricalibrazione.', category: 'Cambia Monete',
    priority: 'normale', status: 'in_attesa', technician: 'Marco R.',
    dateOpened: '2025-01-12', dateExpected: '2025-01-18', estimatedCost: 100,
    notes: '', parts: [],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-12T11:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_attesa', timestamp: '2025-01-13T14:00:00', user: 'Admin' },
    ],
  },
  {
    id: '8', code: 'RP-2025-0040', device: 'ELEKTRA cabinet #7',
    description: 'Surriscaldamento unita — ventola CPU rumorosa, temperature oltre 85°C in carico.', category: 'Cabinet',
    priority: 'urgente', status: 'in_attesa', technician: 'Paolo M.',
    dateOpened: '2025-01-11', dateExpected: '2025-01-16', estimatedCost: 275,
    notes: 'Non lasciare accesa fino a intervento.', parts: [{ id: 'p6', name: 'Dissipatore CPU + ventola', quantity: 1, unitCost: 85 }, { id: 'p7', name: 'Pasta termica', quantity: 1, unitCost: 15 }],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-11T08:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_attesa', timestamp: '2025-01-12T09:30:00', user: 'Admin' },
    ],
  },
  {
    id: '9', code: 'RP-2025-0039', device: 'MANHATTAN scheda',
    description: 'Aggiornamento firmware — versione obsoleta, necessario flash da seriale JTAG.', category: 'Schede',
    priority: 'normale', status: 'in_corso', technician: 'Luca B.',
    dateOpened: '2025-01-10', dateExpected: '2025-01-17', estimatedCost: 570,
    notes: 'Backup configurazione prima di procedere.', parts: [{ id: 'p8', name: 'Adattatore JTAG USB', quantity: 1, unitCost: 45 }],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-10T10:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_attesa', timestamp: '2025-01-11T09:00:00', user: 'Admin' },
      { id: 't3', from: 'in_attesa', to: 'in_corso', timestamp: '2025-01-13T08:30:00', user: 'Luca B.' },
    ],
  },
  {
    id: '10', code: 'RP-2025-0038', device: 'LUCKY CASH cabinet #2',
    description: 'Sostituzione gettoniera — meccanismo inceppato, non rilascia gettoni vincita.', category: 'Cabinet',
    priority: 'alta', status: 'in_corso', technician: 'Marco R.',
    dateOpened: '2025-01-09', dateExpected: '2025-01-16', estimatedCost: 400,
    notes: 'Gettoniera in arrivo domani.', parts: [{ id: 'p9', name: 'Gettoniera Hopper MK-IV', quantity: 1, unitCost: 320 }],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-09T11:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_attesa', timestamp: '2025-01-10T14:00:00', user: 'Admin' },
      { id: 't3', from: 'in_attesa', to: 'in_corso', timestamp: '2025-01-12T09:00:00', user: 'Marco R.' },
    ],
  },
  {
    id: '11', code: 'RP-2025-0036', device: 'MASTER 5 scheda #5',
    description: 'Diagnostica completa — scheda si riavvia in modo anomalo durante le partite.', category: 'Schede',
    priority: 'normale', status: 'in_corso', technician: 'Paolo M.',
    dateOpened: '2025-01-07', dateExpected: '2025-01-20', estimatedCost: 350,
    notes: 'Verificare condensatori elettrolitici.', parts: [{ id: 'p10', name: 'Kit condensatori', quantity: 1, unitCost: 25 }],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-07T09:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_attesa', timestamp: '2025-01-08T10:00:00', user: 'Admin' },
      { id: 't3', from: 'in_attesa', to: 'in_corso', timestamp: '2025-01-10T08:00:00', user: 'Paolo M.' },
    ],
  },
  {
    id: '12', code: 'RP-2025-0037', device: 'MON-005 Monitor DELL P1917S',
    description: 'Pixel bruciati — linea verticale di pixel morti al centro schermo, fuori garanzia.', category: 'Monitor',
    priority: 'normale', status: 'in_corso', technician: 'Giovanni F.',
    dateOpened: '2025-01-08', dateExpected: '2025-01-14', estimatedCost: 200,
    notes: 'Valutare sostituzione pannello vs nuovo monitor.', parts: [{ id: 'p11', name: 'Pannello LCD 19"', quantity: 1, unitCost: 140 }],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-08T13:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_corso', timestamp: '2025-01-09T09:00:00', user: 'Giovanni F.' },
    ],
  },
  {
    id: '13', code: 'RP-2025-0035', device: 'SIRA cabinet',
    description: 'Sostituzione vetro — vetro touch anteriore rotto per urto accidentale.', category: 'Cabinet',
    priority: 'normale', status: 'completata', technician: 'Luca B.',
    dateOpened: '2025-01-05', dateCompleted: '2025-01-20', estimatedCost: 100, finalCost: 120,
    notes: '', parts: [{ id: 'p12', name: 'Vetro touch 19"', quantity: 1, unitCost: 80 }],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-05T09:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_corso', timestamp: '2025-01-06T08:00:00', user: 'Luca B.' },
      { id: 't3', from: 'in_corso', to: 'completata', timestamp: '2025-01-20T16:00:00', user: 'Luca B.' },
    ],
  },
  {
    id: '14', code: 'RP-2025-0034', device: 'GTA M3 cabinet',
    description: 'Riparazione scheda audio — nessun suono dalle casse, connettore jack ossidato.', category: 'Cabinet',
    priority: 'alta', status: 'completata', technician: 'Marco R.',
    dateOpened: '2025-01-04', dateCompleted: '2025-01-19', estimatedCost: 100, finalCost: 95,
    notes: '', parts: [{ id: 'p13', name: 'Scheda audio USB', quantity: 1, unitCost: 35 }],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-04T10:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_attesa', timestamp: '2025-01-05T09:00:00', user: 'Admin' },
      { id: 't3', from: 'in_attesa', to: 'in_corso', timestamp: '2025-01-08T08:00:00', user: 'Marco R.' },
      { id: 't4', from: 'in_corso', to: 'completata', timestamp: '2025-01-19T14:30:00', user: 'Marco R.' },
    ],
  },
  {
    id: '15', code: 'RP-2025-0033', device: 'LED22 FUJITSU',
    description: 'Sostituzione cavo HDMI — segnale instabile, artefatti sul display.', category: 'Monitor',
    priority: 'bassa', status: 'completata', technician: 'Andrea S.',
    dateOpened: '2025-01-03', dateCompleted: '2025-01-18', estimatedCost: 30, finalCost: 28,
    notes: '', parts: [{ id: 'p14', name: 'Cavo HDMI 2.0 2m', quantity: 1, unitCost: 12 }],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-03T11:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_corso', timestamp: '2025-01-06T09:00:00', user: 'Andrea S.' },
      { id: 't3', from: 'in_corso', to: 'completata', timestamp: '2025-01-18T10:00:00', user: 'Andrea S.' },
    ],
  },
  {
    id: '16', code: 'RP-2025-0049', device: 'ACC-004 LETTORI UBA 10',
    description: 'Lettore difettoso — non legge le tessere, errore comunicazione con host.', category: 'Accessori',
    priority: 'alta', status: 'completata', technician: 'Paolo M.',
    dateOpened: '2025-01-19', dateCompleted: '2025-01-21', estimatedCost: 250, finalCost: 250,
    notes: 'Ricollegato cavo dati, test OK.', parts: [],
    timeline: [
      { id: 't1', from: '', to: 'da_assegnare', timestamp: '2025-01-19T08:00:00', user: 'System' },
      { id: 't2', from: 'da_assegnare', to: 'in_corso', timestamp: '2025-01-20T09:00:00', user: 'Paolo M.' },
      { id: 't3', from: 'in_corso', to: 'completata', timestamp: '2025-01-21T15:00:00', user: 'Paolo M.' },
    ],
  },
];

/* ──────────────────── HELPER COMPONENTS ──────────────────── */

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded font-badge"
      style={{
        background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}05)`,
        border: `1px solid ${cfg.color}30`,
        color: cfg.color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className="inline-flex items-center h-[22px] px-2.5 rounded font-badge"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center h-[22px] px-2 rounded font-badge bg-bg-hover text-text-muted border border-border-default">
      {category}
    </span>
  );
}

/* ──────────────────── STAT CARD ──────────────────── */

function StatCard({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: easeSmooth }}
      className="bg-bg-elevated border border-border-subtle rounded-lg p-4 hover:border-border-hover transition-colors duration-200"
    >
      <p className="font-caption text-text-muted mb-1">{label}</p>
      <p className="font-data-md" style={{ color }}>{value}</p>
    </motion.div>
  );
}

/* ──────────────────── KANBAN CARD ──────────────────── */

function KanbanCard({
  repair,
  index,
  onClick,
  draggable,
  onDragStart,
  onDragEnd,
  isDragged,
  dimmed,
}: {
  repair: Repair;
  index: number;
  onClick: () => void;
  draggable: boolean;
  onDragStart: (e: React.DragEvent, repair: Repair) => void;
  onDragEnd: () => void;
  isDragged: boolean;
  dimmed: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: dimmed ? 0.2 : 1, y: 0, scale: isDragged ? 1.05 : 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: easeSmooth }}
      className={cn(
        isDragged && 'z-50',
      )}
    >
      <div
        draggable={draggable}
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => onDragStart(e, repair)}
        onDragEnd={onDragEnd}
        onClick={onClick}
        className={cn(
          'bg-bg-elevated border border-border-subtle rounded-lg p-4 cursor-grab active:cursor-grabbing',
          'hover:border-border-hover hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200',
          isDragged && 'rotate-[2deg] opacity-90 shadow-2xl cursor-grabbing',
        )}
        style={{ boxShadow: isDragged ? '0 8px 24px #00000060' : undefined }}
      >
        {/* Top row: priority + code */}
        <div className="flex items-center justify-between mb-2">
          <PriorityBadge priority={repair.priority} />
          <span className="font-caption text-text-muted">{repair.code}</span>
        </div>

        {/* Device name */}
        <h4 className="font-heading-3 text-text-primary truncate mb-1" title={repair.device}>
          {repair.device}
        </h4>

        {/* Description */}
        <p className="font-body-small text-text-secondary line-clamp-2 mb-3">
          {repair.description}
        </p>

        {/* Divider */}
        <div className="h-px bg-border-subtle my-2" />

        {/* Meta rows */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User size={12} className="text-text-muted flex-shrink-0" />
            <span className="font-caption text-text-muted">
              {repair.technician ? `Tecnico: ${repair.technician}` : 'Non assegnato'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-text-muted flex-shrink-0" />
            <span className="font-caption text-text-muted">
              {repair.status === 'completata' && repair.dateCompleted
                ? `Completato: ${format(new Date(repair.dateCompleted), 'dd/MM/yyyy')}`
                : `Aperto: ${format(new Date(repair.dateOpened), 'dd/MM/yyyy')}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tag size={12} className="text-text-muted flex-shrink-0" />
            <CategoryBadge category={repair.category} />
          </div>
        </div>

        {/* Cost */}
        {repair.estimatedCost > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border-subtle">
            <Euro size={12} className="text-accent-primary flex-shrink-0" />
            <span className="font-mono text-sm text-accent-primary">
              {formatCurrency(repair.status === 'completata' && repair.finalCost ? repair.finalCost : repair.estimatedCost)}
            </span>
          </div>
        )}

        {/* Spare parts indicator */}
        {repair.parts.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Package size={12} className="text-text-muted" />
            <span className="font-caption text-text-muted">{repair.parts.length} ricambio{repair.parts.length > 1 ? 'i' : ''}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────── LIST VIEW ──────────────────── */

function ListView({
  repairs,
  onRowClick,
}: {
  repairs: Repair[];
  onRowClick: (repair: Repair) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-bg-elevated border border-border-subtle rounded-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-bg-surface h-12 border-b border-border-subtle">
              <th className="text-left px-4 font-caption text-text-muted">ID</th>
              <th className="text-left px-4 font-caption text-text-muted">Oggetto</th>
              <th className="text-left px-4 font-caption text-text-muted">Stato</th>
              <th className="text-left px-4 font-caption text-text-muted">Priorità</th>
              <th className="text-left px-4 font-caption text-text-muted">Tecnico</th>
              <th className="text-left px-4 font-caption text-text-muted">Apertura</th>
              <th className="text-left px-4 font-caption text-text-muted">Chiusura</th>
              <th className="text-left px-4 font-caption text-text-muted">Costo</th>
              <th className="text-left px-4 font-caption text-text-muted">Ricambi</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {repairs.map((repair, i) => (
                <motion.tr
                  key={repair.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => onRowClick(repair)}
                  className="h-12 border-b border-bg-elevated hover:bg-bg-hover cursor-pointer transition-colors"
                >
                  <td className="px-4 font-mono text-xs text-text-secondary">{repair.code}</td>
                  <td className="px-4">
                    <div className="font-body text-text-primary font-medium truncate max-w-[280px]">{repair.device}</div>
                    <div className="font-body-small text-text-muted truncate max-w-[280px]">{repair.description}</div>
                  </td>
                  <td className="px-4"><StatusBadge status={repair.status} /></td>
                  <td className="px-4"><PriorityBadge priority={repair.priority} /></td>
                  <td className="px-4 font-body text-text-secondary">{repair.technician || '—'}</td>
                  <td className="px-4 font-mono text-xs text-text-secondary">
                    {format(new Date(repair.dateOpened), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 font-mono text-xs text-text-secondary">
                    {repair.dateCompleted ? format(new Date(repair.dateCompleted), 'dd/MM/yyyy') : '—'}
                  </td>
                  <td className="px-4 font-mono text-sm text-accent-primary">
                    {formatCurrency(repair.status === 'completata' && repair.finalCost ? repair.finalCost : repair.estimatedCost)}
                  </td>
                  <td className="px-4">
                    {repair.parts.length > 0 ? (
                      <span className="font-caption text-text-muted">{repair.parts.length}</span>
                    ) : (
                      <span className="font-caption text-text-muted">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {repairs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Wrench size={48} className="text-bg-hover mb-4" />
          <p className="font-body-small text-text-muted">Nessuna riparazione trovata</p>
        </div>
      )}
    </motion.div>
  );
}

/* ──────────────────── ADD/EDIT MODAL ──────────────────── */

function RepairModal({
  isOpen,
  onClose,
  onSave,
  repair,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (repair: Repair) => void;
  repair?: Repair | null;
}) {
  const [form, setForm] = useState<Partial<Repair>>({
    device: '', description: '', category: 'Cabinet', priority: 'normale',
    status: 'da_assegnare', technician: '', dateOpened: format(new Date(), 'yyyy-MM-dd'),
    dateExpected: '', estimatedCost: 0, notes: '',
    parts: [], timeline: [],
  });

  const isEditing = !!repair;

  // Reset form when opening
  const modalRef = useRef<HTMLDivElement>(null);

  if (isOpen && repair && form.id !== repair.id) {
    setForm({ ...repair });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.device || !form.description || !form.category || !form.priority || !form.status || !form.dateOpened) return;

    const newRepair: Repair = {
      id: isEditing && repair ? repair.id : Date.now().toString(),
      code: isEditing && repair ? repair.code : `RP-2025-${String(INITIAL_REPAIRS.length + 1).padStart(4, '0')}`,
      device: form.device,
      description: form.description,
      category: form.category as Category,
      priority: form.priority as Priority,
      status: form.status as Status,
      technician: form.technician || '',
      dateOpened: form.dateOpened,
      dateExpected: form.dateExpected,
      dateCompleted: form.status === 'completata' ? form.dateCompleted || format(new Date(), 'yyyy-MM-dd') : undefined,
      estimatedCost: Number(form.estimatedCost) || 0,
      finalCost: form.status === 'completata' ? Number(form.estimatedCost) || 0 : undefined,
      notes: form.notes || '',
      parts: form.parts || [],
      timeline: isEditing && repair ? repair.timeline : [{ id: `t${Date.now()}`, from: '', to: form.status as Status, timestamp: new Date().toISOString(), user: 'Admin' }],
    };
    onSave(newRepair);
    onClose();
    // Reset form
    setForm({
      device: '', description: '', category: 'Cabinet', priority: 'normale',
      status: 'da_assegnare', technician: '', dateOpened: format(new Date(), 'yyyy-MM-dd'),
      dateExpected: '', estimatedCost: 0, notes: '',
      parts: [], timeline: [],
    });
  };

  const updateField = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addPart = () => {
    setForm(prev => ({
      ...prev,
      parts: [...(prev.parts || []), { id: `p${Date.now()}`, name: '', quantity: 1, unitCost: 0 }],
    }));
  };

  const updatePart = (index: number, field: string, value: string | number) => {
    setForm(prev => ({
      ...prev,
      parts: (prev.parts || []).map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const removePart = (index: number) => {
    setForm(prev => ({
      ...prev,
      parts: (prev.parts || []).filter((_, i) => i !== index),
    }));
  };

  const showParts = form.status === 'in_corso' || form.status === 'completata';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: '#00000080', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: easeSmooth }}
            className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <h2 className="font-heading-2 text-text-primary">
                {isEditing ? `Modifica ${form.code || ''}` : 'Nuova Riparazione'}
              </h2>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Oggetto */}
              <div>
                <label className="block font-body-small text-text-secondary mb-1.5">Oggetto <span className="text-status-rosso">*</span></label>
                <input
                  type="text"
                  value={form.device || ''}
                  onChange={e => updateField('device', e.target.value)}
                  placeholder="Nome macchina o componente"
                  className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
                  required
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block font-body-small text-text-secondary mb-1.5">Descrizione Problema <span className="text-status-rosso">*</span></label>
                <textarea
                  value={form.description || ''}
                  onChange={e => updateField('description', e.target.value)}
                  rows={4}
                  placeholder="Descrivi il problema in dettaglio..."
                  className="w-full bg-bg-base border border-border-default rounded-md px-3 py-2 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors resize-none"
                  required
                />
              </div>

              {/* Categoria + Priorità */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body-small text-text-secondary mb-1.5">Categoria <span className="text-status-rosso">*</span></label>
                  <select
                    value={form.category || 'Cabinet'}
                    onChange={e => updateField('category', e.target.value)}
                    className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors appearance-none"
                    required
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-body-small text-text-secondary mb-1.5">Priorità <span className="text-status-rosso">*</span></label>
                  <select
                    value={form.priority || 'normale'}
                    onChange={e => updateField('priority', e.target.value)}
                    className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors appearance-none"
                    required
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Stato + Tecnico */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body-small text-text-secondary mb-1.5">Stato <span className="text-status-rosso">*</span></label>
                  <select
                    value={form.status || 'da_assegnare'}
                    onChange={e => updateField('status', e.target.value)}
                    className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors appearance-none"
                    required
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-body-small text-text-secondary mb-1.5">Tecnico Assegnato</label>
                  <select
                    value={form.technician || ''}
                    onChange={e => updateField('technician', e.target.value)}
                    className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors appearance-none"
                  >
                    <option value="">Non assegnato</option>
                    {TECHNICIANS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body-small text-text-secondary mb-1.5">Data Apertura <span className="text-status-rosso">*</span></label>
                  <input
                    type="date"
                    value={form.dateOpened || ''}
                    onChange={e => updateField('dateOpened', e.target.value)}
                    className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block font-body-small text-text-secondary mb-1.5">Data Prevista</label>
                  <input
                    type="date"
                    value={form.dateExpected || ''}
                    onChange={e => updateField('dateExpected', e.target.value)}
                    className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
                  />
                </div>
              </div>

              {/* Costo stimato */}
              <div>
                <label className="block font-body-small text-text-secondary mb-1.5">Costo Stimato (€)</label>
                <input
                  type="number"
                  value={form.estimatedCost || ''}
                  onChange={e => updateField('estimatedCost', Number(e.target.value))}
                  placeholder="0"
                  min={0}
                  className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block font-body-small text-text-secondary mb-1.5">Note Interne</label>
                <textarea
                  value={form.notes || ''}
                  onChange={e => updateField('notes', e.target.value)}
                  rows={3}
                  placeholder="Note visibili solo allo staff..."
                  className="w-full bg-bg-base border border-border-default rounded-md px-3 py-2 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors resize-none"
                />
              </div>

              {/* Parts Used Section */}
              {showParts && (
                <div className="border border-border-subtle rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading-3 text-text-primary flex items-center gap-2">
                      <Package size={16} className="text-text-muted" />
                      Ricambi Utilizzati
                      <span className="font-caption text-text-muted bg-bg-hover px-2 py-0.5 rounded">{(form.parts || []).length}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={addPart}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors font-body-small"
                    >
                      <Plus size={14} /> Aggiungi Ricambio
                    </button>
                  </div>
                  <AnimatePresence>
                    {(form.parts || []).map((part, i) => (
                      <motion.div
                        key={part.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-3 mb-2"
                      >
                        <input
                          type="text"
                          value={part.name}
                          onChange={e => updatePart(i, 'name', e.target.value)}
                          placeholder="Nome ricambio"
                          className="flex-1 h-9 bg-bg-base border border-border-default rounded-md px-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary text-sm"
                        />
                        <input
                          type="number"
                          value={part.quantity}
                          onChange={e => updatePart(i, 'quantity', Number(e.target.value))}
                          placeholder="Qta"
                          min={1}
                          className="w-16 h-9 bg-bg-base border border-border-default rounded-md px-2 font-body text-text-primary text-center focus:outline-none focus:border-accent-primary text-sm"
                        />
                        <input
                          type="number"
                          value={part.unitCost}
                          onChange={e => updatePart(i, 'unitCost', Number(e.target.value))}
                          placeholder="Costo"
                          min={0}
                          className="w-20 h-9 bg-bg-base border border-border-default rounded-md px-2 font-body text-text-primary text-right focus:outline-none focus:border-accent-primary text-sm"
                        />
                        <span className="font-mono text-xs text-accent-primary w-16 text-right">
                          €{(part.quantity * part.unitCost).toFixed(0)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePart(i)}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-status-rosso/20 text-text-muted hover:text-status-rosso transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {(form.parts || []).length === 0 && (
                    <p className="font-body-small text-text-muted text-center py-4">Nessun ricambio aggiunto</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-5 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors font-body"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-lg bg-accent-primary text-bg-base font-semibold hover:bg-accent-secondary transition-colors font-body"
                >
                  {isEditing ? 'Salva Modifiche' : 'Crea Riparazione'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────── DETAIL PANEL ──────────────────── */

function DetailPanel({
  repair,
  onClose,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  repair: Repair | null;
  onClose: () => void;
  onEdit: (repair: Repair) => void;
  onStatusChange: (repair: Repair, newStatus: Status) => void;
  onDelete: (repair: Repair) => void;
}) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  if (!repair) return null;

  const statusEntries = Object.entries(STATUS_CONFIG).filter(([key]) => key !== repair.status);

  return (
    <AnimatePresence>
      {repair && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: '#00000060', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: easeSmooth }}
            className="fixed right-0 top-0 bottom-0 w-[480px] max-w-full bg-bg-elevated border-l border-border-subtle z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-bg-elevated border-b border-border-subtle p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="font-caption text-text-muted">{repair.code}</span>
                  <h2 className="font-heading-1 text-text-primary mt-1">{repair.device}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={repair.status} />
                <PriorityBadge priority={repair.priority} />
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-caption text-text-muted block mb-1">Tecnico</span>
                  <span className="font-body text-text-primary">{repair.technician || 'Non assegnato'}</span>
                </div>
                <div>
                  <span className="font-caption text-text-muted block mb-1">Categoria</span>
                  <CategoryBadge category={repair.category} />
                </div>
                <div>
                  <span className="font-caption text-text-muted block mb-1">Apertura</span>
                  <span className="font-body text-text-primary">{format(new Date(repair.dateOpened), 'dd/MM/yyyy')}</span>
                </div>
                <div>
                  <span className="font-caption text-text-muted block mb-1">Chiusura</span>
                  <span className="font-body text-text-primary">{repair.dateCompleted ? format(new Date(repair.dateCompleted), 'dd/MM/yyyy') : '—'}</span>
                </div>
                <div>
                  <span className="font-caption text-text-muted block mb-1">Costo</span>
                  <span className="font-mono text-accent-primary">
                    {formatCurrency(repair.status === 'completata' && repair.finalCost ? repair.finalCost : repair.estimatedCost)}
                  </span>
                </div>
                {repair.dateExpected && (
                  <div>
                    <span className="font-caption text-text-muted block mb-1">Previsto</span>
                    <span className="font-body text-text-primary">{format(new Date(repair.dateExpected), 'dd/MM/yyyy')}</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-border-subtle" />

              {/* Descrizione */}
              <div>
                <h3 className="font-heading-3 text-text-primary mb-2 flex items-center gap-2">
                  <Wrench size={16} className="text-text-muted" />
                  Descrizione Problema
                </h3>
                <p className="font-body text-text-secondary leading-relaxed">{repair.description}</p>
              </div>

              {/* Note */}
              {repair.notes && (
                <div>
                  <h3 className="font-heading-3 text-text-primary mb-2 flex items-center gap-2">
                    <StickyNote size={16} className="text-text-muted" />
                    Note Interne
                  </h3>
                  <p className="font-body text-text-secondary leading-relaxed bg-bg-surface rounded-lg p-4 border border-border-subtle">{repair.notes}</p>
                </div>
              )}

              {/* Ricambi */}
              <div>
                <h3 className="font-heading-3 text-text-primary mb-2 flex items-center gap-2">
                  <Package size={16} className="text-text-muted" />
                  Ricambi Utilizzati
                </h3>
                {repair.parts.length > 0 ? (
                  <div className="space-y-2">
                    {repair.parts.map(part => (
                      <div key={part.id} className="flex items-center justify-between bg-bg-surface rounded-lg p-3 border border-border-subtle">
                        <span className="font-body text-text-primary">{part.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-caption text-text-muted">Qta: {part.quantity}</span>
                          <span className="font-mono text-sm text-accent-primary">{formatCurrency(part.unitCost * part.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-body-small text-text-muted">Nessun ricambio registrato</p>
                )}
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-heading-3 text-text-primary mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-text-muted" />
                  Cronologia
                </h3>
                <div className="relative pl-4 border-l border-border-subtle space-y-4">
                  {repair.timeline.map((entry) => (
                    <div key={entry.id} className="relative">
                      <div
                        className="absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-bg-elevated"
                        style={{ backgroundColor: entry.from ? STATUS_CONFIG[entry.from].color : STATUS_CONFIG[entry.to].color }}
                      />
                      <p className="font-body-small text-text-secondary">
                        {entry.from
                          ? `Stato cambiato: ${STATUS_CONFIG[entry.from].label} → ${STATUS_CONFIG[entry.to].label}`
                          : `Creazione: ${STATUS_CONFIG[entry.to].label}`}
                      </p>
                      <p className="font-caption text-text-muted mt-0.5">
                        {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: it })} — {entry.user}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-bg-elevated border-t border-border-subtle p-4 flex items-center gap-3">
              <button
                onClick={() => onEdit(repair)}
                className="flex-1 h-10 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors font-body"
              >
                Modifica
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="h-10 px-4 rounded-lg bg-accent-primary text-bg-base font-semibold hover:bg-accent-secondary transition-colors font-body"
                >
                  Cambia Stato
                </button>
                <AnimatePresence>
                  {showStatusDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full mb-2 right-0 bg-bg-surface border border-border-default rounded-lg shadow-xl overflow-hidden min-w-[180px]"
                    >
                      {statusEntries.map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => { onStatusChange(repair, key as Status); setShowStatusDropdown(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 font-body text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          {cfg.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => onDelete(repair)}
                className="h-10 px-4 rounded-lg text-status-rosso hover:bg-status-rosso/10 transition-colors font-body"
              >
                Elimina
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */

export default function Riparazioni() {
  const [repairs, setRepairs] = useState<Repair[]>(INITIAL_REPAIRS);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<Status[]>([]);
  const [filterPriority, setFilterPriority] = useState<Priority[]>([]);
  const [filterTechnician, setFilterTechnician] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<Category[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [detailRepair, setDetailRepair] = useState<Repair | null>(null);

  // Drag & drop state
  const [draggedRepair, setDraggedRepair] = useState<Repair | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);
  const [justDropped, setJustDropped] = useState<string | null>(null);

  // ── Filtered repairs ──
  const filteredRepairs = useMemo(() => {
    return repairs.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        r.device.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.technician.toLowerCase().includes(q);
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(r.status);
      const matchesPriority = filterPriority.length === 0 || filterPriority.includes(r.priority);
      const matchesTech = filterTechnician.length === 0 || filterTechnician.includes(r.technician);
      const matchesCat = filterCategory.length === 0 || filterCategory.includes(r.category);
      return matchesSearch && matchesStatus && matchesPriority && matchesTech && matchesCat;
    });
  }, [repairs, searchQuery, filterStatus, filterPriority, filterTechnician, filterCategory]);

  // ── Stats ──
  const stats = useMemo(() => {
    const inAttesa = repairs.filter(r => r.status === 'in_attesa').length;
    const inCorso = repairs.filter(r => r.status === 'in_corso').length;
    const completateMese = repairs.filter(r => {
      if (r.status !== 'completata' || !r.dateCompleted) return false;
      const d = new Date(r.dateCompleted);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const completate = repairs.filter(r => r.status === 'completata' && r.dateOpened);
    const avgDays = completate.length > 0
      ? completate.reduce((sum, r) => {
          const open = new Date(r.dateOpened).getTime();
          const close = new Date(r.dateCompleted!).getTime();
          return sum + (close - open) / (1000 * 60 * 60 * 24);
        }, 0) / completate.length
      : 0;
    return { inAttesa, inCorso, completateMese, avgDays: avgDays.toFixed(1) };
  }, [repairs]);

  // ── Toggle helpers ──
  const toggleFilter = <T,>(_arr: T[], val: T, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const clearFilters = () => {
    setFilterStatus([]);
    setFilterPriority([]);
    setFilterTechnician([]);
    setFilterCategory([]);
    setSearchQuery('');
  };

  const activeFilterCount = filterStatus.length + filterPriority.length + filterTechnician.length + filterCategory.length;

  // ── CRUD ──
  const handleSaveRepair = useCallback((repair: Repair) => {
    setRepairs(prev => {
      const existing = prev.findIndex(r => r.id === repair.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = repair;
        return updated;
      }
      return [...prev, repair];
    });
  }, []);

  const handleDeleteRepair = useCallback((repair: Repair) => {
    setRepairs(prev => prev.filter(r => r.id !== repair.id));
    setDetailRepair(null);
  }, []);

  const handleStatusChange = useCallback((repair: Repair, newStatus: Status) => {
    if (repair.status === newStatus) return;
    setRepairs(prev => prev.map(r => {
      if (r.id !== repair.id) return r;
      const updated: Repair = {
        ...r,
        status: newStatus,
        dateCompleted: newStatus === 'completata' ? format(new Date(), 'yyyy-MM-dd') : r.dateCompleted,
        timeline: [
          ...r.timeline,
          {
            id: `t${Date.now()}`,
            from: r.status,
            to: newStatus,
            timestamp: new Date().toISOString(),
            user: 'Admin',
          },
        ],
      };
      return updated;
    }));
    setDetailRepair(prev => prev && prev.id === repair.id
      ? { ...prev, status: newStatus, dateCompleted: newStatus === 'completata' ? format(new Date(), 'yyyy-MM-dd') : prev.dateCompleted }
      : prev
    );
  }, []);

  // ── Drag & Drop ──
  const handleDragStart = useCallback((e: React.DragEvent, repair: Repair) => {
    setDraggedRepair(repair);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', repair.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedRepair(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: Status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: Status) => {
    e.preventDefault();
    if (!draggedRepair || draggedRepair.status === status) {
      setDragOverColumn(null);
      setDraggedRepair(null);
      return;
    }
    handleStatusChange(draggedRepair, status);
    setDragOverColumn(null);
    setDraggedRepair(null);
    setJustDropped(status);
    setTimeout(() => setJustDropped(null), 500);
  }, [draggedRepair, handleStatusChange]);

  const openEditFromDetail = useCallback(() => {
    if (detailRepair) {
      setEditingRepair(detailRepair);
      setDetailRepair(null);
      setShowAddModal(true);
    }
  }, [detailRepair]);

  // ──────────────────── RENDER ────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: easeSmooth }}
      className="space-y-6"
    >
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeSmooth }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <p className="font-caption text-text-muted mb-1">Dashboard / Riparazioni</p>
          <h1 className="font-display-lg text-text-primary">Riparazioni</h1>
          <p className="font-body text-text-secondary mt-1">
            Gestione interventi e manutenzione apparecchiature
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-bg-elevated border border-border-subtle rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-2 h-9 px-3 rounded-md font-body-small transition-colors',
                viewMode === 'kanban' ? 'bg-accent-muted text-accent-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <LayoutGrid size={16} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 h-9 px-3 rounded-md font-body-small transition-colors',
                viewMode === 'list' ? 'bg-accent-muted text-accent-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <List size={16} /> Lista
            </button>
          </div>
          {/* New Repair Button */}
          <button
            onClick={() => { setEditingRepair(null); setShowAddModal(true); }}
            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-accent-primary text-bg-base font-semibold hover:bg-accent-secondary transition-colors font-body"
          >
            <Plus size={16} /> Nuova Riparazione
          </button>
        </div>
      </motion.div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="In Attesa" value={String(stats.inAttesa)} color="#EAB308" delay={0} />
        <StatCard label="In Corso" value={String(stats.inCorso)} color="#3B82F6" delay={0.06} />
        <StatCard label="Completate (Mese)" value={String(stats.completateMese)} color="#22C55E" delay={0.12} />
        <StatCard label="Tempo Medio" value={`${stats.avgDays} g`} color="#A3A3A3" delay={0.18} />
      </div>

      {/* ── Search & Filter Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: easeSmooth }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca ID, oggetto, tecnico..."
            className="w-full h-10 bg-bg-elevated border border-border-subtle rounded-lg pl-10 pr-4 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 h-10 px-4 rounded-lg border font-body-small transition-colors',
            showFilters || activeFilterCount > 0
              ? 'border-accent-primary/40 bg-accent-muted text-accent-primary'
              : 'border-border-subtle text-text-muted hover:text-text-secondary hover:bg-bg-hover'
          )}
        >
          <Filter size={16} />
          Filtri
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-accent-primary text-bg-base flex items-center justify-center text-xs font-semibold">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="font-body-small text-text-muted hover:text-status-rosso transition-colors"
          >
            Cancella filtri
          </button>
        )}
      </motion.div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: easeSmooth }}
            className="overflow-hidden"
          >
            <div className="bg-bg-elevated border border-border-subtle rounded-xl p-5 space-y-4">
              {/* Status filters */}
              <div>
                <span className="font-caption text-text-muted block mb-2">Stato</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => toggleFilter(filterStatus, key as Status, setFilterStatus)}
                      className={cn(
                        'h-8 px-3 rounded-md border font-body-small transition-colors flex items-center gap-1.5',
                        filterStatus.includes(key as Status)
                          ? 'border-opacity-40 bg-opacity-15 text-white'
                          : 'border-border-default text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                      )}
                      style={filterStatus.includes(key as Status) ? {
                        backgroundColor: `${cfg.color}15`,
                        borderColor: `${cfg.color}40`,
                        color: cfg.color,
                      } : {}}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Priority filters */}
              <div>
                <span className="font-caption text-text-muted block mb-2">Priorità</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => toggleFilter(filterPriority, key as Priority, setFilterPriority)}
                      className={cn(
                        'h-8 px-3 rounded-md border font-body-small transition-colors',
                        filterPriority.includes(key as Priority)
                          ? 'bg-opacity-15 border-opacity-40'
                          : 'border-border-default text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                      )}
                      style={filterPriority.includes(key as Priority) ? {
                        backgroundColor: cfg.bg,
                        borderColor: cfg.border,
                        color: cfg.color,
                      } : {}}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Category + Technician */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-caption text-text-muted block mb-2">Categoria</span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleFilter(filterCategory, cat, setFilterCategory)}
                        className={cn(
                          'h-8 px-3 rounded-md border font-body-small transition-colors',
                          filterCategory.includes(cat)
                            ? 'bg-accent-muted border-accent-primary/40 text-accent-primary'
                            : 'border-border-default text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-caption text-text-muted block mb-2">Tecnico</span>
                  <div className="flex flex-wrap gap-2">
                    {TECHNICIANS.map(tech => (
                      <button
                        key={tech}
                        onClick={() => toggleFilter(filterTechnician, tech, setFilterTechnician)}
                        className={cn(
                          'h-8 px-3 rounded-md border font-body-small transition-colors',
                          filterTechnician.includes(tech)
                            ? 'bg-accent-muted border-accent-primary/40 text-accent-primary'
                            : 'border-border-default text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                        )}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Kanban View ── */}
      <AnimatePresence mode="wait">
        {viewMode === 'kanban' ? (
          <motion.div
            key="kanban"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-4 overflow-x-auto pb-4"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#2A2A2A #0A0A0A' }}
          >
            {COLUMNS.map((status, colIdx) => {
              const colCards = filteredRepairs.filter(r => r.status === status);
              const cfg = STATUS_CONFIG[status];
              const isDragOver = dragOverColumn === status;
              const isDropped = justDropped === status;

              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: colIdx * 0.1, ease: easeSmooth }}
                  className={cn(
                    'flex-shrink-0 w-[300px] rounded-xl border flex flex-col',
                    'bg-bg-elevated border-border-subtle',
                    isDragOver && 'border-accent-primary/40 bg-bg-surface',
                    isDropped && 'border-accent-primary/30'
                  )}
                  style={{ maxHeight: 'calc(100vh - 340px)' }}
                  onDragOver={e => handleDragOver(e, status)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, status)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between p-3 border-b border-border-subtle flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                      <h3 className="font-heading-3 text-text-primary">{cfg.label}</h3>
                      <span className="font-badge bg-bg-hover text-text-muted px-2 py-0.5 rounded">
                        {colCards.length}
                      </span>
                    </div>
                    <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted hover:text-text-secondary transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {/* Cards Area */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2A2A2A #0A0A0A' }}>
                    <AnimatePresence mode="popLayout">
                      {colCards.map((repair, i) => (
                        <KanbanCard
                          key={repair.id}
                          repair={repair}
                          index={i}
                          onClick={() => setDetailRepair(repair)}
                          draggable
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragged={draggedRepair?.id === repair.id}
                          dimmed={false}
                        />
                      ))}
                    </AnimatePresence>
                    {colCards.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-10"
                      >
                        <div className="w-12 h-12 rounded-xl bg-bg-hover flex items-center justify-center mb-3">
                          <Wrench size={20} className="text-text-muted" />
                        </div>
                        <p className="font-body-small text-text-muted text-center">Nessuna riparazione</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ListView repairs={filteredRepairs} onRowClick={setDetailRepair} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <RepairModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingRepair(null); }}
        onSave={handleSaveRepair}
        repair={editingRepair}
      />

      <DetailPanel
        repair={detailRepair}
        onClose={() => setDetailRepair(null)}
        onEdit={openEditFromDetail}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteRepair}
      />
    </motion.div>
  );
}
