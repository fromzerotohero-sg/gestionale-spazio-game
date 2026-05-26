import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Table,
  Image,
  File,
  Search,
  Upload,
  X,
  Eye,
  Download,
  Trash2,
  Grid3X3,
  List,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CloudUpload,
  Calendar,
  Tag,
  AlertTriangle,
  Filter,
  Package,
  Wrench,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type DocumentCategory = 'DDT' | 'Fatture' | 'Manuali Tecnici' | 'Certificazioni' | 'Contratti' | 'Altro';
type FileType = 'PDF' | 'Excel' | 'Word' | 'Immagine' | 'Altro';
type SortField = 'data' | 'nome' | 'dimensione' | 'categoria';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';
type LinkedEntityType = 'inventario' | 'riparazione';

interface LinkedEntity {
  type: LinkedEntityType;
  id: string;
  name: string;
}

interface DocumentItem {
  id: string;
  filename: string;
  title: string;
  category: DocumentCategory;
  fileType: FileType;
  size: number; // bytes
  date: string; // ISO date string
  uploadedBy: string;
  uploadDate: string;
  tags: string[];
  description: string;
  linkedEntity?: LinkedEntity;
}

interface UploadFileItem {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  title: string;
  category: DocumentCategory;
  description: string;
  tags: string[];
  linkedEntity?: LinkedEntity;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const CATEGORIES: DocumentCategory[] = ['DDT', 'Fatture', 'Manuali Tecnici', 'Certificazioni', 'Contratti', 'Altro'];

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  DDT: '#EAB308',
  Fatture: '#3B82F6',
  'Manuali Tecnici': '#8B5CF6',
  Certificazioni: '#22C55E',
  Contratti: '#F97316',
  Altro: '#525252',
};

const FILE_TYPE_COLORS: Record<FileType, string> = {
  PDF: '#EF4444',
  Excel: '#22C55E',
  Word: '#3B82F6',
  Immagine: '#8B5CF6',
  Altro: '#525252',
};

const FILE_EXTENSIONS: Record<FileType, string[]> = {
  PDF: ['pdf'],
  Excel: ['xls', 'xlsx', 'csv'],
  Word: ['doc', 'docx'],
  Immagine: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  Altro: [],
};

const ALL_TAGS = ['Schede', 'Cabinet', 'Cambia Monete', 'Monitor', 'Limena', 'Manutenzione', 'Acquisto', 'Vendita', 'Garanzia'];

const EASE_SMOOTH = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ─────────────────────────────────────────────────────────────
// Sample Data
// ─────────────────────────────────────────────────────────────

const SAMPLE_DOCUMENTS: DocumentItem[] = [
  {
    id: '1',
    filename: 'Fattura_n.2025-0847_MASTER_5.pdf',
    title: 'Fattura n.2025-0847 \u2014 Acquisto schede MASTER 5',
    category: 'Fatture',
    fileType: 'PDF',
    size: 1240 * 1024,
    date: '2025-06-15',
    uploadedBy: 'Marco Rossi',
    uploadDate: '2025-06-15T10:30:00Z',
    tags: ['Schede', 'Acquisto'],
    description: 'Fattura di acquisto schede MASTER 5 per sede di Limena. Riferimento DDT 748 del 28/05/25.',
    linkedEntity: { type: 'inventario', id: 'SC-001', name: 'Scheda MASTER 5' },
  },
  {
    id: '2',
    filename: 'DDT_748_28_05_25_MAGIC_DREAMS_Global.pdf',
    title: 'DDT 748 \u2014 MAGIC DREAMS \u2014 Global',
    category: 'DDT',
    fileType: 'PDF',
    size: 1180 * 1024,
    date: '2025-05-28',
    uploadedBy: 'Luca Bianchi',
    uploadDate: '2025-05-28T14:22:00Z',
    tags: ['Schede', 'Acquisto'],
    description: 'Documento di trasporto per schede MAGIC DREAMS consegnate presso sede principale.',
    linkedEntity: { type: 'inventario', id: 'SC-002', name: 'Scheda MAGIC DREAMS Global' },
  },
  {
    id: '3',
    filename: 'Contratto_Manutenzione_Cambiamonete_APEX.pdf',
    title: 'Contratto Manutenzione Cambiamonete APEX',
    category: 'Contratti',
    fileType: 'PDF',
    size: 1560 * 1024,
    date: '2025-01-10',
    uploadedBy: 'Giulia Verdi',
    uploadDate: '2025-01-10T09:00:00Z',
    tags: ['Cambia Monete', 'Manutenzione'],
    description: 'Contratto annuale di manutenzione per cambiamonete APEX. Scadenza: 31/12/2025.',
  },
  {
    id: '4',
    filename: 'Manuale_Tecnico_Cabinet_EARTH_v2.1.pdf',
    title: 'Manuale Tecnico \u2014 Cabinet EARTH',
    category: 'Manuali Tecnici',
    fileType: 'PDF',
    size: 4680 * 1024,
    date: '2025-01-15',
    uploadedBy: 'Marco Rossi',
    uploadDate: '2025-01-15T11:45:00Z',
    tags: ['Cabinet'],
    description: 'Manuale tecnico completo per cabinet EARTH. Versione 2.1 aggiornata.',
    linkedEntity: { type: 'inventario', id: 'CB-003', name: 'Cabinet EARTH' },
  },
  {
    id: '5',
    filename: 'Certificazione_CE_SLOT_Cabinet_2025.pdf',
    title: 'Certificazione CE \u2014 SLOT Cabinet',
    category: 'Certificazioni',
    fileType: 'PDF',
    size: 2150 * 1024,
    date: '2025-02-05',
    uploadedBy: 'Anna Neri',
    uploadDate: '2025-02-05T16:20:00Z',
    tags: ['Cabinet', 'Garanzia'],
    description: 'Certificazione CE per cabinet SLOT. Validit\u00e0: fino al 2028.',
  },
  {
    id: '6',
    filename: 'Fattura_n.2025-0901_Monitor_DELL_P1917S.pdf',
    title: 'Fattura n.2025-0901 \u2014 Monitor DELL P1917S',
    category: 'Fatture',
    fileType: 'PDF',
    size: 890 * 1024,
    date: '2025-06-18',
    uploadedBy: 'Marco Rossi',
    uploadDate: '2025-06-18T08:15:00Z',
    tags: ['Monitor', 'Acquisto'],
    description: 'Fattura acquisto monitor DELL P1917S per sostituzione cabinet ES-04.',
    linkedEntity: { type: 'inventario', id: 'MN-004', name: 'Monitor DELL P1917S' },
  },
  {
    id: '7',
    filename: 'DDT_750_Accessori_Alimentatori.pdf',
    title: 'DDT 750 \u2014 Accessori Alimentatori',
    category: 'DDT',
    fileType: 'PDF',
    size: 1120 * 1024,
    date: '2025-06-02',
    uploadedBy: 'Luca Bianchi',
    uploadDate: '2025-06-02T13:40:00Z',
    tags: ['Accessori', 'Acquisto'],
    description: 'Documento di trasporto per alimentatori di ricambio.',
  },
  {
    id: '8',
    filename: 'Manuale_Tecnico_Cambiamonete_BALDAZZI.pdf',
    title: 'Manuale Tecnico \u2014 Cambiamonete BALDAZZI',
    category: 'Manuali Tecnici',
    fileType: 'PDF',
    size: 5840 * 1024,
    date: '2025-01-22',
    uploadedBy: 'Giulia Verdi',
    uploadDate: '2025-01-22T10:10:00Z',
    tags: ['Cambia Monete'],
    description: 'Manuale tecnico per cambiamonete BALDAZZI. Include schema elettrico e procedure di manutenzione.',
    linkedEntity: { type: 'inventario', id: 'CM-005', name: 'Cambiamonete BALDAZZI' },
  },
  {
    id: '9',
    filename: 'Contratto_Assistenza_Tecnica_2025.pdf',
    title: 'Contratto Assistenza Tecnica 2025',
    category: 'Contratti',
    fileType: 'PDF',
    size: 1450 * 1024,
    date: '2025-01-01',
    uploadedBy: 'Anna Neri',
    uploadDate: '2025-01-01T09:00:00Z',
    tags: ['Manutenzione', 'Garanzia'],
    description: 'Contratto di assistenza tecnica annuale per tutti i dispositivi.',
  },
  {
    id: '10',
    filename: 'Inventario_Provvisorio_31_12_2025.xlsx',
    title: 'Inventario Provvisorio 31/12/2025',
    category: 'Altro',
    fileType: 'Excel',
    size: 156 * 1024,
    date: '2025-05-31',
    uploadedBy: 'Marco Rossi',
    uploadDate: '2025-05-31T17:00:00Z',
    tags: ['Schede', 'Cabinet', 'Cambia Monete', 'Monitor'],
    description: 'Inventario provvisorio completo al 31 dicembre 2025. Include tutte le categorie.',
  },
  {
    id: '11',
    filename: 'Foto_Danno_ELEKTRA_Cabinet_07.jpg',
    title: 'Foto Danno ELEKTRA Cabinet 07',
    category: 'Altro',
    fileType: 'Immagine',
    size: 3240 * 1024,
    date: '2025-01-11',
    uploadedBy: 'Luca Bianchi',
    uploadDate: '2025-01-11T12:30:00Z',
    tags: ['Cabinet'],
    description: 'Fotografie del danno riportato dal cabinet ELEKTRA numero 07.',
    linkedEntity: { type: 'riparazione', id: 'RP-007', name: 'Riparazione Cabinet ELEKTRA 07' },
  },
  {
    id: '12',
    filename: 'DDT_749_30_05_25_LIMENA.pdf',
    title: 'DDT 749 \u2014 Consegna LIMENA',
    category: 'DDT',
    fileType: 'PDF',
    size: 1300 * 1024,
    date: '2025-05-30',
    uploadedBy: 'Luca Bianchi',
    uploadDate: '2025-05-30T15:00:00Z',
    tags: ['Limena', 'Schede'],
    description: 'Documento di trasporto per consegna materiali presso sede di Limena.',
  },
];

const INVENTORY_ITEMS = [
  { id: 'SC-001', name: 'Scheda MASTER 5', type: 'inventario' as const },
  { id: 'SC-002', name: 'Scheda MAGIC DREAMS Global', type: 'inventario' as const },
  { id: 'CB-003', name: 'Cabinet EARTH', type: 'inventario' as const },
  { id: 'MN-004', name: 'Monitor DELL P1917S', type: 'inventario' as const },
  { id: 'CM-005', name: 'Cambiamonete BALDAZZI', type: 'inventario' as const },
  { id: 'SC-006', name: 'Scheda CHAMPION BET', type: 'inventario' as const },
  { id: 'CB-007', name: 'Cabinet ELEKTRA', type: 'inventario' as const },
];

const REPAIR_ITEMS = [
  { id: 'RP-001', name: 'Riparazione Cambiamonete APEX', type: 'riparazione' as const },
  { id: 'RP-002', name: 'Riparazione Monitor LG 24MK430', type: 'riparazione' as const },
  { id: 'RP-003', name: 'Sostituzione Alimentatore Cabinet ES-04', type: 'riparazione' as const },
  { id: 'RP-004', name: 'Manutenzione Scheda CHAMPION', type: 'riparazione' as const },
  { id: 'RP-005', name: 'Riparazione Cabinet EARTH 03', type: 'riparazione' as const },
  { id: 'RP-007', name: 'Riparazione Cabinet ELEKTRA 07', type: 'riparazione' as const },
];

// ─────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr);
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getFileIcon(fileType: FileType, size = 20) {
  const color = FILE_TYPE_COLORS[fileType];
  switch (fileType) {
    case 'PDF':
      return <FileText size={size} style={{ color }} />;
    case 'Excel':
      return <Table size={size} style={{ color }} />;
    case 'Word':
      return <FileText size={size} style={{ color }} />;
    case 'Immagine':
      return <Image size={size} style={{ color }} />;
    default:
      return <File size={size} style={{ color: '#525252' }} />;
  }
}

function detectFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  for (const [type, exts] of Object.entries(FILE_EXTENSIONS)) {
    if (exts.includes(ext)) return type as FileType;
  }
  return 'Altro';
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-[#D0FF5940] text-[#D0FF59] rounded px-0.5">{part}</mark>
    ) : (
      part
    )
  );
}

const easeSmooth = EASE_SMOOTH;

// ─────────────────────────────────────────────────────────────
// Category Badge
// ─────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: DocumentCategory }) {
  const color = CATEGORY_COLORS[category];
  return (
    <span
      className="inline-flex items-center h-[22px] px-2.5 rounded font-badge border"
      style={{
        background: `linear-gradient(135deg, ${color}20, ${color}05)`,
        borderColor: `${color}40`,
        color,
      }}
    >
      {category}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function Modulistica() {
  // ── State ──────────────────────────────────────────────────
  const [documents, setDocuments] = useState<DocumentItem[]>(SAMPLE_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<DocumentCategory[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<FileType[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectMode = selectedIds.size > 0;

  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | DocumentItem[] | null>(null);

  // UI
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Debounce search ────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Computed ───────────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    let docs = [...documents];

    // Search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.filename.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }

    // Categories
    if (selectedCategories.length > 0) {
      docs = docs.filter((d) => selectedCategories.includes(d.category));
    }

    // File types
    if (selectedFileTypes.length > 0) {
      docs = docs.filter((d) => selectedFileTypes.includes(d.fileType));
    }

    // Tags
    if (selectedTags.length > 0) {
      docs = docs.filter((d) => selectedTags.some((t) => d.tags.includes(t)));
    }

    // Date range
    if (dateFrom) {
      docs = docs.filter((d) => d.date >= dateFrom);
    }
    if (dateTo) {
      docs = docs.filter((d) => d.date <= dateTo);
    }

    // Sort
    docs.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'nome':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'dimensione':
          cmp = a.size - b.size;
          break;
        case 'categoria':
          cmp = a.category.localeCompare(b.category);
          break;
        case 'data':
        default:
          cmp = a.date.localeCompare(b.date);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return docs;
  }, [documents, debouncedSearch, selectedCategories, selectedFileTypes, selectedTags, dateFrom, dateTo, sortField, sortDirection]);

  const stats = useMemo(() => {
    const total = documents.length;
    const ddt = documents.filter((d) => d.category === 'DDT').length;
    const fatture = documents.filter((d) => d.category === 'Fatture').length;
    const now = new Date();
    const thisMonth = documents.filter((d) => {
      const dt = new Date(d.date);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;
    return { total, ddt, fatture, thisMonth };
  }, [documents]);

  // ── Handlers ───────────────────────────────────────────────
  const toggleCategory = (cat: DocumentCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleFileType = (type: FileType) => {
    setSelectedFileTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map((d) => d.id)));
    }
  };

  const handleDelete = useCallback(() => {
    if (!deleteDoc) return;
    const idsToDelete = Array.isArray(deleteDoc) ? deleteDoc.map((d) => d.id) : [deleteDoc.id];
    setDocuments((prev) => prev.filter((d) => !idsToDelete.includes(d.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      idsToDelete.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteDoc(null);
  }, [deleteDoc]);

  const handleUploadComplete = useCallback((newDocs: DocumentItem[]) => {
    setDocuments((prev) => [...newDocs, ...prev]);
    setUploadOpen(false);
  }, []);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedFileTypes([]);
    setSelectedTags([]);
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  const activeFilterCount = selectedCategories.length + selectedFileTypes.length + selectedTags.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (debouncedSearch ? 1 : 0);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: easeSmooth }}
      className="flex flex-col h-full"
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeSmooth }}
        className="flex items-start justify-between mb-6"
      >
        <div>
          <p className="font-caption text-text-muted mb-1">Dashboard / Modulistica</p>
          <h1 className="font-display-lg text-text-primary">Modulistica</h1>
          <p className="font-body text-text-secondary mt-1">
            Gestione documenti, DDT, fatture e certificazioni
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-bg-elevated border border-border-subtle rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-accent-muted text-accent-primary'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-accent-muted text-accent-primary'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <List size={16} />
            </button>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="h-10 px-5 bg-accent-primary text-bg-base font-semibold hover:bg-accent-secondary hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Upload size={18} className="mr-2" />
            Carica Documento
          </Button>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: 'Documenti Totali', value: stats.total, color: '#FFFFFF' },
          { label: 'DDT', value: stats.ddt, color: '#D0FF59' },
          { label: 'Fatture', value: stats.fatture, color: '#3B82F6' },
          { label: 'Questo Mese', value: stats.thisMonth, color: '#22C55E' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 + i * 0.06, ease: easeSmooth }}
            className="bg-bg-elevated border border-border-subtle rounded-xl px-5 py-4 hover:border-border-hover transition-colors"
          >
            <p className="font-caption text-text-muted mb-2">{stat.label}</p>
            <p className="font-data-lg" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 min-h-0 gap-6">
        {/* Filter Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15, ease: easeSmooth }}
          className={cn(
            'bg-bg-elevated border border-border-subtle rounded-xl flex-shrink-0 overflow-y-auto transition-all duration-300',
            sidebarCollapsed ? 'w-[52px] px-2 py-4' : 'w-[260px] p-5'
          )}
          style={{ maxHeight: 'calc(100vh - 300px)' }}
        >
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="w-9 h-9 rounded-lg bg-bg-surface border border-border-default flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-hover transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <Filter size={16} className="text-text-muted" />
              <Search size={16} className="text-text-muted" />
              <Tag size={16} className="text-text-muted" />
              <Calendar size={16} className="text-text-muted" />
              <FileText size={16} className="text-text-muted" />
            </div>
          ) : (
            <>
              {/* Sidebar Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading-3 text-text-primary">Filtri</h3>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="w-7 h-7 rounded-md hover:bg-bg-hover flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>

              {/* Search in sidebar */}
              <div className="mb-5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Cerca documenti..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-8 pr-7 bg-bg-surface border-border-default text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:ring-accent-primary text-sm rounded-md"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Categoria */}
              <div className="mb-5">
                <p className="font-caption text-text-muted mb-3">CATEGORIA</p>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => {
                    const count = documents.filter((d) => d.category === cat).length;
                    return (
                      <label
                        key={cat}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <Checkbox
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={() => toggleCategory(cat)}
                          className="border-border-default data-[state=checked]:bg-accent-primary data-[state=checked]:text-bg-base data-[state=checked]:border-accent-primary"
                        />
                        <span
                          className={cn(
                            'font-body-small transition-colors',
                            selectedCategories.includes(cat) ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'
                          )}
                        >
                          {cat}
                        </span>
                        <span className="font-caption text-text-muted ml-auto">{count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Data */}
              <div className="mb-5">
                <p className="font-caption text-text-muted mb-3">DATA</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted text-xs w-6">Da</span>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-8 flex-1 bg-bg-surface border-border-default text-text-primary text-xs focus:border-accent-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted text-xs w-6">A</span>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-8 flex-1 bg-bg-surface border-border-default text-text-primary text-xs focus:border-accent-primary"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(['Oggi', 'Settimana', 'Mese', 'Anno'] as const).map((preset) => {
                    const now = new Date();
                    let from = '';
                    switch (preset) {
                      case 'Oggi':
                        from = now.toISOString().split('T')[0];
                        break;
                      case 'Settimana': {
                        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        from = d.toISOString().split('T')[0];
                        break;
                      }
                      case 'Mese': {
                        const d = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        from = d.toISOString().split('T')[0];
                        break;
                      }
                      case 'Anno':
                        from = `${now.getFullYear()}-01-01`;
                        break;
                    }
                    const isActive = dateFrom === from;
                    return (
                      <button
                        key={preset}
                        onClick={() => {
                          if (isActive) {
                            setDateFrom('');
                            setDateTo('');
                          } else {
                            setDateFrom(from);
                            setDateTo(now.toISOString().split('T')[0]);
                          }
                        }}
                        className={cn(
                          'text-xs px-2 py-1 rounded transition-colors',
                          isActive ? 'text-accent-primary bg-accent-muted' : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                        )}
                      >
                        {preset === 'Oggi' ? 'Oggi' : `Ultim${preset === 'Settimana' ? 'a' : 'o'} ${preset.toLowerCase()}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tipo File */}
              <div className="mb-5">
                <p className="font-caption text-text-muted mb-3">TIPO FILE</p>
                <div className="space-y-2">
                  {(['PDF', 'Excel', 'Word', 'Immagine', 'Altro'] as FileType[]).map((ft) => {
                    const count = documents.filter((d) => d.fileType === ft).length;
                    return (
                      <label key={ft} className="flex items-center gap-2.5 cursor-pointer group">
                        <Checkbox
                          checked={selectedFileTypes.includes(ft)}
                          onCheckedChange={() => toggleFileType(ft)}
                          className="border-border-default data-[state=checked]:bg-accent-primary data-[state=checked]:text-bg-base data-[state=checked]:border-accent-primary"
                        />
                        {getFileIcon(ft, 14)}
                        <span
                          className={cn(
                            'font-body-small transition-colors',
                            selectedFileTypes.includes(ft) ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'
                          )}
                        >
                          {ft}
                        </span>
                        <span className="font-caption text-text-muted ml-auto">{count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="mb-4">
                <p className="font-caption text-text-muted mb-3">TAG</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TAGS.map((tag) => {
                    const isActive = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          'h-7 px-2.5 rounded-md font-body-small text-xs border transition-all',
                          isActive
                            ? 'bg-accent-muted border-[#D0FF5940] text-accent-primary'
                            : 'bg-transparent border-border-default text-text-muted hover:border-border-hover hover:text-text-secondary'
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full text-text-muted hover:text-text-primary"
                >
                  <X size={14} className="mr-1" />
                  Cancella filtri ({activeFilterCount})
                </Button>
              )}
            </>
          )}
        </motion.aside>

        {/* Document Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between h-12 border-b border-border-subtle mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="font-caption text-text-muted">
                Mostrando {filteredDocs.length} di {documents.length} documenti
              </span>
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {selectedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 h-6 px-2 rounded bg-accent-muted text-accent-primary text-xs font-body-small border border-[#D0FF5940]"
                    >
                      {cat}
                      <button onClick={() => toggleCategory(cat)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 h-6 px-2 rounded bg-accent-muted text-accent-primary text-xs font-body-small border border-[#D0FF5940]"
                    >
                      {tag}
                      <button onClick={() => toggleTag(tag)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, dir] = e.target.value.split('-');
                    setSortField(field as SortField);
                    setSortDirection(dir as SortDirection);
                  }}
                  className="h-8 pl-3 pr-8 bg-bg-surface border border-border-default rounded-md font-body-small text-text-primary text-xs appearance-none cursor-pointer hover:border-border-hover focus:border-accent-primary focus:outline-none"
                >
                  <option value="data-desc">Data: Recenti</option>
                  <option value="data-asc">Data: Meno recenti</option>
                  <option value="nome-asc">Nome: A-Z</option>
                  <option value="nome-desc">Nome: Z-A</option>
                  <option value="dimensione-desc">Dimensione: Grande</option>
                  <option value="dimensione-asc">Dimensione: Piccola</option>
                  <option value="categoria-asc">Categoria: A-Z</option>
                  <option value="categoria-desc">Categoria: Z-A</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>

              {/* View toggle */}
              <div className="flex items-center bg-bg-surface border border-border-default rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-l-md transition-colors',
                    viewMode === 'grid' ? 'bg-accent-muted text-accent-primary' : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  <Grid3X3 size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-r-md transition-colors',
                    viewMode === 'list' ? 'bg-accent-muted text-accent-primary' : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  <List size={14} />
                </button>
              </div>

              {/* Select all (list view only) */}
              {viewMode === 'list' && (
                <label className="flex items-center gap-1.5 ml-1 cursor-pointer">
                  <Checkbox
                    checked={filteredDocs.length > 0 && selectedIds.size === filteredDocs.length}
                    onCheckedChange={selectAll}
                    className="border-border-default data-[state=checked]:bg-accent-primary data-[state=checked]:text-bg-base data-[state=checked]:border-accent-primary"
                  />
                  <span className="font-body-small text-text-muted text-xs">Tutti</span>
                </label>
              )}
            </div>
          </div>

          {/* Document Display */}
          {filteredDocs.length === 0 ? (
            <EmptyState onClearFilters={clearFilters} />
          ) : viewMode === 'grid' ? (
            <DocumentGrid
              docs={filteredDocs}
              selectedIds={selectedIds}
              selectMode={selectMode}
              onToggleSelect={toggleSelect}
              onPreview={setPreviewDoc}
              searchQuery={debouncedSearch}
            />
          ) : (
            <DocumentList
              docs={filteredDocs}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onPreview={setPreviewDoc}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
              searchQuery={debouncedSearch}
            />
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.25, ease: easeSmooth }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-bg-surface border border-border-default rounded-xl px-5 py-3 shadow-xl"
          >
            <span className="font-body-small text-text-secondary">
              <strong className="text-text-primary">{selectedIds.size}</strong> documenti selezionati
            </span>
            <div className="w-px h-5 bg-border-subtle" />
            <button
              onClick={() => {
                const docs = documents.filter((d) => selectedIds.has(d.id));
                setDeleteDoc(docs);
              }}
              className="flex items-center gap-1.5 font-body-small text-status-rosso hover:text-status-rosso/80 transition-colors"
            >
              <Trash2 size={14} />
              Elimina
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-1.5 font-body-small text-text-muted hover:text-text-secondary transition-colors"
            >
              <X size={14} />
              Deseleziona
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} onComplete={handleUploadComplete} />

      {/* Preview Modal */}
      <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} onDelete={setDeleteDoc} />

      {/* Delete Confirmation */}
      <DeleteDialog
        doc={deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: easeSmooth }}
      className="flex flex-col items-center justify-center py-20"
    >
      <img src="/empty-state.svg" alt="Nessun documento" className="w-32 h-32 mb-4 opacity-50" />
      <p className="font-body text-text-secondary mb-2">Nessun documento trovato</p>
      <p className="font-body-small text-text-muted mb-4 text-center max-w-sm">
        Prova a modificare i filtri o la ricerca per trovare ci\u00f2 che cerchi.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className="border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover"
      >
        Cancella filtri
      </Button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Document Grid
// ─────────────────────────────────────────────────────────────

function DocumentGrid({
  docs,
  selectedIds,
  selectMode,
  onToggleSelect,
  onPreview,
  searchQuery,
}: {
  docs: DocumentItem[];
  selectedIds: Set<string>;
  selectMode: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (doc: DocumentItem) => void;
  searchQuery: string;
}) {
  return (
    <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
      <AnimatePresence mode="popLayout">
        {docs.map((doc, i) => {
          const isSelected = selectedIds.has(doc.id);
          return (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4), ease: easeSmooth }}
              className={cn(
                'group relative bg-bg-elevated border rounded-xl overflow-hidden transition-colors cursor-pointer',
                isSelected
                  ? 'border-accent-primary bg-[#D0FF5908]'
                  : 'border-border-subtle hover:border-border-hover'
              )}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.action-btn')) return;
                if (selectMode || isSelected) {
                  onToggleSelect(doc.id);
                } else {
                  onPreview(doc);
                }
              }}
            >
              {/* Checkbox */}
              <div
                className={cn(
                  'absolute top-2 left-2 z-10 transition-opacity',
                  isSelected || selectMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(doc.id);
                }}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-accent-primary border-accent-primary text-bg-base'
                      : 'border-border-default bg-bg-elevated/80 hover:border-accent-primary'
                  )}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </div>

              {/* Preview Area */}
              <div className="relative h-[140px] bg-bg-surface flex items-center justify-center overflow-hidden">
                {getFileIcon(doc.fileType, 48)}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-[#00000080] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 action-btn">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(doc);
                    }}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <Download size={18} />
                  </button>
                </div>

                {/* File type badge */}
                <span
                  className="absolute top-2 right-2 font-badge text-[9px] px-1.5 py-0.5 rounded bg-bg-elevated/80 border border-border-subtle"
                  style={{ color: FILE_TYPE_COLORS[doc.fileType] }}
                >
                  {doc.fileType}
                </span>
              </div>

              {/* Info Area */}
              <div className="p-3.5 space-y-2">
                <p className="font-body-small text-text-primary truncate" title={doc.title}>
                  {searchQuery ? highlightMatch(doc.title, searchQuery) : doc.title}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <CategoryBadge category={doc.category} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-caption text-text-muted">{formatDate(doc.date)}</span>
                  <span className="font-caption text-text-muted">{formatFileSize(doc.size)}</span>
                </div>
                {doc.linkedEntity && (
                  <div className="flex items-center gap-1.5 pt-0.5 border-t border-border-subtle">
                    {doc.linkedEntity.type === 'inventario' ? (
                      <Package size={10} className="text-accent-primary" />
                    ) : (
                      <Wrench size={10} className="text-status-giallo" />
                    )}
                    <span className="font-body-small text-text-muted truncate text-[10px]">
                      {doc.linkedEntity.name}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Document List (Table View)
// ─────────────────────────────────────────────────────────────

function DocumentList({
  docs,
  selectedIds,
  onToggleSelect,
  onPreview,
  sortField,
  sortDirection,
  onSort,
  searchQuery,
}: {
  docs: DocumentItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onPreview: (doc: DocumentItem) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  searchQuery: string;
}) {
  const headers: { field: SortField; label: string; width?: string }[] = [
    { field: 'nome', label: 'Nome' },
    { field: 'categoria', label: 'Categoria', width: '140px' },
    { field: 'data', label: 'Data', width: '120px' },
    { field: 'dimensione', label: 'Dimensione', width: '100px' },
  ];

  return (
    <div className="bg-bg-elevated border border-border-subtle rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center h-12 bg-bg-surface border-b border-border-subtle px-4">
        <div className="w-10 flex-shrink-0" />
        {headers.map((h) => (
          <button
            key={h.field}
            onClick={() => onSort(h.field)}
            className={cn(
              'flex items-center gap-1 font-caption text-text-muted hover:text-text-secondary transition-colors text-left',
              h.width ? `w-[${h.width}] flex-shrink-0` : 'flex-1 min-w-0'
            )}
            style={h.width ? { width: h.width, flexShrink: 0 } : { flex: 1, minWidth: 0 }}
          >
            {h.label}
            {sortField === h.field && (
              <ChevronDown
                size={12}
                className={cn('transition-transform', sortDirection === 'asc' && 'rotate-180')}
              />
            )}
          </button>
        ))}
        <div className="w-[100px] flex-shrink-0 font-caption text-text-muted text-right">Azioni</div>
      </div>

      {/* Rows */}
      <AnimatePresence mode="popLayout">
        {docs.map((doc, i) => {
          const isSelected = selectedIds.has(doc.id);
          return (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
              className={cn(
                'flex items-center h-12 px-4 border-b border-border-subtle/50 transition-colors group cursor-pointer',
                isSelected
                  ? 'bg-[#D0FF5908] border-l-[3px] border-l-accent-primary'
                  : 'hover:bg-bg-hover border-l-[3px] border-l-transparent'
              )}
              onClick={() => onPreview(doc)}
            >
              <div className="w-10 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(doc.id)}
                  className="border-border-default data-[state=checked]:bg-accent-primary data-[state=checked]:text-bg-base data-[state=checked]:border-accent-primary"
                />
              </div>

              <div className="flex-1 min-w-0 flex items-center gap-2.5 pr-4">
                {getFileIcon(doc.fileType, 16)}
                <span className="font-body text-text-primary truncate">
                  {searchQuery ? highlightMatch(doc.title, searchQuery) : doc.title}
                </span>
                {doc.linkedEntity && (
                  <span className="flex items-center gap-1 flex-shrink-0">
                    {doc.linkedEntity.type === 'inventario' ? (
                      <Package size={10} className="text-accent-primary" />
                    ) : (
                      <Wrench size={10} className="text-status-giallo" />
                    )}
                  </span>
                )}
              </div>

              <div className="w-[140px] flex-shrink-0">
                <CategoryBadge category={doc.category} />
              </div>

              <div className="w-[120px] flex-shrink-0 font-caption text-text-muted">
                {formatDate(doc.date)}
              </div>

              <div className="w-[100px] flex-shrink-0 font-mono text-xs text-text-muted">
                {formatFileSize(doc.size)}
              </div>

              <div className="w-[100px] flex-shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity action-btn">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(doc);
                  }}
                  className="w-7 h-7 rounded-md hover:bg-bg-hover flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-7 h-7 rounded-md hover:bg-bg-hover flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                >
                  <Download size={14} />
                </button>

              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Upload Modal
// ─────────────────────────────────────────────────────────────

function UploadModal({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onComplete: (docs: DocumentItem[]) => void;
}) {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setFiles([]);
    }
  }, [open]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: UploadFileItem[] = Array.from(fileList)
      .slice(0, 5 - files.length)
      .map((file) => ({
        file,
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        progress: 0,
        status: 'pending',
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: 'Altro',
        description: '',
        tags: [],
      }));
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFile = (id: string, updates: Partial<UploadFileItem>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const simulateUpload = async () => {
    setStep(3);

    // Simulate progress for each file
    for (const fileItem of files) {
      updateFile(fileItem.id, { status: 'uploading', progress: 0 });

      // Simulate progress steps
      for (let p = 0; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 150));
        updateFile(fileItem.id, { progress: p });
      }

      updateFile(fileItem.id, { status: 'done', progress: 100 });
    }

    // Create document items
    await new Promise((r) => setTimeout(r, 400));

    const now = new Date();
    const newDocs: DocumentItem[] = files.map((f) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      filename: f.file.name,
      title: f.title || f.file.name.replace(/\.[^/.]+$/, ''),
      category: f.category,
      fileType: detectFileType(f.file.name),
      size: f.file.size,
      date: now.toISOString().split('T')[0],
      uploadedBy: 'Marco Rossi',
      uploadDate: now.toISOString(),
      tags: f.tags,
      description: f.description,
      linkedEntity: f.linkedEntity,
    }));

    onComplete(newDocs);
    setFiles([]);
  };

  const canProceed = files.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bg-surface border-border-default text-text-primary max-w-[560px] p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-subtle">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-heading-2 text-text-primary">Carica Documento</DialogTitle>
          </DialogHeader>

          {/* Steps */}
          <div className="flex items-center gap-2">
            {[
              { num: 1, label: 'Seleziona' },
              { num: 2, label: 'Dettagli' },
              { num: 3, label: 'Conferma' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center font-body-small text-xs font-semibold transition-colors',
                      step === s.num
                        ? 'bg-accent-primary text-bg-base'
                        : step > s.num
                          ? 'bg-status-verde text-white'
                          : 'bg-bg-hover text-text-muted'
                    )}
                  >
                    {step > s.num ? <Check size={14} /> : s.num}
                  </div>
                  <span
                    className={cn(
                      'font-body-small text-xs transition-colors',
                      step === s.num ? 'text-accent-primary' : step > s.num ? 'text-status-verde' : 'text-text-muted'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div className={cn('flex-1 h-px transition-colors', step > s.num ? 'bg-status-verde' : 'bg-border-subtle')} />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: File Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: easeSmooth }}
              >
                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors mb-4',
                    isDragging
                      ? 'border-accent-primary bg-[#D0FF5908]'
                      : 'border-border-default bg-bg-elevated hover:border-border-hover'
                  )}
                >
                  <CloudUpload
                    size={48}
                    className={cn('mb-3 transition-colors', isDragging ? 'text-accent-primary' : 'text-text-muted')}
                  />
                  <p className="font-body-small text-text-secondary text-center px-8">
                    Trascina i file qui o clicca per selezionare
                  </p>
                  <p className="font-caption text-text-muted mt-1">PDF, Excel, Word, Immagini fino a 50 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>

                {/* File List */}
                <AnimatePresence>
                  {files.map((f) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 py-2 border-b border-border-subtle"
                    >
                      {getFileIcon(detectFileType(f.file.name), 16)}
                      <div className="flex-1 min-w-0">
                        <p className="font-body-small text-text-primary truncate">{f.file.name}</p>
                        <p className="font-caption text-text-muted">{formatFileSize(f.file.size)}</p>
                      </div>
                      <button
                        onClick={() => removeFile(f.id)}
                        className="w-7 h-7 rounded-md hover:bg-bg-hover flex items-center justify-center text-text-muted hover:text-status-rosso transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {files.length > 0 && (
                  <p className="font-caption text-text-muted mt-2">
                    {files.length}/5 file selezionati
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 2: Document Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: easeSmooth }}
                className="space-y-4"
              >
                {files.map((f) => (
                  <div key={f.id} className="space-y-3 pb-4 border-b border-border-subtle last:border-0">
                    {files.length > 1 && (
                      <p className="font-body-small text-text-muted mb-2">
                        {getFileIcon(detectFileType(f.file.name), 14)}
                        <span className="ml-2">{f.file.name}</span>
                      </p>
                    )}

                    <div>
                      <label className="font-body-small text-text-secondary mb-1 block">
                        Nome <span className="text-status-rosso">*</span>
                      </label>
                      <Input
                        value={f.title}
                        onChange={(e) => updateFile(f.id, { title: e.target.value })}
                        className="h-9 bg-bg-elevated border-border-default text-text-primary focus:border-accent-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-body-small text-text-secondary mb-1 block">
                          Categoria <span className="text-status-rosso">*</span>
                        </label>
                        <select
                          value={f.category}
                          onChange={(e) => updateFile(f.id, { category: e.target.value as DocumentCategory })}
                          className="w-full h-9 px-2.5 bg-bg-elevated border border-border-default rounded-md font-body-small text-text-primary text-xs appearance-none focus:border-accent-primary focus:outline-none"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-body-small text-text-secondary mb-1 block">
                          Collega a
                        </label>
                        <select
                          value={f.linkedEntity ? `${f.linkedEntity.type}-${f.linkedEntity.id}` : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              updateFile(f.id, { linkedEntity: undefined });
                              return;
                            }
                            const [type, id] = val.split('-');
                            const item = type === 'inventario'
                              ? INVENTORY_ITEMS.find((i) => i.id === id)
                              : REPAIR_ITEMS.find((i) => i.id === id);
                            if (item) {
                              updateFile(f.id, {
                                linkedEntity: { type: item.type, id: item.id, name: item.name },
                              });
                            }
                          }}
                          className="w-full h-9 px-2.5 bg-bg-elevated border border-border-default rounded-md font-body-small text-text-primary text-xs appearance-none focus:border-accent-primary focus:outline-none"
                        >
                          <option value="">Nessuno</option>
                          <optgroup label="Inventario">
                            {INVENTORY_ITEMS.map((item) => (
                              <option key={item.id} value={`inventario-${item.id}`}>
                                {item.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Riparazioni">
                            {REPAIR_ITEMS.map((item) => (
                              <option key={item.id} value={`riparazione-${item.id}`}>
                                {item.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-body-small text-text-secondary mb-1 block">Note</label>
                      <textarea
                        value={f.description}
                        onChange={(e) => updateFile(f.id, { description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-md font-body-small text-text-primary text-xs placeholder:text-text-muted focus:border-accent-primary focus:outline-none resize-none"
                        placeholder="Aggiungi una descrizione..."
                      />
                    </div>
                  </div>
                ))}

                {/* Tags for all */}
                <div>
                  <label className="font-body-small text-text-secondary mb-2 block">Tag</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TAGS.map((tag) => {
                      const isUsed = files.some((f) => f.tags.includes(tag));
                      return (
                        <button
                          key={tag}
                          onClick={() => {
                            setFiles((prev) =>
                              prev.map((f) =>
                                f.tags.includes(tag)
                                  ? { ...f, tags: f.tags.filter((t) => t !== tag) }
                                  : { ...f, tags: [...f.tags, tag] }
                              )
                            );
                          }}
                          className={cn(
                            'h-7 px-2.5 rounded-md font-body-small text-xs border transition-all',
                            isUsed
                              ? 'bg-accent-muted border-[#D0FF5940] text-accent-primary'
                              : 'bg-transparent border-border-default text-text-muted hover:border-border-hover'
                          )}
                        >
                          {isUsed && <Check size={10} className="inline mr-1" />}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: easeSmooth }}
                className="space-y-4"
              >
                {files.map((f) => (
                  <div key={f.id} className="bg-bg-elevated border border-border-subtle rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      {getFileIcon(detectFileType(f.file.name), 20)}
                      <div className="flex-1 min-w-0">
                        <p className="font-body-small text-text-primary truncate">{f.title}</p>
                        <p className="font-caption text-text-muted">
                          {f.file.name} \u2014 {formatFileSize(f.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CategoryBadge category={f.category} />
                      {f.linkedEntity && (
                        <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-bg-surface border border-border-subtle font-caption text-[9px] text-text-muted">
                          {f.linkedEntity.type === 'inventario' ? <Package size={9} /> : <Wrench size={9} />}
                          {f.linkedEntity.name}
                        </span>
                      )}
                    </div>
                    {f.status === 'uploading' && (
                      <div className="space-y-1">
                        <Progress value={f.progress} className="h-1" />
                        <p className="font-caption text-text-muted">{f.progress}%</p>
                      </div>
                    )}
                    {f.status === 'done' && (
                      <div className="flex items-center gap-1.5 text-status-verde">
                        <Check size={14} />
                        <span className="font-body-small text-xs">Completato</span>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between">
          {step < 3 ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  if (step === 1) {
                    onOpenChange(false);
                  } else {
                    setStep(step - 1);
                  }
                }}
                className="text-text-muted hover:text-text-primary"
              >
                {step === 1 ? 'Annulla' : 'Indietro'}
              </Button>
              <Button
                onClick={() => {
                  if (step === 2) {
                    simulateUpload();
                  } else {
                    setStep(step + 1);
                  }
                }}
                disabled={!canProceed}
                className="bg-accent-primary text-bg-base font-semibold hover:bg-accent-secondary disabled:opacity-40"
              >
                {step === 2 ? `Carica ${files.length} Documenti` : 'Avanti'}
              </Button>
            </>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              {files.every((f) => f.status === 'done') ? (
                <span className="flex items-center gap-1.5 text-status-verde font-body-small">
                  <Check size={16} />
                  Caricamento completato
                </span>
              ) : (
                <span className="font-caption text-text-muted">Caricamento in corso...</span>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Preview Modal
// ─────────────────────────────────────────────────────────────

function PreviewModal({
  doc,
  onClose,
  onDelete,
}: {
  doc: DocumentItem | null;
  onClose: () => void;
  onDelete: (doc: DocumentItem) => void;
}) {
  if (!doc) return null;

  return (
    <Dialog open={!!doc} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-bg-surface border-border-default text-text-primary max-w-[900px] w-[85vw] h-[80vh] p-0 overflow-hidden gap-0 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="font-heading-2 text-text-primary truncate" title={doc.title}>
              {doc.title}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <CategoryBadge category={doc.category} />
              <span
                className="font-badge text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated border border-border-subtle"
                style={{ color: FILE_TYPE_COLORS[doc.fileType] }}
              >
                {doc.fileType}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left: Preview */}
          <div className="flex-1 bg-bg-base flex items-center justify-center overflow-auto">
            {doc.fileType === 'Immagine' ? (
              <div className="flex flex-col items-center">
                {getFileIcon(doc.fileType, 80)}
                <p className="font-body-small text-text-muted mt-4">Anteprima immagine</p>
              </div>
            ) : doc.fileType === 'PDF' ? (
              <div className="flex flex-col items-center">
                <FileText size={80} className="text-status-rosso" />
                <p className="font-body-small text-text-muted mt-4">Visualizzatore PDF</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center px-8">
                {getFileIcon(doc.fileType, 64)}
                <p className="font-body text-text-secondary mt-4 mb-1">Anteprima non disponibile</p>
                <p className="font-body-small text-text-muted">
                  Scarica il file per visualizzarlo
                </p>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="w-[280px] flex-shrink-0 bg-bg-elevated border-l border-border-subtle p-5 overflow-y-auto">
            <div className="space-y-4">
              {/* Info grid */}
              <div>
                <p className="font-caption text-text-muted mb-3">DETTAGLI</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Tipo', value: doc.fileType },
                    { label: 'Dimensione', value: formatFileSize(doc.size) },
                    { label: 'Data Documento', value: formatDate(doc.date) },
                    { label: 'Caricato da', value: doc.uploadedBy },
                    { label: 'Data caricamento', value: formatDateTime(doc.uploadDate) },
                    { label: 'Filename', value: doc.filename },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="font-body-small text-text-muted">{item.label}</span>
                      <span className="font-body-small text-text-primary text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {doc.tags.length > 0 && (
                <div>
                  <p className="font-caption text-text-muted mb-2">TAG</p>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="h-6 px-2 rounded bg-bg-surface border border-border-subtle font-body-small text-[10px] text-text-muted flex items-center"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {doc.description && (
                <div>
                  <p className="font-caption text-text-muted mb-2">NOTE</p>
                  <p className="font-body-small text-text-secondary leading-relaxed">
                    {doc.description}
                  </p>
                </div>
              )}

              {/* Linked Entity */}
              {doc.linkedEntity && (
                <div>
                  <p className="font-caption text-text-muted mb-2">COLLEGATO A</p>
                  <div className="bg-bg-surface border border-border-subtle rounded-lg p-3 flex items-center gap-2.5">
                    {doc.linkedEntity.type === 'inventario' ? (
                      <Package size={16} className="text-accent-primary" />
                    ) : (
                      <Wrench size={16} className="text-status-giallo" />
                    )}
                    <div className="min-w-0">
                      <p className="font-body-small text-text-primary truncate">{doc.linkedEntity.name}</p>
                      <p className="font-caption text-text-muted">
                        {doc.linkedEntity.type === 'inventario' ? 'Inventario' : 'Riparazione'} \u2014 {doc.linkedEntity.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-border-subtle space-y-2">
                <Button className="w-full h-10 bg-accent-primary text-bg-base font-semibold hover:bg-accent-secondary">
                  <Download size={16} className="mr-2" />
                  Scarica
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-10 border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                >
                  Modifica
                </Button>
                <button
                  onClick={() => {
                    onClose();
                    onDelete(doc);
                  }}
                  className="w-full h-10 flex items-center justify-center font-body-small text-status-rosso hover:text-status-rosso/80 transition-colors"
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Delete Dialog
// ─────────────────────────────────────────────────────────────

function DeleteDialog({
  doc,
  onClose,
  onConfirm,
}: {
  doc: DocumentItem | DocumentItem[] | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!doc) return null;

  const isBulk = Array.isArray(doc);
  const count = isBulk ? doc.length : 1;
  const name = isBulk ? '' : doc.title;

  return (
    <Dialog open={!!doc} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-bg-surface border-border-default text-text-primary max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-status-rosso/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-status-rosso" />
            </div>
            <div>
              <DialogTitle className="font-heading-2 text-text-primary">
                {isBulk ? `Elimina ${count} documenti` : 'Elimina documento'}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-text-secondary mt-3">
            {isBulk
              ? `Sei sicuro di voler eliminare ${count} documenti? Questa azione non pu\u00f2 essere annullata.`
              : `Sei sicuro di voler eliminare "${name}"? Questa azione non pu\u00f2 essere annullata.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          >
            Annulla
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-status-rosso text-white hover:bg-status-rosso/90"
          >
            <Trash2 size={14} className="mr-1.5" />
            Elimina
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
