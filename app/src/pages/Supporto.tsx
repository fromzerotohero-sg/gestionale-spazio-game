import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Settings,
  Search,
  Filter,
  Send,
  Paperclip,
  X,
  ChevronDown,
  MoreVertical,
  MessageSquare,
  Clock,
  Calendar,
  User,
  Tag,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TicketStatus = 'aperto' | 'in_lavorazione' | 'in_attesa' | 'risolto' | 'chiuso';
type TicketPriority = 'urgente' | 'alta' | 'normale' | 'bassa';
type AuthorType = 'staff' | 'richiedente' | 'sistema';

interface TicketComment {
  id: string;
  author: string;
  authorType: AuthorType;
  message: string;
  timestamp: string;
  attachments?: string[];
}

interface Ticket {
  id: string;
  code: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  requester: string;
  assignee: string | null;
  sede: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
}

interface Technician {
  id: string;
  name: string;
  role: string;
  openTickets: number;
  initials: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; gradient: string; borderColor: string; textColor: string }> = {
  aperto: { label: 'Aperto', color: '#EAB308', gradient: 'linear-gradient(135deg, #EAB30820, #EAB30805)', borderColor: '#EAB3084D', textColor: '#EAB308' },
  in_lavorazione: { label: 'In Lavorazione', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F620, #3B82F605)', borderColor: '#3B82F64D', textColor: '#3B82F6' },
  in_attesa: { label: 'In Attesa', color: '#F97316', gradient: 'linear-gradient(135deg, #F9731620, #F9731605)', borderColor: '#F973164D', textColor: '#F97316' },
  risolto: { label: 'Risoluto', color: '#22C55E', gradient: 'linear-gradient(135deg, #22C55E20, #22C55E05)', borderColor: '#22C55E4D', textColor: '#22C55E' },
  chiuso: { label: 'Chiuso', color: '#525252', gradient: 'linear-gradient(135deg, #52525220, #52525205)', borderColor: '#5252524D', textColor: '#525252' },
};

const PRIORITY_CONFIG: Record<TicketPriority, { color: string; label: string }> = {
  urgente: { color: '#EF4444', label: 'Urgente' },
  alta: { color: '#F97316', label: 'Alta' },
  normale: { color: '#3B82F6', label: 'Normale' },
  bassa: { color: '#525252', label: 'Bassa' },
};

const CATEGORIES = ['Schede', 'Cabinet', 'Cambia Monete', 'Accessori', 'Monitor', 'Software', 'Rete', 'Manuali', 'Altro'];
const SEDI = ['Sala Giochi A', 'Sala Giochi B', 'Sala Giochi C', 'Magazzino Principale', 'Limena', 'Altro'];

const TECHNICIANS: Technician[] = [
  { id: 't1', name: 'Marco R.', role: 'Tecnico Senior', openTickets: 4, initials: 'MR' },
  { id: 't2', name: 'Luca B.', role: 'Tecnico', openTickets: 3, initials: 'LB' },
  { id: 't3', name: 'Anna V.', role: 'Tecnico Junior', openTickets: 2, initials: 'AV' },
  { id: 't4', name: 'Giovanni M.', role: 'Tecnico Senior', openTickets: 5, initials: 'GM' },
  { id: 't5', name: 'Paolo S.', role: 'Tecnico', openTickets: 1, initials: 'PS' },
  { id: 't6', name: 'Andrea F.', role: 'Tecnico', openTickets: 3, initials: 'AF' },
];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_TICKETS: Ticket[] = [
  {
    id: '1', code: 'TK-2025-0089', subject: 'Slot machine MANHATTAN non eroga vincite — segnalato da sala',
    description: 'La slot machine MANHATTAN (scaffale 3, sala principale) ha smesso di erogare le vincite. I giocatori segnalano che non escono i ticket. La macchina accetta gettoni normalmente ma al momento della vincita il lettore UBA non emette lo scontrino. Il display mostra il messaggio "Errore stampa" intermittente.',
    category: 'Schede', priority: 'urgente', status: 'in_lavorazione', requester: 'Sala Giochi B', assignee: 'Marco R.', sede: 'Sala Giochi B',
    createdAt: '2025-01-20T14:30:00', updatedAt: '2025-01-20T16:45:00',
    comments: [
      { id: 'c1', author: 'Sistema', authorType: 'sistema', message: 'Ticket creato — 20/01/2025 14:30 — Sala Giochi B', timestamp: '2025-01-20T14:30:00' },
      { id: 'c2', author: 'Sala Giochi B', authorType: 'richiedente', message: 'La slot machine MANHATTAN (scaffale 3, sala principale) ha smesso di erogare le vincite. I giocatori segnalano che non escono i ticket. La macchina accetta gettoni normalmente. Potreste intervenire urgentemente?', timestamp: '2025-01-20T14:32:00' },
      { id: 'c3', author: 'Sistema', authorType: 'sistema', message: 'Stato cambiato: Aperto → In Lavorazione — Marco R., 20/01/2025 14:35', timestamp: '2025-01-20T14:35:00' },
      { id: 'c4', author: 'Marco R.', authorType: 'staff', message: 'In arrivo in sala. Verifico subito la scheda e il lettore UBA.', timestamp: '2025-01-20T14:40:00' },
      { id: 'c5', author: 'Marco R.', authorType: 'staff', message: 'Diagnostica completata. Problema identificato: lettore UBA 10 malfunzionante sulla scheda MANHATTAN. Codice errore: UBA-E45. Procedo con la sostituzione del lettore.', timestamp: '2025-01-20T15:20:00' },
      { id: 'c6', author: 'Sistema', authorType: 'sistema', message: 'Stato cambiato: In Lavorazione → In Attesa — in attesa ricambio, 20/01/2025 15:20', timestamp: '2025-01-20T15:20:00' },
      { id: 'c7', author: 'Sala Giochi B', authorType: 'richiedente', message: 'Grazie per la rapida risposta. Quanto tempo stimiamo per il ricambio?', timestamp: '2025-01-20T15:45:00' },
      { id: 'c8', author: 'Marco R.', authorType: 'staff', message: 'Ho recuperato un lettore UBA 10 dalle scorte (ID: AC-001, quantita disponibile: 13). Intervento completabile entro 30 minuti.', timestamp: '2025-01-20T16:00:00' },
      { id: 'c9', author: 'Sistema', authorType: 'sistema', message: 'Stato cambiato: In Attesa → In Lavorazione — 20/01/2025 16:00', timestamp: '2025-01-20T16:00:00' },
    ],
  },
  {
    id: '2', code: 'TK-2025-0088', subject: 'APEX cambiamonete blocca su errore E47 — sala centrale',
    description: 'Il cambiamonete APEX nella sala centrale si è bloccato con errore E47. Il display mostra "Errore cassette" e non accetta banconote. I clienti stanno accumulandosi in coda.',
    category: 'Cambia Monete', priority: 'alta', status: 'in_lavorazione', requester: 'Sala Giochi A', assignee: 'Luca B.', sede: 'Sala Giochi A',
    createdAt: '2025-01-20T11:15:00', updatedAt: '2025-01-20T13:20:00',
    comments: [
      { id: 'c1', author: 'Sistema', authorType: 'sistema', message: 'Ticket creato — 20/01/2025 11:15 — Sala Giochi A', timestamp: '2025-01-20T11:15:00' },
      { id: 'c2', author: 'Sala Giochi A', authorType: 'richiedente', message: 'Il cambiamonete APEX si è bloccato con errore E47. Non accetta banconote, i clienti si stanno lamentando. Serve intervento rapido.', timestamp: '2025-01-20T11:20:00' },
      { id: 'c3', author: 'Sistema', authorType: 'sistema', message: 'Stato cambiato: Aperto → In Lavorazione — Luca B., 20/01/2025 11:30', timestamp: '2025-01-20T11:30:00' },
      { id: 'c4', author: 'Luca B.', authorType: 'staff', message: 'Sto verificando il cambiamonete. L\'errore E47 indica un problema con la casseta banconote. Provo a ripristinare.', timestamp: '2025-01-20T12:00:00' },
      { id: 'c5', author: 'Luca B.', authorType: 'staff', message: 'Cassetto banconote ostruito da una banconota piegata. Rimossa, test in corso.', timestamp: '2025-01-20T13:20:00' },
    ],
  },
  {
    id: '3', code: 'TK-2025-0087', subject: 'Richiesta aggiornamento firmware schede CHAMPION BET',
    description: 'Richiesta di aggiornamento firmware per le schede CHAMPION BET installate nelle sale A e B. La versione attuale è la 2.4.1, è disponibile la 2.5.0 con miglioramenti al sistema di autodiagnostica.',
    category: 'Schede', priority: 'normale', status: 'aperto', requester: 'Admin', assignee: 'Anna V.', sede: 'Sala Giochi A',
    createdAt: '2025-01-20T08:30:00', updatedAt: '2025-01-20T08:30:00',
    comments: [],
  },
  {
    id: '4', code: 'TK-2025-0086', subject: 'Monitor LED22 FUJITSU B227W — linea verticale sul display',
    description: 'Il monitor FUJITSU B227W postazione operatore nel magazzino mostra una linea verticale rossa fissa al centro dello schermo. Il problema è presente dall\'avvio, non dipende dal segnale in ingresso.',
    category: 'Monitor', priority: 'bassa', status: 'aperto', requester: 'Magazzino', assignee: null, sede: 'Magazzino Principale',
    createdAt: '2025-01-19T16:00:00', updatedAt: '2025-01-19T16:00:00',
    comments: [
      { id: 'c1', author: 'Sistema', authorType: 'sistema', message: 'Ticket creato — 19/01/2025 16:00 — Magazzino', timestamp: '2025-01-19T16:00:00' },
      { id: 'c2', author: 'Magazzino', authorType: 'richiedente', message: 'Monitor con linea verticale rossa al centro. Dà fastidio alla vista durante lavoro. Non urgente ma da sistemare.', timestamp: '2025-01-19T16:05:00' },
    ],
  },
  {
    id: '5', code: 'TK-2025-0085', subject: 'EARTH cabinet #5 — surriscaldamento unità di alimentazione',
    description: 'Il cabinet EARTH numero 5 nella Sala Giochi C presenta surriscaldamento dell\'unità di alimentazione. La ventola di raffreddamento è rumorosa e la temperatura è superiore alla norma. Rischio di spegnimento automatico.',
    category: 'Cabinet', priority: 'alta', status: 'in_lavorazione', requester: 'Sala Giochi C', assignee: 'Marco R.', sede: 'Sala Giochi C',
    createdAt: '2025-01-19T10:00:00', updatedAt: '2025-01-20T09:30:00',
    comments: [
      { id: 'c1', author: 'Sistema', authorType: 'sistema', message: 'Ticket creato — 19/01/2025 10:00 — Sala Giochi C', timestamp: '2025-01-19T10:00:00' },
      { id: 'c2', author: 'Sala Giochi C', authorType: 'richiedente', message: 'Cabinet EARTH #5 molto caldo, ventola che fa rumore. Temiamo si spenga da solo.', timestamp: '2025-01-19T10:15:00' },
      { id: 'c3', author: 'Sistema', authorType: 'sistema', message: 'Stato cambiato: Aperto → In Lavorazione — Marco R., 19/01/2025 10:30', timestamp: '2025-01-19T10:30:00' },
      { id: 'c4', author: 'Marco R.', authorType: 'staff', message: 'Verificato. Accumulo di polvere nel filtro aria. Pulizia in corso, sostituzione ventola programmata.', timestamp: '2025-01-20T09:30:00' },
    ],
  },
  {
    id: '6', code: 'TK-2025-0084', subject: 'Cambiamonete BALDAZZI nuovo — non accetta banconote da 20€',
    description: 'Il nuovo cambiamonete BALDAZZI installato la settimana scorsa non accetta banconote da 20 euro. Le altre denominazioni funzionano correttamente. Il sensore di lettura sembra non riconoscere la banconota da 20.',
    category: 'Cambia Monete', priority: 'urgente', status: 'in_attesa', requester: 'Sala Giochi A', assignee: 'Luca B.', sede: 'Sala Giochi A',
    createdAt: '2025-01-18T14:00:00', updatedAt: '2025-01-20T10:00:00',
    comments: [
      { id: 'c1', author: 'Sistema', authorType: 'sistema', message: 'Ticket creato — 18/01/2025 14:00 — Sala Giochi A', timestamp: '2025-01-18T14:00:00' },
      { id: 'c2', author: 'Sala Giochi A', authorType: 'richiedente', message: 'Il cambiamonete nuovo non prende i 20€! I clienti si arrabbiano perché non possono cambiare.', timestamp: '2025-01-18T14:10:00' },
      { id: 'c3', author: 'Luca B.', authorType: 'staff', message: 'Verificato. Il sensore ottico per le banconote da 20€ è mal calibrato. Serve sostituzione modulo lettura. Ordinato ricambio.', timestamp: '2025-01-18T15:00:00' },
      { id: 'c4', author: 'Sala Giochi A', authorType: 'richiedente', message: 'Quando arriverà il ricambio? I clienti continuano a lamentarsi.', timestamp: '2025-01-19T09:00:00' },
      { id: 'c5', author: 'Luca B.', authorType: 'staff', message: 'Ricambio in arrivo domani 21/01. Intervento programmato per mattina.', timestamp: '2025-01-20T10:00:00' },
      { id: 'c6', author: 'Sala Giochi A', authorType: 'richiedente', message: 'Perfetto, grazie per l\'aggiornamento.', timestamp: '2025-01-20T10:30:00' },
    ],
  },
  {
    id: '7', code: 'TK-2025-0083', subject: 'Richiesta installazione 2 nuovi cabinet EARTH NUOVO',
    description: 'La direzione richiede l\'installazione di 2 nuovi cabinet modello EARTH NUOVO nella Sala Giochi B. I cabinet sono arrivati ieri e sono in magazzino. Serve configurazione iniziale e installazione.',
    category: 'Cabinet', priority: 'normale', status: 'aperto', requester: 'Direzione', assignee: null, sede: 'Sala Giochi B',
    createdAt: '2025-01-17T09:00:00', updatedAt: '2025-01-17T09:00:00',
    comments: [],
  },
  {
    id: '8', code: 'TK-2025-0082', subject: 'Problema di rete — lettori UBA non comunicano con server',
    description: 'I lettori UBA nelle sale A e C non stanno comunicando con il server centrale. I giochi funzionano in modalità offline ma non vengono sincronizzati i dati di gioco e le statistiche. Potrebbe essere un problema di switch di rete.',
    category: 'Accessori', priority: 'bassa', status: 'in_lavorazione', requester: 'IT Interno', assignee: 'Anna V.', sede: 'Sala Giochi A',
    createdAt: '2025-01-17T11:30:00', updatedAt: '2025-01-18T16:00:00',
    comments: [
      { id: 'c1', author: 'Sistema', authorType: 'sistema', message: 'Ticket creato — 17/01/2025 11:30 — IT Interno', timestamp: '2025-01-17T11:30:00' },
      { id: 'c2', author: 'IT Interno', authorType: 'richiedente', message: 'I lettori UBA non comunicano con il server. I giochi vanno ma non sincronizzano. Controllare lo switch.', timestamp: '2025-01-17T11:45:00' },
      { id: 'c3', author: 'Sistema', authorType: 'sistema', message: 'Stato cambiato: Aperto → In Lavorazione — Anna V., 17/01/2025 12:00', timestamp: '2025-01-17T12:00:00' },
      { id: 'c4', author: 'Anna V.', authorType: 'staff', message: 'Verificata connettività. Lo switch della sala A ha una porta guasta. Spostato cavo su porta alternativa, test in corso.', timestamp: '2025-01-18T16:00:00' },
    ],
  },
  {
    id: '9', code: 'TK-2025-0081', subject: 'Sostituzione urgente alimentatore T-701 — 3 unità guaste',
    description: 'Sono state rilevate 3 unità alimentatore modello T-701 guaste nel magazzino. Questi alimentatori sono utilizzati per i cabinet EARTH e MANHATTAN. Serve ordine urgente di sostituzione.',
    category: 'Accessori', priority: 'alta', status: 'in_attesa', requester: 'Magazzino', assignee: 'Marco R.', sede: 'Magazzino Principale',
    createdAt: '2025-01-16T10:00:00', updatedAt: '2025-01-19T14:00:00',
    comments: [
      { id: 'c1', author: 'Sistema', authorType: 'sistema', message: 'Ticket creato — 16/01/2025 10:00 — Magazzino', timestamp: '2025-01-16T10:00:00' },
      { id: 'c2', author: 'Magazzino', authorType: 'richiedente', message: '3 alimentatori T-701 da sostituire, sono fondamentali per i cabinet.', timestamp: '2025-01-16T10:15:00' },
      { id: 'c3', author: 'Marco R.', authorType: 'staff', message: 'Verificato. Ordine ricambi inviato a fornitore. Consegna prevista 22/01.', timestamp: '2025-01-19T14:00:00' },
    ],
  },
  {
    id: '10', code: 'TK-2025-0080', subject: 'Richiesta manuale utente aggiornato per cabinet LOTUS',
    description: 'Richiesta del manuale utente aggiornato per il cabinet LOTUS. Il manuale attuale risale al 2023 e non include le ultime modifiche firmware. Richiedente: Sala Giochi B.',
    category: 'Manuali', priority: 'normale', status: 'risolto', requester: 'Sala Giochi B', assignee: null, sede: 'Sala Giochi B',
    createdAt: '2025-01-15T09:00:00', updatedAt: '2025-01-16T11:00:00',
    comments: [
      { id: 'c1', author: 'Sistema', authorType: 'sistema', message: 'Ticket creato — 15/01/2025 09:00 — Sala Giochi B', timestamp: '2025-01-15T09:00:00' },
      { id: 'c2', author: 'Sala Giochi B', authorType: 'richiedente', message: 'Serve il manuale aggiornato del cabinet LOTUS, quello attuale è vecchio.', timestamp: '2025-01-15T09:30:00' },
      { id: 'c3', author: 'Sistema', authorType: 'sistema', message: 'Stato cambiato: Aperto → Risolto — 16/01/2025 11:00', timestamp: '2025-01-16T11:00:00' },
      { id: 'c4', author: 'Marco R.', authorType: 'staff', message: 'Manuale LOTUS v2024 caricato nella sezione Modulistica. Link inviato via email.', timestamp: '2025-01-16T11:00:00' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const now = new Date('2025-01-20T17:00:00');
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'ora';
  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} h fa`;
  if (diffDays === 1) return '1 giorno fa';
  return `${diffDays} giorni fa`;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status, size = 'sm' }: { status: TicketStatus; size?: 'sm' | 'lg' }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center font-badge uppercase whitespace-nowrap',
        size === 'sm' ? 'h-[22px] px-2.5 text-[10px]' : 'h-7 px-3 text-[11px]'
      )}
      style={{
        background: cfg.gradient,
        border: `1px solid ${cfg.borderColor}`,
        color: cfg.textColor,
        borderRadius: '4px',
      }}
    >
      {cfg.label}
    </span>
  );
}

function PriorityDot({ priority, pulse = false }: { priority: TicketPriority; pulse?: boolean }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className="relative flex items-center justify-center">
      <span
        className={cn('block rounded-full', pulse ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5')}
        style={{ backgroundColor: cfg.color }}
      />
      {pulse && priority === 'urgente' && (
        <span
          className="absolute rounded-full w-2.5 h-2.5 animate-ping"
          style={{ backgroundColor: cfg.color, opacity: 0.5 }}
        />
      )}
    </span>
  );
}

function Avatar({ name, initials, size = 24 }: { name: string; initials: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-border-hover flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
      title={name}
    >
      <span className={cn('font-mono font-semibold text-text-muted', size <= 24 ? 'text-[9px]' : 'text-xs')}>
        {initials}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({ label, value, color, delay }: { label: string; value: string | number; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="bg-bg-elevated border border-border-subtle rounded-xl p-5 hover:border-border-hover transition-colors duration-200"
    >
      <p className="font-caption text-text-muted mb-2">{label}</p>
      <motion.p
        className="font-data-md"
        style={{ color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.1 }}
      >
        {value}
      </motion.p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// New Ticket Modal
// ---------------------------------------------------------------------------

function NewTicketModal({ onClose, onCreate }: { onClose: () => void; onCreate: (ticket: Ticket) => void }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Schede');
  const [priority, setPriority] = useState<TicketPriority>('normale');
  const [requester, setRequester] = useState('');
  const [sede, setSede] = useState('Sala Giochi A');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || !requester.trim()) return;
    const newTicket: Ticket = {
      id: `new-${Date.now()}`,
      code: `TK-2025-${String(Math.floor(Math.random() * 9000) + 1000).slice(-4)}`,
      subject, description, category, priority, status: 'aperto',
      requester, assignee: null, sede,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [
        { id: `sys-${Date.now()}`, author: 'Sistema', authorType: 'sistema', message: `Ticket creato — ${formatDateTime(new Date().toISOString())} — ${requester}`, timestamp: new Date().toISOString() },
      ],
    };
    onCreate(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="relative bg-bg-surface border border-border-default rounded-2xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto m-4"
        style={{ boxShadow: '0 24px 48px #00000080' }}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading-2 text-text-primary">Nuovo Ticket di Supporto</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-body-small text-text-secondary mb-1.5">Oggetto <span className="text-status-rosso">*</span></label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Descrivi brevemente il problema"
                className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" required />
            </div>
            <div>
              <label className="block font-body-small text-text-secondary mb-1.5">Descrizione <span className="text-status-rosso">*</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Descrivi il problema in dettaglio..."
                className="w-full bg-bg-base border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors resize-none" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body-small text-text-secondary mb-1.5">Categoria <span className="text-status-rosso">*</span></label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 text-sm text-text-primary outline-none focus:border-accent-primary transition-colors appearance-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body-small text-text-secondary mb-1.5">Priorit&agrave; <span className="text-status-rosso">*</span></label>
                <select value={priority} onChange={e => setPriority(e.target.value as TicketPriority)}
                  className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 text-sm text-text-primary outline-none focus:border-accent-primary transition-colors appearance-none">
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body-small text-text-secondary mb-1.5">Richiedente <span className="text-status-rosso">*</span></label>
                <input value={requester} onChange={e => setRequester(e.target.value)} placeholder="Nome del richiedente"
                  className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary transition-colors" required />
              </div>
              <div>
                <label className="block font-body-small text-text-secondary mb-1.5">Sede <span className="text-status-rosso">*</span></label>
                <select value={sede} onChange={e => setSede(e.target.value)}
                  className="w-full h-10 bg-bg-base border border-border-default rounded-md px-3 text-sm text-text-primary outline-none focus:border-accent-primary transition-colors appearance-none">
                  {SEDI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="h-10 px-5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors font-medium text-sm">
                Annulla
              </button>
              <button type="submit" className="h-10 px-5 rounded-lg bg-accent-primary text-bg-base font-semibold text-sm hover:bg-accent-secondary transition-colors">
                Crea Ticket
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assign Modal
// ---------------------------------------------------------------------------

function AssignModal({ ticket, onClose, onAssign }: { ticket: Ticket; onClose: () => void; onAssign: (techId: string) => void }) {
  const [selectedTech, setSelectedTech] = useState<string | null>(ticket.assignee ? TECHNICIANS.find(t => t.name === ticket.assignee)?.id ?? null : null);

  const handleAssign = () => {
    if (selectedTech) {
      onAssign(selectedTech);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="relative bg-bg-surface border border-border-default rounded-2xl w-full max-w-[400px] m-4"
        style={{ boxShadow: '0 24px 48px #00000080' }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading-2 text-text-primary">Assegna Ticket</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-1 max-h-[320px] overflow-y-auto">
            {TECHNICIANS.map((tech, i) => (
              <motion.button
                key={tech.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                onClick={() => setSelectedTech(tech.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                  selectedTech === tech.id ? 'bg-[#D0FF5915]' : 'hover:bg-bg-hover'
                )}
              >
                <Avatar name={tech.name} initials={tech.initials} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-text-primary font-medium truncate">{tech.name}</p>
                  <p className="font-caption text-text-muted">{tech.role}</p>
                </div>
                <p className="font-caption text-text-muted">{tech.openTickets} ticket aperti</p>
                {selectedTech === tech.id && <Check size={16} className="text-accent-primary flex-shrink-0" />}
              </motion.button>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-border-subtle">
            <button onClick={onClose} className="h-10 px-5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors font-medium text-sm">
              Annulla
            </button>
            <button onClick={handleAssign} disabled={!selectedTech}
              className={cn(
                'h-10 px-5 rounded-lg font-semibold text-sm transition-colors',
                selectedTech ? 'bg-accent-primary text-bg-base hover:bg-accent-secondary' : 'bg-bg-hover text-text-muted cursor-not-allowed'
              )}>
              Assegna
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Change Dropdown
// ---------------------------------------------------------------------------

function StatusDropdown({ currentStatus, onChange }: { currentStatus: TicketStatus; onChange: (s: TicketStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const statuses = Object.keys(STATUS_CONFIG) as TicketStatus[];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="h-9 px-3 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-bg-hover transition-all text-sm flex items-center gap-2">
        Cambia Stato <ChevronDown size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 bg-bg-surface border border-border-default rounded-lg shadow-xl z-50 py-1 min-w-[160px]"
          >
            {statuses.map(s => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                  s === currentStatus ? 'text-accent-primary bg-[#D0FF5915]' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                )}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_CONFIG[s].color }} />
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Priority Selector
// ---------------------------------------------------------------------------

function PrioritySelector({ priority, onChange }: { priority: TicketPriority; onChange: (p: TicketPriority) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const cfg = PRIORITY_CONFIG[priority];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="h-8 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors"
        style={{ borderColor: cfg.color + '60', color: cfg.color, backgroundColor: cfg.color + '15' }}>
        <PriorityDot priority={priority} /> {cfg.label} <ChevronDown size={12} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 bg-bg-surface border border-border-default rounded-lg shadow-xl z-50 py-1 min-w-[130px]"
          >
            {(Object.keys(PRIORITY_CONFIG) as TicketPriority[]).map(p => (
              <button key={p} onClick={() => { onChange(p); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                  p === priority ? 'text-accent-primary bg-[#D0FF5915]' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                )}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_CONFIG[p].color }} />
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

function MessageBubble({ comment }: { comment: TicketComment }) {
  if (comment.authorType === 'sistema') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 my-4"
      >
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="font-caption text-text-muted whitespace-nowrap">{comment.message}</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </motion.div>
    );
  }

  const isStaff = comment.authorType === 'staff';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className={cn('flex', isStaff ? 'justify-end' : 'justify-start')}
    >
      <div className={cn('max-w-[80%]', isStaff ? 'order-1' : 'order-1')}>
        <div className="flex items-center gap-2 mb-1.5">
          {!isStaff && <Avatar name={comment.author} initials={comment.author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()} size={22} />}
          <span className={cn('font-caption font-semibold', isStaff ? 'text-accent-primary' : 'text-status-blu')}>
            {comment.author}
          </span>
          <span className="font-caption text-text-muted">{formatDateTime(comment.timestamp)}</span>
        </div>
        <div
          className={cn('p-4 text-sm leading-relaxed', isStaff ? 'text-text-secondary' : 'text-text-secondary')}
          style={{
            background: isStaff ? '#D0FF5915' : '#111111',
            border: isStaff ? '1px solid #D0FF5930' : '1px solid #2A2A2A',
            borderRadius: isStaff ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          }}
        >
          {comment.message}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sort Dropdown
// ---------------------------------------------------------------------------

function SortDropdown({ sortBy, onChange }: { sortBy: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const options = [
    { value: 'priorita', label: 'Priorit\u00e0' },
    { value: 'data', label: 'Data' },
    { value: 'stato', label: 'Stato' },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="h-8 px-2.5 rounded-md border border-border-default text-text-muted hover:text-text-secondary hover:border-border-hover transition-all text-xs flex items-center gap-1.5">
        <Filter size={12} /> {options.find(o => o.value === sortBy)?.label} <ChevronDown size={12} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 bg-bg-surface border border-border-default rounded-lg shadow-xl z-50 py-1 min-w-[120px]"
          >
            {options.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                className={cn(
                  'w-full px-3 py-2 text-sm text-left transition-colors',
                  o.value === sortBy ? 'text-accent-primary bg-[#D0FF5915]' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                )}>
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Supporto() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_TICKETS[0].id);
  const [activeTab, setActiveTab] = useState<string>('tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('priorita');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);

  const selectedTicket = useMemo(() => tickets.find(t => t.id === selectedId) ?? null, [tickets, selectedId]);

  // Stats
  const stats = useMemo(() => {
    const aperti = tickets.filter(t => t.status === 'aperto').length;
    const inLavoro = tickets.filter(t => t.status === 'in_lavorazione').length;
    const risolti = tickets.filter(t => t.status === 'risolto').length;
    return { aperti, inLavoro, risolti, tempoMedio: '2.4 h' };
  }, [tickets]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    tutti: tickets.length,
    aperti: tickets.filter(t => t.status === 'aperto').length,
    in_lavorazione: tickets.filter(t => t.status === 'in_lavorazione').length,
    in_attesa: tickets.filter(t => t.status === 'in_attesa').length,
    risolti: tickets.filter(t => t.status === 'risolto').length,
    chiusi: tickets.filter(t => t.status === 'chiuso').length,
  }), [tickets]);

  // Filter + sort tickets
  const filteredTickets = useMemo(() => {
    let result = [...tickets];
    if (activeTab !== 'tutti') {
      result = result.filter(t => t.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.code.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.requester.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'priorita') {
        const order = { urgente: 0, alta: 1, normale: 2, bassa: 3 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === 'data') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'stato') return a.status.localeCompare(b.status);
      return 0;
    });
    return result;
  }, [tickets, activeTab, searchQuery, sortBy]);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [selectedTicket?.comments.length]);

  const handleSelectTicket = useCallback((id: string) => {
    setSelectedId(id);
    setMobileDetail(true);
  }, []);

  const handleStatusChange = useCallback((newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    const oldStatus = selectedTicket.status;
    setTickets(prev => prev.map(t => {
      if (t.id !== selectedTicket.id) return t;
      const updatedComments = [...t.comments, {
        id: `sys-${Date.now()}`,
        author: 'Sistema',
        authorType: 'sistema' as AuthorType,
        message: `Stato cambiato: ${STATUS_CONFIG[oldStatus].label} \u2192 ${STATUS_CONFIG[newStatus].label} — ${formatDateTime(new Date().toISOString())}`,
        timestamp: new Date().toISOString(),
      }];
      return { ...t, status: newStatus, updatedAt: new Date().toISOString(), comments: updatedComments };
    }));
  }, [selectedTicket]);

  const handlePriorityChange = useCallback((newPriority: TicketPriority) => {
    if (!selectedTicket) return;
    setTickets(prev => prev.map(t =>
      t.id === selectedTicket.id ? { ...t, priority: newPriority, updatedAt: new Date().toISOString() } : t
    ));
  }, [selectedTicket]);

  const handleAssign = useCallback((techId: string) => {
    if (!selectedTicket) return;
    const tech = TECHNICIANS.find(t => t.id === techId);
    if (!tech) return;
    setTickets(prev => prev.map(t => {
      if (t.id !== selectedTicket.id) return t;
      const updatedComments = [...t.comments, {
        id: `sys-${Date.now()}`,
        author: 'Sistema',
        authorType: 'sistema' as AuthorType,
        message: `Ticket assegnato a ${tech.name} — ${formatDateTime(new Date().toISOString())}`,
        timestamp: new Date().toISOString(),
      }];
      return { ...t, assignee: tech.name, updatedAt: new Date().toISOString(), comments: updatedComments };
    }));
  }, [selectedTicket]);

  const handleSendReply = useCallback(() => {
    if (!selectedTicket || !replyText.trim()) return;
    const newComment: TicketComment = {
      id: `c-${Date.now()}`,
      author: isInternalNote ? 'Nota Interna' : 'Marco R.',
      authorType: isInternalNote ? 'staff' : 'staff',
      message: replyText.trim(),
      timestamp: new Date().toISOString(),
    };
    setTickets(prev => prev.map(t =>
      t.id === selectedTicket.id
        ? { ...t, comments: [...t.comments, newComment], updatedAt: new Date().toISOString() }
        : t
    ));
    setReplyText('');
  }, [selectedTicket, replyText, isInternalNote]);

  const handleCreateTicket = useCallback((ticket: Ticket) => {
    setTickets(prev => [ticket, ...prev]);
    setSelectedId(ticket.id);
  }, []);

  const tabs: { key: string; label: string; color: string }[] = [
    { key: 'tutti', label: 'Tutti', color: '#525252' },
    { key: 'aperto', label: 'Aperti', color: '#EAB308' },
    { key: 'in_lavorazione', label: 'In Lavorazione', color: '#3B82F6' },
    { key: 'in_attesa', label: 'In Attesa', color: '#F97316' },
    { key: 'risolto', label: 'Risolti', color: '#22C55E' },
    { key: 'chiuso', label: 'Chiusi', color: '#525252' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* ---- Page Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="flex-shrink-0 px-6 pt-6 pb-4"
      >
        <p className="font-caption text-text-muted mb-1">Dashboard / Supporto Tecnico</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display-lg text-text-primary">Supporto Tecnico</h1>
            <p className="font-body text-text-secondary mt-0.5">Gestione ticket assistenza e richieste tecniche</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNewTicket(true)}
              className="h-10 px-4 rounded-lg bg-accent-primary text-bg-base font-semibold text-sm flex items-center gap-2 hover:bg-accent-secondary transition-colors">
              <Plus size={16} /> Nuovo Ticket
            </button>
            <button className="w-10 h-10 rounded-lg border border-border-default flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ---- Stats Bar ---- */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-4 px-6 pb-4">
        <StatCard label="Aperti" value={stats.aperti} color="#EAB308" delay={0} />
        <StatCard label="In Lavorazione" value={stats.inLavoro} color="#3B82F6" delay={0.06} />
        <StatCard label="Risolti (Mese)" value={stats.risolti} color="#22C55E" delay={0.12} />
        <StatCard label="Tempo Medio Risposta" value={stats.tempoMedio} color="#A3A3A3" delay={0.18} />
      </div>

      {/* ---- Main Split Pane ---- */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ---- Left: Ticket List ---- */}
        <div className={cn(
          'w-[40%] min-w-[360px] max-w-[480px] bg-bg-elevated border-r border-border-subtle flex flex-col',
          mobileDetail && selectedId ? 'hidden lg:flex' : 'flex'
        )}>
          {/* Search */}
          <div className="flex-shrink-0 h-14 px-4 border-b border-border-subtle flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cerca ticket per ID, oggetto, richiedente..."
                className="w-full h-9 bg-bg-base border border-border-default rounded-md pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary transition-colors"
              />
            </div>
            <SortDropdown sortBy={sortBy} onChange={setSortBy} />
          </div>

          {/* Filter Tabs */}
          <div className="flex-shrink-0 border-b border-border-subtle overflow-x-auto">
            <div className="flex px-2">
              {tabs.map((tab, i) => (
                <motion.button
                  key={tab.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'relative flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap',
                    activeTab === tab.key ? '' : 'text-text-muted hover:text-text-secondary'
                  )}
                  style={activeTab === tab.key ? { color: tab.color } : {}}
                >
                  {tab.label}
                  <span
                    className="min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-mono font-semibold flex items-center justify-center"
                    style={{
                      backgroundColor: activeTab === tab.key ? tab.color + '25' : '#1A1A1A',
                      color: activeTab === tab.key ? tab.color : '#525252',
                    }}
                  >
                    {tabCounts[tab.key as keyof typeof tabCounts] ?? 0}
                  </span>
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="ticketTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ backgroundColor: tab.color }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {filteredTickets.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <img src="/empty-state.svg" alt="Vuoto" className="w-16 h-16 mb-3 opacity-30" />
                  <p className="font-body-small text-text-muted">Nessun ticket trovato</p>
                </motion.div>
              ) : (
                filteredTickets.map((ticket, i) => {
                  const isSelected = ticket.id === selectedId;
                  return (
                    <motion.div
                      key={ticket.id}
                      layout
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ delay: i * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      onClick={() => handleSelectTicket(ticket.id)}
                      className={cn(
                        'cursor-pointer border-b border-border-subtle transition-colors duration-100',
                        isSelected
                          ? 'bg-gradient-to-r from-[#D0FF5910] to-transparent border-l-[3px] border-l-accent-primary'
                          : 'hover:bg-bg-surface border-l-[3px] border-l-transparent'
                      )}
                    >
                      <div className="p-4">
                        {/* Top row */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <PriorityDot priority={ticket.priority} pulse={ticket.priority === 'urgente'} />
                          <span className="font-caption text-text-muted">{ticket.code}</span>
                          <span className="ml-auto font-caption text-text-muted">{timeAgo(ticket.createdAt)}</span>
                        </div>
                        {/* Subject */}
                        <p className={cn(
                          'font-body text-sm font-medium line-clamp-2 mb-2',
                          isSelected ? 'text-accent-primary' : 'text-text-primary'
                        )}>
                          {ticket.subject}
                        </p>
                        {/* Meta row */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-caption text-text-secondary">{ticket.requester}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase bg-bg-surface text-text-muted border border-border-default">
                            {ticket.category}
                          </span>
                          {ticket.assignee ? (
                            <span className="font-caption text-text-muted">{ticket.assignee}</span>
                          ) : (
                            <span className="font-caption text-status-arancione">Non assegnato</span>
                          )}
                        </div>
                        {/* Bottom row */}
                        <div className="flex items-center justify-between">
                          <StatusBadge status={ticket.status} />
                          <div className="flex items-center gap-1 text-text-muted">
                            <MessageSquare size={12} />
                            <span className="font-caption">{ticket.comments.length}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ---- Right: Ticket Detail ---- */}
        <div className={cn(
          'flex-1 bg-bg-base flex flex-col min-w-0',
          mobileDetail && selectedId ? 'flex' : 'hidden lg:flex'
        )}>
          {selectedTicket ? (
            <>
              {/* Mobile back button */}
              <div className="lg:hidden flex-shrink-0 px-4 pt-4">
                <button onClick={() => setMobileDetail(false)}
                  className="flex items-center gap-1 text-text-muted hover:text-text-primary text-sm transition-colors">
                  <ArrowLeft size={16} /> Torna alla lista
                </button>
              </div>

              {/* Detail Header */}
              <motion.div
                key={`header-${selectedTicket.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="flex-shrink-0 px-8 py-6 border-b border-border-subtle"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-caption text-text-muted">{selectedTicket.code}</span>
                  <StatusBadge status={selectedTicket.status} size="lg" />
                  <div className="ml-auto">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                <h2 className="font-heading-1 text-text-primary mb-3">{selectedTicket.subject}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <PrioritySelector priority={selectedTicket.priority} onChange={handlePriorityChange} />
                  <span className="px-2 py-1 rounded text-[10px] font-mono font-medium uppercase bg-bg-surface text-text-muted border border-border-default">
                    {selectedTicket.category}
                  </span>
                  <span className="font-body-small text-text-secondary">
                    Aperto da <span className="text-text-primary">{selectedTicket.requester}</span> il {formatDateTime(selectedTicket.createdAt).split(' ')[0]}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    {selectedTicket.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={selectedTicket.assignee} initials={selectedTicket.assignee.split(' ').map(n => n[0]).join('').slice(0, 2)} size={24} />
                        <span className="font-body-small text-text-secondary">{selectedTicket.assignee}</span>
                      </div>
                    ) : (
                      <button onClick={() => setShowAssign(true)} className="text-sm text-accent-primary hover:underline">
                        Non assegnato — Assegna
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Info Bar */}
              <div className="flex-shrink-0 h-12 bg-bg-elevated border-b border-border-subtle flex items-center px-8 gap-6 overflow-x-auto">
                <div className="flex items-center gap-1.5 text-text-muted flex-shrink-0">
                  <Calendar size={13} />
                  <span className="font-caption">Aperto: {formatDateTime(selectedTicket.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted flex-shrink-0">
                  <Clock size={13} />
                  <span className="font-caption">Ultimo aggiornamento: {formatDateTime(selectedTicket.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted flex-shrink-0">
                  <User size={13} />
                  <span className="font-caption">Assegnato a: {selectedTicket.assignee ?? '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted flex-shrink-0">
                  <Tag size={13} />
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase bg-bg-surface text-text-muted border border-border-default">
                    {selectedTicket.category}
                  </span>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <StatusDropdown currentStatus={selectedTicket.status} onChange={handleStatusChange} />
                </div>
              </div>

              {/* Conversation Area */}
              <div ref={conversationRef} className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-bg-elevated border border-border-subtle rounded-xl"
                >
                  <p className="font-body-small text-text-muted mb-1 uppercase tracking-wider">Descrizione</p>
                  <p className="font-body text-sm text-text-secondary leading-relaxed">{selectedTicket.description}</p>
                </motion.div>

                {/* Messages */}
                <div className="space-y-1">
                  <AnimatePresence>
                    {selectedTicket.comments.map((comment, i) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25 }}
                      >
                        <MessageBubble comment={comment} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Reply Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="flex-shrink-0 bg-bg-elevated border-t border-border-subtle px-8 py-4"
              >
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  placeholder="Scrivi una risposta..."
                  rows={2}
                  className="w-full bg-bg-base border border-border-default rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-primary transition-colors resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-sm">
                      <Paperclip size={14} /> Allega file
                    </button>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={e => setIsInternalNote(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border border-border-default bg-bg-base accent-accent-primary"
                      />
                      <span className="font-body-small text-text-secondary">Nota interna</span>
                    </label>
                  </div>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className={cn(
                      'h-9 px-4 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all',
                      replyText.trim()
                        ? 'bg-accent-primary text-bg-base hover:bg-accent-secondary'
                        : 'bg-bg-hover text-text-muted cursor-not-allowed'
                    )}
                  >
                    <Send size={14} /> Invia
                  </button>
                </div>
              </motion.div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <img src="/support-icon.svg" alt="Supporto" className="w-16 h-16 mb-4 opacity-30" />
              <p className="font-body text-text-muted">Seleziona un ticket per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>

      {/* ---- Modals ---- */}
      <AnimatePresence>
        {showNewTicket && (
          <NewTicketModal onClose={() => setShowNewTicket(false)} onCreate={handleCreateTicket} />
        )}
        {showAssign && selectedTicket && (
          <AssignModal
            ticket={selectedTicket}
            onClose={() => setShowAssign(false)}
            onAssign={handleAssign}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
