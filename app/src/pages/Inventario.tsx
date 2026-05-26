import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  Search,
  Download,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Filter,
  Cpu,
  Box,
  Banknote,
  Puzzle,
  MonitorIcon,
  Grid2x2,
  Eye,
  EyeOff,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { type Category, type Sede, GRADI, SEDI } from '@/data/inventory';
import { OPERATORS, getStoredOperatore, setStoredOperatore, type Operatore } from '@/data/operators';
import {
  formatAbsoluteDateTime,
  formatRelativeTime,
  inventoryUpdateToast,
  resolveQuantityAction,
} from '@/lib/inventory-tracking';
import {
  useCreateInventoryItem,
  useDeleteInventoryItems,
  useInventoryItems,
  useUpdateInventoryItem,
} from '@/hooks/use-inventory';
import { nextInventoryId } from '@/lib/inventory-api';
import type { UnifiedItem } from '@/types/inventory';
import { Spinner } from '@/components/ui/spinner';

type EditingCell = { rowId: string; columnId: string } | null;

// ─── Animation variants ────────────────────────────────────
const easeSmooth = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: easeSmooth },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.03 } },
};

const rowVariant = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8, transition: { duration: 0.15 } },
};

const SEDE_COLORS: Record<string, string> = {
  'Magazzino Principale': 'bg-status-blu/15 text-status-blu border-status-blu/30',
  'Limena': 'bg-status-arancione/15 text-status-arancione border-status-arancione/30',
  'Magazzino Angelo': 'bg-status-viola/15 text-status-viola border-status-viola/30',
};

const GRADO_COLORS: Record<string, string> = {
  A: 'bg-status-verde/15 text-status-verde border-status-verde/30',
  B: 'bg-status-giallo/15 text-status-giallo border-status-giallo/30',
  C: 'bg-status-rosso/15 text-status-rosso border-status-rosso/30',
};

// ─── Sede Badge ────────────────────────────────────────────
function SedeBadge({ sede }: { sede: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded font-badge border',
      SEDE_COLORS[sede] || 'bg-bg-hover text-text-muted border-border-default'
    )}>
      {sede}
    </span>
  );
}

// ─── Grado Badge ───────────────────────────────────────────
function GradoBadge({ grado }: { grado: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded font-badge border',
      GRADO_COLORS[grado] || 'bg-bg-hover text-text-muted border-border-default'
    )}>
      {grado}
    </span>
  );
}

// ─── Empty State ───────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: easeSmooth }}
      className="flex flex-col items-center justify-center py-16"
    >
      <img src="/empty-state.svg" alt="Nessun risultato" className="w-[120px] h-[120px] mb-4 opacity-60" />
      <h3 className="font-heading-3 text-text-secondary mb-1">Nessun articolo trovato</h3>
      <p className="font-body-small text-text-muted mb-4">Prova a modificare i filtri di ricerca</p>
      <Button variant="outline" onClick={onReset}>
        Resetta Filtri
      </Button>
    </motion.div>
  );
}

// ─── Export CSV ────────────────────────────────────────────
function exportToCSV(items: UnifiedItem[], filename: string) {
  const headers = ['ID', 'Nome', 'Categoria', 'Quantita', 'Prezzo Unitario', 'Totale', 'Note', 'Sede'];
  const rows = items.map((i) => [
    i.id, i.nome, i.categoria, i.quantita, i.prezzoUnitario, i.totale, i.note, i.sede,
  ]);
  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Esportazione completata');
}

function LastModifiedCell({ item }: { item: UnifiedItem }) {
  if (!item.updatedAt) {
    return <span className="font-caption text-text-muted">Mai aggiornato</span>;
  }
  return (
    <div className="flex flex-col gap-0.5" title={formatAbsoluteDateTime(item.updatedAt)}>
      <span className="inline-flex items-center gap-1 font-caption text-text-secondary">
        <Clock size={11} className="text-text-muted shrink-0" />
        {formatRelativeTime(item.updatedAt)}
      </span>
      <span className="font-caption text-text-muted truncate max-w-[130px]">
        {item.lastModifiedBy ?? 'Operatore non registrato'}
      </span>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────
function StatusBadge({ label, variant }: { label: string; variant: 'sede' | 'grado' | 'tipo' }) {
  if (variant === 'sede') return <SedeBadge sede={label} />;
  if (variant === 'grado') return <GradoBadge grado={label} />;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded font-badge bg-bg-hover text-text-secondary border border-border-default">
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Inventario() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('categoria') as Category | 'tutti' | null;
  const [activeTab, setActiveTab] = useState<Category | 'tutti'>(tabFromUrl || 'tutti');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterQtyMin, setFilterQtyMin] = useState('');
  const [filterQtyMax, setFilterQtyMax] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterGrado, setFilterGrado] = useState('');
  const [filterSede, setFilterSede] = useState('');

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UnifiedItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<UnifiedItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Inline editing
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState('');

  // Column visibility
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [showColMenu, setShowColMenu] = useState(false);
  const [operatore, setOperatore] = useState<Operatore | null>(() => getStoredOperatore());

  const { data: items = [], isLoading, isError, error } = useInventoryItems();
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItems = useDeleteInventoryItems();

  useEffect(() => {
    if (operatore) setStoredOperatore(operatore);
  }, [operatore]);

  function requireOperatore(): Operatore | null {
    if (operatore) return operatore;
    toast.error('Seleziona il tuo nome in alto prima di modificare l\'inventario', { duration: 5000 });
    return null;
  }

  const tabs = useMemo(() => {
    const sum = (cat?: Category) =>
      items
        .filter((i) => !cat || i.categoria === cat)
        .reduce((s, i) => s + i.totale, 0);
    const count = (cat?: Category) =>
      items.filter((i) => !cat || i.categoria === cat).length;
    return [
      { key: 'tutti' as const, label: 'Tutti', icon: Grid2x2, count: count(), value: sum() },
      { key: 'schede' as const, label: 'Schede', icon: Cpu, count: count('schede'), value: sum('schede') },
      { key: 'cabinet' as const, label: 'Cabinet', icon: Box, count: count('cabinet'), value: sum('cabinet') },
      { key: 'cambiamonete' as const, label: 'Cambia Monete', icon: Banknote, count: count('cambiamonete'), value: sum('cambiamonete') },
      { key: 'accessori' as const, label: 'Accessori', icon: Puzzle, count: count('accessori'), value: sum('accessori') },
      { key: 'monitor' as const, label: 'Monitor', icon: MonitorIcon, count: count('monitor'), value: sum('monitor') },
    ];
  }, [items]);

  // Sync tab with URL
  useEffect(() => {
    const t = searchParams.get('categoria') as Category | 'tutti' | null;
    if (t && tabs.find((tab) => tab.key === t)) {
      setActiveTab(t);
    }
  }, [searchParams, tabs]);

  const handleTabChange = useCallback((tab: Category | 'tutti') => {
    setActiveTab(tab);
    setSearchParams({ categoria: tab });
    setRowSelection({});
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [setSearchParams]);

  // ─── Filter logic ────────────────────────────────────────
  const filteredData = useMemo(() => {
    let data = activeTab === 'tutti' ? items : items.filter((i) => i.categoria === activeTab);

    // Global search
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      data = data.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.nome.toLowerCase().includes(q) ||
          i.note.toLowerCase().includes(q) ||
          i.sede.toLowerCase().includes(q) ||
          (i.modello || '').toLowerCase().includes(q) ||
          (i.marca || '').toLowerCase().includes(q) ||
          (i.tipo || '').toLowerCase().includes(q) ||
          i.quantita.toString().includes(q) ||
          i.prezzoUnitario.toString().includes(q)
      );
    }

    // Quantity range
    if (filterQtyMin) data = data.filter((i) => i.quantita >= Number(filterQtyMin));
    if (filterQtyMax) data = data.filter((i) => i.quantita <= Number(filterQtyMax));

    // Price range
    if (filterPriceMin) data = data.filter((i) => i.prezzoUnitario >= Number(filterPriceMin));
    if (filterPriceMax) data = data.filter((i) => i.prezzoUnitario <= Number(filterPriceMax));

    // Grado filter (monitors only)
    if (filterGrado && (activeTab === 'monitor' || activeTab === 'tutti')) {
      data = data.filter((i) => i.grado === filterGrado);
    }

    // Sede filter
    if (filterSede) {
      data = data.filter((i) => i.sede === filterSede);
    }

    return data;
  }, [items, activeTab, globalFilter, filterQtyMin, filterQtyMax, filterPriceMin, filterPriceMax, filterGrado, filterSede]);

  // ─── Column helpers ──────────────────────────────────────
  const colH = createColumnHelper<UnifiedItem>();

  const baseColumns = useMemo(() => {
    const cols = [
      colH.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            className="border-border-default data-[state=checked]:bg-accent-primary data-[state=checked]:text-bg-base"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            onClick={(e) => e.stopPropagation()}
            className="border-border-default data-[state=checked]:bg-accent-primary data-[state=checked]:text-bg-base"
          />
        ),
        size: 40,
        enableSorting: false,
      }),
      colH.accessor('id', {
        header: 'ID',
        cell: ({ getValue }) => <span className="font-mono text-text-muted text-xs">{getValue()}</span>,
        size: 80,
      }),
      colH.accessor('nome', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-caption text-text-muted uppercase hover:text-text-secondary transition-colors"
          >
            Articolo
            {column.getIsSorted() === 'asc' && <ChevronUp size={12} />}
            {column.getIsSorted() === 'desc' && <ChevronDown size={12} />}
          </button>
        ),
        cell: ({ getValue, row }) => (
          <div className="flex flex-col">
            <span className="font-body text-text-primary font-medium truncate max-w-[200px]">{getValue()}</span>
            {row.original.categoria === 'monitor' && (
              <span className="font-caption text-text-muted">{row.original.tipo}</span>
            )}
          </div>
        ),
        size: 220,
      }),
      colH.accessor('quantita', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-caption text-text-muted uppercase hover:text-text-secondary transition-colors w-full justify-end"
          >
            Quantita
            {column.getIsSorted() === 'asc' && <ChevronUp size={12} />}
            {column.getIsSorted() === 'desc' && <ChevronDown size={12} />}
          </button>
        ),
        cell: ({ getValue, row, column }) => {
          const val = getValue();
          const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
          return (
            <div
              className="text-right font-mono text-text-secondary cursor-pointer select-none"
              onDoubleClick={() => {
                if (row.original.categoria !== 'monitor') {
                  setEditingCell({ rowId: row.id, columnId: column.id });
                  setEditValue(val.toString());
                }
              }}
            >
              {isEditing ? (
                <input
                  autoFocus
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    const num = parseInt(editValue);
                    const op = requireOperatore();
                    if (!op) {
                      setEditingCell(null);
                      return;
                    }
                    if (!isNaN(num) && num >= 0 && num !== val) {
                      const previous = row.original;
                      updateItem.mutate(
                        { id: previous.id, patch: { quantita: num }, operatore: op, previous },
                        {
                          onSuccess: (data) => {
                            const action = resolveQuantityAction(previous.quantita, num);
                            toast.success(inventoryUpdateToast(op, data, action), { duration: 5000 });
                          },
                          onError: () => toast.error('Errore aggiornamento quantita'),
                        }
                      );
                    }
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setEditingCell(null);
                  }}
                  className="w-16 bg-bg-surface border border-accent-primary rounded px-1 py-0.5 text-right font-mono text-xs text-text-primary focus:outline-none"
                />
              ) : (
                val
              )}
            </div>
          );
        },
        size: 100,
      }),
      colH.accessor('prezzoUnitario', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-caption text-text-muted uppercase hover:text-text-secondary transition-colors w-full justify-end"
          >
            {'\u20AC'}/unit
            {column.getIsSorted() === 'asc' && <ChevronUp size={12} />}
            {column.getIsSorted() === 'desc' && <ChevronDown size={12} />}
          </button>
        ),
        cell: ({ getValue, row, column }) => {
          const val = getValue();
          const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;
          return (
            <div
              className="text-right font-mono text-accent-primary cursor-pointer select-none"
              onDoubleClick={() => {
                if (row.original.categoria !== 'monitor') {
                  setEditingCell({ rowId: row.id, columnId: column.id });
                  setEditValue(val.toString());
                }
              }}
            >
              {isEditing ? (
                <input
                  autoFocus
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    const num = parseFloat(editValue);
                    const op = requireOperatore();
                    if (!op) {
                      setEditingCell(null);
                      return;
                    }
                    if (!isNaN(num) && num >= 0 && num !== val) {
                      const previous = row.original;
                      updateItem.mutate(
                        { id: previous.id, patch: { prezzoUnitario: num }, operatore: op, previous },
                        {
                          onSuccess: (data) => toast.success(inventoryUpdateToast(op, data), { duration: 5000 }),
                          onError: () => toast.error('Errore aggiornamento prezzo'),
                        }
                      );
                    }
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') setEditingCell(null);
                  }}
                  className="w-20 bg-bg-surface border border-accent-primary rounded px-1 py-0.5 text-right font-mono text-xs text-accent-primary focus:outline-none"
                />
              ) : (
                formatCurrency(val)
              )}
            </div>
          );
        },
        size: 130,
      }),
      colH.accessor('totale', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-1 font-caption text-text-muted uppercase hover:text-text-secondary transition-colors w-full justify-end"
          >
            Totale
            {column.getIsSorted() === 'asc' && <ChevronUp size={12} />}
            {column.getIsSorted() === 'desc' && <ChevronDown size={12} />}
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-accent-primary font-semibold">{formatCurrency(getValue())}</span>
        ),
        size: 130,
      }),
    ];

    return cols;
  }, [colH, editingCell, items, editValue, updateItem]);

  // Monitor-specific columns
  const monitorExtraCols = useMemo(() => [
    colH.accessor('tipo', {
      header: 'Tipo',
      cell: ({ getValue }) => <StatusBadge label={getValue() || ''} variant="tipo" />,
      size: 100,
    }),
    colH.accessor('modello', {
      header: 'Modello',
      cell: ({ getValue }) => <span className="font-body text-text-primary">{getValue()}</span>,
      size: 120,
    }),
    colH.accessor('marca', {
      header: 'Marca',
      cell: ({ getValue }) => <span className="font-body text-text-secondary">{getValue()}</span>,
      size: 100,
    }),
    colH.accessor('scaffale', {
      header: 'Scaff.',
      cell: ({ getValue }) => <span className="font-mono text-text-muted">{getValue()}</span>,
      size: 70,
    }),
    colH.accessor('ripiano', {
      header: 'Rip.',
      cell: ({ getValue }) => <span className="font-mono text-text-muted">{getValue()}</span>,
      size: 70,
    }),
    colH.accessor('bancale', {
      header: 'Bancale',
      cell: ({ getValue }) => <span className="font-mono text-text-secondary">{getValue()}</span>,
      size: 80,
    }),
    colH.accessor('grado', {
      header: 'Grado',
      cell: ({ getValue }) => <StatusBadge label={getValue() || ''} variant="grado" />,
      size: 80,
    }),
  ], [colH]);

  const noteColumn = useMemo(() =>
    colH.accessor('note', {
      header: 'Note',
      cell: ({ getValue }) => (
        <span className="font-body-small text-text-secondary truncate max-w-[250px] block" title={getValue()}>
          {getValue() || '-'}
        </span>
      ),
      size: 250,
      enableSorting: false,
    })
  , [colH]);

  const sedeColumn = useMemo(() =>
    colH.accessor('sede', {
      header: 'Sede',
      cell: ({ getValue }) => <SedeBadge sede={getValue()} />,
      size: 150,
    })
  , [colH]);

  const lastModifiedColumn = useMemo(
    () =>
      colH.display({
        id: 'ultimoAggiornamento',
        header: 'Ultimo agg.',
        cell: ({ row }) => <LastModifiedCell item={row.original} />,
        size: 150,
        enableSorting: false,
      }),
    [colH]
  );

  const actionsColumn = useMemo(() =>
    colH.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(row.original); }}
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-accent-primary hover:bg-bg-hover transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); confirmDelete(row.original); }}
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-status-rosso hover:bg-bg-hover transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
      size: 90,
      enableSorting: false,
    })
  , [colH]);

  // Build final columns based on active tab
  const columns = useMemo(() => {
    if (activeTab === 'monitor') {
      return [
        baseColumns[0], // select
        baseColumns[1], // id
        monitorExtraCols[0], // tipo
        monitorExtraCols[1], // modello
        monitorExtraCols[2], // marca
        baseColumns[3], // quantita
        {
          ...baseColumns[4],
          header: ({ column }: { column: any }) => (
            <button
              onClick={() => column.toggleSorting()}
              className="flex items-center gap-1 font-caption text-text-muted uppercase hover:text-text-secondary transition-colors w-full justify-right"
            >
              {'\u20AC'}
              {column.getIsSorted() === 'asc' && <ChevronUp size={12} />}
              {column.getIsSorted() === 'desc' && <ChevronDown size={12} />}
            </button>
          ),
          accessorKey: 'prezzoUnitario',
        } as any,
        monitorExtraCols[3], // scaffale
        monitorExtraCols[4], // ripiano
        monitorExtraCols[5], // bancale
        monitorExtraCols[6], // grado
        lastModifiedColumn,
        actionsColumn,
      ];
    }

    return [...baseColumns, noteColumn, sedeColumn, lastModifiedColumn, actionsColumn];
  }, [activeTab, baseColumns, monitorExtraCols, noteColumn, sedeColumn, lastModifiedColumn, actionsColumn]);

  // ─── Table instance ──────────────────────────────────────
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, rowSelection, pagination, globalFilter },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  // ─── CRUD handlers ───────────────────────────────────────
  function openAddModal() {
    if (!requireOperatore()) return;
    setEditingItem(null);
    setItemModalOpen(true);
  }

  function openEditModal(item: UnifiedItem) {
    if (!requireOperatore()) return;
    setEditingItem(item);
    setItemModalOpen(true);
  }

  function confirmDelete(item: UnifiedItem) {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (!itemToDelete) return;
    const op = requireOperatore();
    if (!op) return;
    deleteItems.mutate(
      { ids: [itemToDelete.id], operatore: op, items: [itemToDelete] },
      {
        onSuccess: () => {
          toast.success(`Eliminazione registrata · ${op} · '${itemToDelete.nome}'`, { duration: 5000 });
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        },
        onError: () => toast.error('Errore durante eliminazione'),
      }
    );
  }

  function handleBulkDelete() {
    const op = requireOperatore();
    if (!op) return;
    const selectedIds = selectedRows.map((r) => r.original.id);
    const selectedItems = selectedRows.map((r) => r.original);
    deleteItems.mutate(
      { ids: selectedIds, operatore: op, items: selectedItems },
      {
        onSuccess: () => {
          toast.success(`Eliminazione registrata · ${op} · ${selectedIds.length} articoli`, { duration: 5000 });
          setBulkDeleteOpen(false);
          setRowSelection({});
        },
        onError: () => toast.error('Errore durante eliminazione multipla'),
      }
    );
  }

  function handleSaveItem(formData: FormData) {
    const op = requireOperatore();
    if (!op) return;
    const nome = formData.get('nome') as string;
    const quantita = Number(formData.get('quantita'));
    const prezzo = Number(formData.get('prezzo'));
    const note = formData.get('note') as string;
    const sede = formData.get('sede') as Sede;

    const onDone = () => {
      setItemModalOpen(false);
      setEditingItem(null);
    };

    if (editingItem) {
      const previous = editingItem;
      updateItem.mutate(
        {
          id: editingItem.id,
          operatore: op,
          previous,
          patch: {
            nome,
            quantita,
            prezzoUnitario: prezzo,
            note,
            sede,
            tipo: (formData.get('tipo') as string) || editingItem.tipo,
            modello: (formData.get('modello') as string) || editingItem.modello,
            marca: (formData.get('marca') as string) || editingItem.marca,
            grado: (formData.get('grado') as string) || editingItem.grado,
            scaffale: Number(formData.get('scaffale')) || editingItem.scaffale,
            ripiano: Number(formData.get('ripiano')) || editingItem.ripiano,
            bancale: (formData.get('bancale') as string) || editingItem.bancale,
          },
        },
        {
          onSuccess: (data) => {
            const action = resolveQuantityAction(previous.quantita, quantita);
            toast.success(inventoryUpdateToast(op, data, action), { duration: 5000 });
            onDone();
          },
          onError: () => toast.error('Errore aggiornamento articolo'),
        }
      );
    } else {
      const cat = activeTab === 'tutti' ? 'schede' : (activeTab as Category);
      const newId = nextInventoryId(items, cat);
      createItem.mutate(
        {
          operatore: op,
          item: {
            id: newId,
            categoria: cat,
            nome,
            quantita,
            prezzoUnitario: prezzo,
            note,
            sede: sede || 'Magazzino Principale',
            ...(cat === 'monitor'
              ? {
                  tipo: (formData.get('tipo') as string) || 'LED19',
                  modello: (formData.get('modello') as string) || '',
                  marca: (formData.get('marca') as string) || '',
                  grado: (formData.get('grado') as string) || 'A',
                  scaffale: Number(formData.get('scaffale')) || 1,
                  ripiano: Number(formData.get('ripiano')) || 1,
                  bancale: (formData.get('bancale') as string) || 'A',
                }
              : {}),
          },
        },
        {
          onSuccess: (data) => {
            toast.success(inventoryUpdateToast(op, data, 'creazione'), { duration: 5000 });
            onDone();
          },
          onError: () => toast.error('Errore creazione articolo'),
        }
      );
    }
  }

  function resetFilters() {
    setGlobalFilter('');
    setFilterQtyMin('');
    setFilterQtyMax('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterGrado('');
    setFilterSede('');
  }

  const hasFilters = globalFilter || filterQtyMin || filterQtyMax || filterPriceMin || filterPriceMax || filterGrado || filterSede;

  const currentCategoryLabel = activeTab === 'tutti' ? 'Tutti' :
    activeTab === 'schede' ? 'Schede' :
    activeTab === 'cabinet' ? 'Cabinet' :
    activeTab === 'cambiamonete' ? 'Cambia Monete' :
    activeTab === 'accessori' ? 'Accessori' : 'Monitor';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner className="size-8 text-accent-primary" />
        <p className="font-body text-text-muted">Caricamento inventario da Supabase...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center max-w-md mx-auto">
        <p className="font-heading-3 text-status-rosso">Errore connessione database</p>
        <p className="font-body-small text-text-muted">{(error as Error).message}</p>
        <p className="font-caption text-text-muted">
          Progetto atteso: zewzttibcvuowskykega.supabase.co — se vedi zcgynarwbouaaamioegr, aggiorna le variabili Vercel e rifai deploy.
        </p>
        <p className="font-caption text-text-muted">
          401 = chiave anon sbagliata o non dello stesso progetto dell&apos;URL.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* ═══ Page Header ═══ */}
      <motion.div {...fadeInUp} className="flex items-start justify-between">
        <div>
          <p className="font-caption text-text-muted mb-1">
            <span className="cursor-pointer hover:text-text-secondary" onClick={() => window.location.hash = '/'}>Dashboard</span>
            {' / '}
            <span className="text-text-secondary">Inventario</span>
          </p>
          <h1 className="font-display-lg text-text-primary mb-1">Inventario Magazzino</h1>
          <p className="font-body text-text-secondary">
            Gestione completa delle scorte — 5 categorie, {items.length} articoli
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredData, `inventario_${activeTab}.csv`)}>
            <Download size={16} /> Esporta CSV
          </Button>
          <Button size="sm" onClick={openAddModal} className="bg-accent-primary text-bg-base hover:bg-accent-secondary">
            <Plus size={16} /> Nuovo Articolo
          </Button>
        </motion.div>
      </motion.div>

      {!operatore && (
        <motion.div
          {...fadeInUp}
          className="flex items-start gap-3 rounded-xl border border-status-arancione/40 bg-status-arancione/10 px-4 py-3"
        >
          <AlertCircle size={20} className="text-status-arancione shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-status-arancione font-medium">Seleziona chi sta operando</p>
            <p className="font-body-small text-text-secondary mt-0.5">
              Ogni modifica o prelievo viene registrato con nome e orario, così il responsabile vede l&apos;ultimo aggiornamento di ogni articolo.
            </p>
          </div>
        </motion.div>
      )}

      {/* ═══ Category Tabs ═══ */}
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.05 }}>
        <div className="border-b border-border-subtle">
          <div className="flex gap-1">
            {tabs.map((tab, i) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25, ease: easeSmooth }}
                  onClick={() => handleTabChange(tab.key as Category | 'tutti')}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-3 font-nav-label transition-colors',
                    isActive ? 'text-accent-primary' : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold',
                    isActive ? 'bg-accent-primary/15 text-accent-primary' : 'bg-bg-hover text-text-muted'
                  )}>
                    {tab.count}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-primary"
                      transition={{ duration: 0.2, ease: easeSmooth }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ═══ Search & Filter Bar ═══ */}
      <motion.div
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, delay: 0.1 }}
        className="flex flex-wrap items-center gap-3 bg-bg-elevated border border-border-subtle rounded-xl p-3"
      >
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-3 h-9 shrink-0',
            operatore
              ? 'border-border-default bg-bg-surface'
              : 'border-status-arancione/50 bg-status-arancione/10'
          )}
        >
          <User size={16} className={operatore ? 'text-text-muted' : 'text-status-arancione'} />
          <select
            value={operatore ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setOperatore(value ? (value as Operatore) : null);
            }}
            className="bg-transparent text-sm text-text-primary focus:outline-none min-w-[120px]"
            aria-label="Operatore"
          >
            <option value="">Chi sei?</option>
            {OPERATORS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-[400px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Cerca articolo, codice, marca..."
            className="pl-9 pr-8 bg-bg-surface border-border-default text-text-primary placeholder:text-text-muted focus:border-accent-primary"
          />
          {globalFilter && (
            <button onClick={() => setGlobalFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-accent-primary text-bg-base' : ''}
        >
          <Filter size={16} /> Filtri {hasFilters && <span className="w-2 h-2 rounded-full bg-accent-primary ml-1" />}
        </Button>

        <div className="flex-1" />

        {/* Column visibility */}
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setShowColMenu(!showColMenu)}>
            {showColMenu ? <EyeOff size={16} /> : <Eye size={16} />} Colonne
          </Button>
          <AnimatePresence>
            {showColMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-30 bg-bg-surface border border-border-default rounded-lg shadow-lg p-3 min-w-[180px]"
              >
                {table.getAllLeafColumns().filter((c) => c.id !== 'select' && c.id !== 'actions').map((col) => (
                  <label key={col.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:text-accent-primary transition-colors">
                    <Checkbox
                      checked={!hiddenCols.has(col.id)}
                      onCheckedChange={() => {
                        setHiddenCols((prev) => {
                          const next = new Set(prev);
                          if (next.has(col.id)) next.delete(col.id);
                          else next.add(col.id);
                          return next;
                        });
                      }}
                    />
                    <span className="font-body-small text-text-secondary">{col.id}</span>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results count */}
        <span className="font-caption text-text-muted">
          {filteredData.length} articoli
        </span>
      </motion.div>

      {/* ═══ Filter Panel ═══ */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: easeSmooth }}
            className="overflow-hidden"
          >
            <div className="bg-bg-surface border border-border-default rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <Label className="font-caption text-text-muted mb-1.5 block">Q.tà min</Label>
                <Input type="number" value={filterQtyMin} onChange={(e) => setFilterQtyMin(e.target.value)} placeholder="0" className="bg-bg-elevated border-border-default" />
              </div>
              <div>
                <Label className="font-caption text-text-muted mb-1.5 block">Q.tà max</Label>
                <Input type="number" value={filterQtyMax} onChange={(e) => setFilterQtyMax(e.target.value)} placeholder="999" className="bg-bg-elevated border-border-default" />
              </div>
              <div>
                <Label className="font-caption text-text-muted mb-1.5 block">Prezzo min (€)</Label>
                <Input type="number" value={filterPriceMin} onChange={(e) => setFilterPriceMin(e.target.value)} placeholder="0" className="bg-bg-elevated border-border-default" />
              </div>
              <div>
                <Label className="font-caption text-text-muted mb-1.5 block">Prezzo max (€)</Label>
                <Input type="number" value={filterPriceMax} onChange={(e) => setFilterPriceMax(e.target.value)} placeholder="99999" className="bg-bg-elevated border-border-default" />
              </div>
              {(activeTab === 'monitor' || activeTab === 'tutti') && (
                <div>
                  <Label className="font-caption text-text-muted mb-1.5 block">Grado</Label>
                  <select
                    value={filterGrado}
                    onChange={(e) => setFilterGrado(e.target.value)}
                    className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                  >
                    <option value="">Tutti</option>
                    {GRADI.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <Label className="font-caption text-text-muted mb-1.5 block">Sede</Label>
                <select
                  value={filterSede}
                  onChange={(e) => setFilterSede(e.target.value)}
                  className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                >
                  <option value="">Tutte</option>
                  {SEDI.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2 col-span-2 md:col-span-4 lg:col-span-1">
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-text-muted hover:text-text-primary">
                  Resetta
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Active Filter Chips ═══ */}
      <AnimatePresence>
        {hasFilters && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex flex-wrap gap-2"
          >
            {globalFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Ricerca: {globalFilter} <button onClick={() => setGlobalFilter('')}><X size={12} /></button>
              </span>
            )}
            {filterQtyMin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Q.tà ≥ {filterQtyMin} <button onClick={() => setFilterQtyMin('')}><X size={12} /></button>
              </span>
            )}
            {filterQtyMax && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Q.tà ≤ {filterQtyMax} <button onClick={() => setFilterQtyMax('')}><X size={12} /></button>
              </span>
            )}
            {filterPriceMin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Prezzo ≥ €{filterPriceMin} <button onClick={() => setFilterPriceMin('')}><X size={12} /></button>
              </span>
            )}
            {filterPriceMax && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Prezzo ≤ €{filterPriceMax} <button onClick={() => setFilterPriceMax('')}><X size={12} /></button>
              </span>
            )}
            {filterGrado && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Grado: {filterGrado} <button onClick={() => setFilterGrado('')}><X size={12} /></button>
              </span>
            )}
            {filterSede && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Sede: {filterSede} <button onClick={() => setFilterSede('')}><X size={12} /></button>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Data Table ═══ */}
      <motion.div
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, delay: 0.15 }}
        className="bg-bg-elevated border border-border-subtle rounded-xl overflow-hidden"
      >
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-bg-surface border-b border-border-subtle sticky top-0 z-10">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="h-12 px-4 font-caption text-text-muted uppercase tracking-wider whitespace-nowrap"
                      style={{ width: h.getSize() }}
                    >
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <motion.tbody variants={staggerContainer} initial="initial" animate="animate">
              <AnimatePresence mode="popLayout">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <EmptyState onReset={resetFilters} />
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <motion.tr
                      key={row.id}
                      variants={rowVariant}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      layout
                      onClick={() => openEditModal(row.original)}
                      className={cn(
                        'h-12 border-b border-border-subtle/50 transition-colors cursor-pointer group',
                        row.getIsSelected()
                          ? 'bg-gradient-to-r from-[#D0FF5910] to-transparent border-l-[3px] border-l-accent-primary'
                          : 'hover:bg-bg-hover border-l-[3px] border-l-transparent'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>

        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedCount > 0 && (
            <motion.div
              initial={{ y: 56, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 56, opacity: 0 }}
              transition={{ duration: 0.25, ease: easeSmooth }}
              className="sticky bottom-0 left-0 right-0 h-14 bg-bg-surface border-t border-border-default flex items-center justify-between px-6 shadow-[0_-4px_20px_#00000040] z-20"
            >
              <div className="flex items-center gap-3">
                <span className="font-body text-text-primary">{selectedCount} articoli selezionati</span>
                <button
                  onClick={() => table.toggleAllPageRowsSelected(true)}
                  className="font-body-small text-accent-primary hover:underline"
                >
                  Seleziona tutti
                </button>
                <button
                  onClick={() => setRowSelection({})}
                  className="font-body-small text-text-muted hover:text-text-secondary"
                >
                  Deseleziona
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCSV(selectedRows.map((r) => r.original), 'selezionati.csv')}>
                  <Download size={14} /> Esporta
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 size={14} /> Elimina
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border-subtle bg-bg-elevated">
            <div className="flex items-center gap-4">
              <span className="font-caption text-text-muted">
                Mostrando {pagination.pageIndex * pagination.pageSize + 1}-{Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredData.length)} di {filteredData.length}
              </span>
              <select
                value={pagination.pageSize}
                onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
                className="h-7 rounded-md border border-border-default bg-bg-surface px-2 text-text-primary text-xs font-mono focus:border-accent-primary focus:outline-none"
              >
                {[10, 20, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-text-secondary text-xs px-2">
                {pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ Add/Edit Modal ═══ */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="bg-bg-surface border-border-default text-text-primary max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading-2 text-text-primary">
              {editingItem ? `Modifica Articolo — ${editingItem.nome}` : `Nuovo Articolo — ${currentCategoryLabel}`}
            </DialogTitle>
            <DialogDescription className="text-text-muted font-body-small">
              {editingItem
                ? 'Modifica i dettagli dell\'articolo. La modifica sarà registrata a tuo nome.'
                : 'Inserisci i dettagli del nuovo articolo. La creazione sarà registrata a tuo nome.'}
            </DialogDescription>
          </DialogHeader>
          {editingItem?.updatedAt && (
            <div className="rounded-lg border border-status-blu/30 bg-status-blu/10 px-3 py-2.5 -mt-1">
              <p className="font-caption text-status-blu uppercase tracking-wide mb-1">Ultimo aggiornamento registrato</p>
              <p className="font-body-small text-text-primary">
                {formatAbsoluteDateTime(editingItem.updatedAt)}
                {editingItem.lastModifiedBy ? ` · ${editingItem.lastModifiedBy}` : ''}
              </p>
              <p className="font-caption text-text-muted mt-1">
                ({formatRelativeTime(editingItem.updatedAt)})
              </p>
            </div>
          )}
          {operatore && (
            <p className="font-caption text-text-muted -mt-1">
              Stai operando come: <span className="text-accent-primary font-medium">{operatore}</span>
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveItem(new FormData(e.currentTarget));
            }}
            className="space-y-4 mt-2"
          >
            <div>
              <Label className="text-text-secondary mb-1.5 block">Nome *</Label>
              <Input name="nome" defaultValue={editingItem?.nome || ''} required placeholder="Inserisci il nome dell'articolo" className="bg-bg-elevated border-border-default" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-text-secondary mb-1.5 block">Quantita *</Label>
                <Input name="quantita" type="number" min={0} defaultValue={editingItem?.quantita || 1} required className="bg-bg-elevated border-border-default" />
              </div>
              <div>
                <Label className="text-text-secondary mb-1.5 block">Prezzo Unitario (€) *</Label>
                <Input name="prezzo" type="number" min={0} step={0.01} defaultValue={editingItem?.prezzoUnitario || 0} required className="bg-bg-elevated border-border-default" />
              </div>
            </div>

            {/* Monitor extra fields */}
            {(activeTab === 'monitor' || editingItem?.categoria === 'monitor') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">Tipo *</Label>
                    <select name="tipo" defaultValue={editingItem?.tipo || 'LED19'} required className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none">
                      <option>LCD19</option>
                      <option>LED19</option>
                      <option>LED22</option>
                      <option>LCD 16:10</option>
                      <option>LED 16:10</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">Grado *</Label>
                    <select name="grado" defaultValue={editingItem?.grado || 'A'} required className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none">
                      {GRADI.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">Modello *</Label>
                    <Input name="modello" defaultValue={editingItem?.modello || ''} required placeholder="es. 19P4Q" className="bg-bg-elevated border-border-default" />
                  </div>
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">Marca *</Label>
                    <Input name="marca" defaultValue={editingItem?.marca || ''} required placeholder="es. PHILIPS" className="bg-bg-elevated border-border-default" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">Scaffale</Label>
                    <Input name="scaffale" type="number" min={1} defaultValue={editingItem?.scaffale || 1} className="bg-bg-elevated border-border-default" />
                  </div>
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">Ripiano</Label>
                    <Input name="ripiano" type="number" min={1} defaultValue={editingItem?.ripiano || 1} className="bg-bg-elevated border-border-default" />
                  </div>
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">Bancale</Label>
                    <select name="bancale" defaultValue={editingItem?.bancale || 'A'} className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none">
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <Label className="text-text-secondary mb-1.5 block">Note</Label>
              <Textarea name="note" defaultValue={editingItem?.note || ''} rows={3} placeholder="Note operative, riferimenti DDT, sedi..." className="bg-bg-elevated border-border-default" />
            </div>

            <div>
              <Label className="text-text-secondary mb-1.5 block">Sede *</Label>
              <select
                name="sede"
                defaultValue={editingItem?.sede || 'Magazzino Principale'}
                required
                className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
              >
                {SEDI.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Live total */}
            <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 text-center">
              <span className="font-caption text-text-muted">Totale calcolato</span>
              <p className="font-data-md text-accent-primary mt-1">
                {formatCurrency(
                  (Number((document.querySelector('input[name="quantita"]') as HTMLInputElement)?.value || editingItem?.quantita || 0)) *
                  (Number((document.querySelector('input[name="prezzo"]') as HTMLInputElement)?.value || editingItem?.prezzoUnitario || 0))
                )}
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => { setItemModalOpen(false); setEditingItem(null); }}>
                Annulla
              </Button>
              <Button type="submit" className="bg-accent-primary text-bg-base hover:bg-accent-secondary">
                {editingItem ? 'Salva Modifiche' : 'Salva'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Confirmation ═══ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-bg-surface border-border-default text-text-primary max-w-sm">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-status-rosso/15 flex items-center justify-center mb-2">
              <Trash2 size={24} className="text-status-rosso" />
            </div>
            <AlertDialogTitle className="font-heading-2 text-text-primary">Elimina Articolo</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary font-body-small">
              Sei sicuro di voler eliminare '{itemToDelete?.nome}'? Questa azione non puo essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setDeleteDialogOpen(false); setItemToDelete(null); }}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Elimina
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Bulk Delete Confirmation ═══ */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="bg-bg-surface border-border-default text-text-primary max-w-sm">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-status-rosso/15 flex items-center justify-center mb-2">
              <Trash2 size={24} className="text-status-rosso" />
            </div>
            <AlertDialogTitle className="font-heading-2 text-text-primary">Elimina {selectedCount} Articoli</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary font-body-small">
              Sei sicuro di voler eliminare {selectedCount} articoli selezionati? Questa azione non puo essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setBulkDeleteOpen(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Elimina
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
