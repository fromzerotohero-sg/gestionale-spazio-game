import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type Column,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Search,
  Download,
  Upload,
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
  Printer,
  Truck,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportInventoryToExcel,
  type ExportScope,
  CATEGORY_LABELS,
} from "@/lib/inventory-export";
import { parseInventoryImportFile } from "@/lib/inventory-import";
import { type Category, type Sede, SEDI } from "@/data/inventory";
import {
  GRADI,
  GRADO_CUSTOM_VALUE,
  gradoToFormState,
  resolveGradoValue,
  type GradoFormMode,
} from "@/lib/inventory-grado";
import {
  TIPO_CUSTOM_VALUE,
  buildMonitorTipoOptions,
  resolveTipoValue,
  tipoToFormState,
  type TipoFormMode,
} from "@/lib/inventory-monitor-tipo";
import {
  OPERATORS,
  getStoredOperatore,
  setStoredOperatore,
  type Operatore,
} from "@/data/operators";
import {
  formatAbsoluteDateTime,
  formatRelativeTime,
  inventoryUpdateToast,
  resolveQuantityAction,
} from "@/lib/inventory-tracking";
import { MovimentiCronologia } from "@/components/inventory/MovimentiCronologia";
import { InventoryLabelSheet } from "@/components/inventory/InventoryLabelSheet";
import {
  SchedaNullaostaPanel,
  initSchedaNullaostaFromItem,
} from "@/components/inventory/SchedaNullaostaPanel";
import { SchedePrenotatePanel } from "@/components/inventory/SchedePrenotatePanel";
import {
  BancaleStatoOperativoBadge,
  BancaleStatoOperativoPanel,
} from "@/components/inventory/BancaleStatoOperativoPanel";
import {
  normalizeBancaleStatoOperativo,
  type BancaleStatoOperativo,
} from "@/lib/bancale-stato-operativo";
import {
  schedaNullaostaLabel,
  toDateIso,
} from "@/lib/scheda-nullaosta";
import {
  findItemsForLabelPrint,
  triggerBrowserLabelPrint,
} from "@/lib/inventory-label-print";
import {
  inventoryActivityQueryKey,
  useCreateInventoryItem,
  useDeleteInventoryItems,
  useInventoryActivity,
  useInventoryItems,
  useUpdateInventoryItem,
} from "@/hooks/use-inventory";
import { nextInventoryId } from "@/lib/inventory-api";
import type { UnifiedItem } from "@/types/inventory";
import { Spinner } from "@/components/ui/spinner";

type EditingCell = { rowId: string; columnId: string } | null;

/** Ordine predefinito: inserimenti e modifiche recenti in cima */
const DEFAULT_TABLE_SORTING: SortingState = [
  { id: "ultimoAggiornamento", desc: true },
];

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
  "Magazzino Principale":
    "bg-status-blu/15 text-status-blu border-status-blu/30",
  Limena:
    "bg-status-arancione/15 text-status-arancione border-status-arancione/30",
  "Magazzino Angelo":
    "bg-status-viola/15 text-status-viola border-status-viola/30",
};

const OPERATOR_PLACEHOLDER = "__unset__";

const GRADO_COLORS: Record<string, string> = {
  A: "bg-status-verde/15 text-status-verde border-status-verde/30",
  B: "bg-status-giallo/15 text-status-giallo border-status-giallo/30",
  C: "bg-status-rosso/15 text-status-rosso border-status-rosso/30",
};

const COLUMN_LABELS: Record<string, string> = {
  id: "ID",
  nome: "Articolo",
  tipo: "Tipo",
  modello: "Modello",
  marca: "Marca",
  quantita: "Quantita",
  prezzoUnitario: "Prezzo unitario",
  totale: "Totale",
  scaffale: "Scaffale",
  ripiano: "Ripiano",
  bancale: "Bancale",
  bancaleStatoOperativo: "Stato bancale",
  grado: "Grado",
  note: "Note",
  sede: "Sede",
  ultimoAggiornamento: "Ultimo aggiornamento",
  verificaBancale: "Verificato",
  categoria: "Categoria",
  schedaNullaosta: "Nullaosta",
};

const CATEGORY_COLORS: Record<Category, string> = {
  schede: "bg-status-viola/15 text-status-viola border-status-viola/30",
  cabinet:
    "bg-status-arancione/15 text-status-arancione border-status-arancione/30",
  cambiamonete:
    "bg-status-giallo/15 text-status-giallo border-status-giallo/30",
  accessori: "bg-status-blu/15 text-status-blu border-status-blu/30",
  monitor: "bg-accent-primary/15 text-accent-primary border-accent-primary/30",
};

type FilterBancaleVerifica = "tutti" | "verificati" | "da_verificare";

// ─── Sede Badge ────────────────────────────────────────────
function SedeBadge({ sede }: { sede: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded font-badge border",
        SEDE_COLORS[sede] ||
          "bg-bg-hover text-text-muted border-border-default",
      )}
    >
      {sede}
    </span>
  );
}

// ─── Grado Badge ───────────────────────────────────────────
function GradoBadge({ grado }: { grado: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded font-badge border",
        GRADO_COLORS[grado] ||
          "bg-bg-hover text-text-muted border-border-default",
      )}
    >
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
      <img
        src="/empty-state.svg"
        alt="Nessun risultato"
        className="w-[120px] h-[120px] mb-4 opacity-60"
      />
      <h3 className="font-heading-3 text-text-secondary mb-1">
        Nessun articolo trovato
      </h3>
      <p className="font-body-small text-text-muted mb-4">
        Prova a modificare i filtri di ricerca
      </p>
      <Button variant="outline" onClick={onReset}>
        Resetta Filtri
      </Button>
    </motion.div>
  );
}

function BancaleVerificaCell({
  item,
  onToggle,
  disabled,
}: {
  item: UnifiedItem;
  onToggle: (item: UnifiedItem, checked: boolean) => void;
  disabled?: boolean;
}) {
  const title =
    item.bancaleVerificato && item.bancaleVerificatoAt
      ? [
          formatAbsoluteDateTime(item.bancaleVerificatoAt),
          item.bancaleVerificatoDa ? `da ${item.bancaleVerificatoDa}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Non verificato";

  return (
    <div className="flex justify-center" title={title}>
      <Checkbox
        checked={!!item.bancaleVerificato}
        disabled={disabled}
        onCheckedChange={(v) => onToggle(item, !!v)}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "border-border-default",
          item.bancaleVerificato &&
            "data-[state=checked]:bg-status-blu data-[state=checked]:border-status-blu",
        )}
      />
    </div>
  );
}

function BancaleVerificaPanel({
  checked,
  onCheckedChange,
  item,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  item?: UnifiedItem | null;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-elevated/40 p-3">
      <Checkbox
        id="bancale-verificato"
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(!!v)}
        className={cn(
          "mt-0.5 border-border-default",
          checked &&
            "data-[state=checked]:bg-status-blu data-[state=checked]:border-status-blu",
        )}
      />
      <div className="min-w-0">
        <Label
          htmlFor="bancale-verificato"
          className="text-text-primary font-medium cursor-pointer"
        >
          Bancale verificato
        </Label>
        {checked && item?.bancaleVerificatoAt && (
          <p className="font-caption text-text-muted mt-1">
            {formatAbsoluteDateTime(item.bancaleVerificatoAt)}
            {item.bancaleVerificatoDa ? ` · ${item.bancaleVerificatoDa}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function SortableColumnHeader({
  label,
  column,
  align = "left",
  defaultDesc = false,
}: {
  label: string;
  column: Column<UnifiedItem, unknown>;
  align?: "left" | "right" | "center";
  defaultDesc?: boolean;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      onClick={() => {
        if (!sorted) column.toggleSorting(defaultDesc);
        else column.toggleSorting();
      }}
      className={cn(
        "flex items-center gap-1 font-caption text-text-muted uppercase hover:text-text-secondary transition-colors",
        align === "right" && "w-full justify-end",
        align === "center" && "w-full justify-center",
      )}
    >
      {label}
      {sorted === "asc" && <ChevronUp size={12} />}
      {sorted === "desc" && <ChevronDown size={12} />}
    </button>
  );
}

function LastModifiedCell({ item }: { item: UnifiedItem }) {
  if (!item.updatedAt) {
    return <span className="font-caption text-text-muted">Mai aggiornato</span>;
  }
  return (
    <div
      className="flex flex-col gap-0.5"
      title={formatAbsoluteDateTime(item.updatedAt)}
    >
      <span className="inline-flex items-center gap-1 font-caption text-text-secondary">
        <Clock size={11} className="text-text-muted shrink-0" />
        {formatRelativeTime(item.updatedAt)}
      </span>
      <span className="font-caption text-text-muted truncate max-w-[130px]">
        {item.lastModifiedBy ?? "Operatore non registrato"}
      </span>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────
function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "sede" | "grado" | "tipo";
}) {
  if (variant === "sede") return <SedeBadge sede={label} />;
  if (variant === "grado") return <GradoBadge grado={label} />;
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
  const tabFromUrl = searchParams.get("categoria") as Category | "tutti" | null;
  const [activeTab, setActiveTab] = useState<Category | "tutti">(
    tabFromUrl || "tutti",
  );

  const [sorting, setSorting] = useState<SortingState>(DEFAULT_TABLE_SORTING);

  useEffect(() => {
    setSorting(DEFAULT_TABLE_SORTING);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [activeTab]);

  const handleSortingChange = useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      setSorting((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return next.length > 0 ? next : DEFAULT_TABLE_SORTING;
      });
    },
    [],
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterQtyMin, setFilterQtyMin] = useState("");
  const [filterQtyMax, setFilterQtyMax] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterGrado, setFilterGrado] = useState("");
  const [filterSede, setFilterSede] = useState("");
  const [filterBancaleVerifica, setFilterBancaleVerifica] =
    useState<FilterBancaleVerifica>("tutti");
  const [modalBancaleVerificato, setModalBancaleVerificato] = useState(false);
  const [modalBancaleStatoOperativo, setModalBancaleStatoOperativo] =
    useState<BancaleStatoOperativo | null>(null);
  const [modalBancaleStatoNota, setModalBancaleStatoNota] = useState("");
  const [modalGradoMode, setModalGradoMode] = useState<GradoFormMode>("A");
  const [modalGradoCustom, setModalGradoCustom] = useState("");
  const [modalTipoMode, setModalTipoMode] = useState<TipoFormMode>("LED19");
  const [modalTipoCustom, setModalTipoCustom] = useState("");
  const [modalDocInviataAt, setModalDocInviataAt] = useState<Date | undefined>();
  const [modalNullaostaRicevuto, setModalNullaostaRicevuto] = useState(false);
  const [modalNullaostaAt, setModalNullaostaAt] = useState<Date | undefined>();
  const [rimuoviVerificaOpen, setRimuoviVerificaOpen] = useState(false);
  const [pendingRimuoviVerifica, setPendingRimuoviVerifica] = useState<{
    source: "tabella" | "modale";
    item: UnifiedItem;
  } | null>(null);

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UnifiedItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<UnifiedItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Inline editing
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState("");

  // Column visibility
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [showColMenu, setShowColMenu] = useState(false);
  const [operatore, setOperatore] = useState<Operatore | null>(() =>
    getStoredOperatore(),
  );
  const [modalQuantita, setModalQuantita] = useState(1);
  const [modalPrezzo, setModalPrezzo] = useState(0);
  const [modalFornitore, setModalFornitore] = useState("");
  const [modalNote, setModalNote] = useState("");
  const [movimentoQuantita, setMovimentoQuantita] = useState("");
  const [movimentoNote, setMovimentoNote] = useState("");
  const [movimentoSaving, setMovimentoSaving] = useState(false);
  const [notaSaving, setNotaSaving] = useState(false);
  const [showNoteSection, setShowNoteSection] = useState(false);
  const [showCronologiaSection, setShowCronologiaSection] = useState(false);
  const [labelPrintItems, setLabelPrintItems] = useState<UnifiedItem[]>([]);
  const [labelSearchArticolo, setLabelSearchArticolo] = useState("");
  const [labelSearchBancale, setLabelSearchBancale] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, isError, error } = useInventoryItems();
  const monitorTipoOptions = useMemo(
    () => buildMonitorTipoOptions(items),
    [items],
  );
  const {
    data: activityRows = [],
    isLoading: activityLoading,
    isError: activityError,
  } = useInventoryActivity(
    editingItem?.id ?? null,
    itemModalOpen && !!editingItem,
  );
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItems = useDeleteInventoryItems();

  useEffect(() => {
    if (operatore) setStoredOperatore(operatore);
  }, [operatore]);

  function requireOperatore(): Operatore | null {
    if (operatore) return operatore;
    toast.error(
      "Seleziona il tuo nome in alto prima di modificare l'inventario",
      { duration: 5000 },
    );
    return null;
  }

  function applicaBancaleVerificato(
    item: UnifiedItem,
    verificato: boolean,
    onSuccess?: (data: UnifiedItem) => void,
  ) {
    const op = requireOperatore();
    if (!op) return;
    updateItem.mutate(
      {
        id: item.id,
        operatore: op,
        previous: item,
        patch: { bancaleVerificato: verificato },
        skipActivityLog: true,
      },
      {
        onSuccess: (data) => {
          onSuccess?.(data);
          toast.success(verificato ? "Bancale verificato" : "Verifica rimossa");
        },
        onError: () => toast.error("Errore aggiornamento verifica bancale"),
      },
    );
  }

  function richiediRimuoviVerificaBancale(
    item: UnifiedItem,
    source: "tabella" | "modale",
  ) {
    setPendingRimuoviVerifica({ source, item });
    setRimuoviVerificaOpen(true);
  }

  function confermaRimuoviVerificaBancale() {
    if (!pendingRimuoviVerifica) return;
    const { source, item } = pendingRimuoviVerifica;
    setRimuoviVerificaOpen(false);
    setPendingRimuoviVerifica(null);
    applicaBancaleVerificato(item, false, (data) => {
      if (source === "modale" && editingItem?.id === data.id) {
        setEditingItem(data);
        setModalBancaleVerificato(false);
      }
    });
  }

  function toggleBancaleVerificaInTabella(item: UnifiedItem, checked: boolean) {
    if (!checked && item.bancaleVerificato) {
      richiediRimuoviVerificaBancale(item, "tabella");
      return;
    }
    if (checked) applicaBancaleVerificato(item, true);
  }

  function handleModalBancaleVerificatoChange(checked: boolean) {
    if (!checked && modalBancaleVerificato && editingItem?.bancaleVerificato) {
      richiediRimuoviVerificaBancale(editingItem, "modale");
      return;
    }
    setModalBancaleVerificato(checked);
  }

  function stampaEtichetta(targetItems: UnifiedItem[]) {
    if (!targetItems.length) {
      toast.error("Nessun articolo da stampare");
      return;
    }
    const toPrint = targetItems.slice(0, 1);
    if (targetItems.length > 1) {
      toast.info(
        `Trovati ${targetItems.length} articoli: viene stampata un'etichetta (${toPrint[0].id}). Affina la ricerca per un altro.`,
      );
    }
    setLabelPrintItems(toPrint);
    window.setTimeout(() => {
      triggerBrowserLabelPrint(() => setLabelPrintItems([]));
      toast.success(
        `Etichetta pronta: ${toPrint[0].nome}. Nel dialogo stampa disattiva intestazioni e piè di pagina.`,
        { duration: 6000 },
      );
    }, 200);
  }

  function stampaEtichettaDaToolbar() {
    const matches = findItemsForLabelPrint(
      items,
      labelSearchArticolo,
      labelSearchBancale,
    );
    if (!labelSearchArticolo.trim() && !labelSearchBancale) {
      toast.error("Inserisci codice articolo o seleziona un bancale");
      return;
    }
    if (!matches.length) {
      toast.error("Nessun articolo trovato con questi criteri");
      return;
    }
    stampaEtichetta(matches);
  }

  function stampaEtichettaModale() {
    if (!editingItem) return;
    stampaEtichetta([editingItem]);
  }

  const tabs = useMemo(() => {
    const sum = (cat?: Category) =>
      items
        .filter((i) => !cat || i.categoria === cat)
        .reduce((s, i) => s + i.totale, 0);
    const count = (cat?: Category) =>
      items.filter((i) => !cat || i.categoria === cat).length;
    return [
      {
        key: "tutti" as const,
        label: "Tutti",
        icon: Grid2x2,
        count: count(),
        value: sum(),
      },
      {
        key: "schede" as const,
        label: "Schede",
        icon: Cpu,
        count: count("schede"),
        value: sum("schede"),
      },
      {
        key: "cabinet" as const,
        label: "Cabinet",
        icon: Box,
        count: count("cabinet"),
        value: sum("cabinet"),
      },
      {
        key: "cambiamonete" as const,
        label: "Cambia Monete",
        icon: Banknote,
        count: count("cambiamonete"),
        value: sum("cambiamonete"),
      },
      {
        key: "accessori" as const,
        label: "Accessori",
        icon: Puzzle,
        count: count("accessori"),
        value: sum("accessori"),
      },
      {
        key: "monitor" as const,
        label: "Monitor",
        icon: MonitorIcon,
        count: count("monitor"),
        value: sum("monitor"),
      },
    ];
  }, [items]);

  // Sync tab with URL
  useEffect(() => {
    const t = searchParams.get("categoria") as Category | "tutti" | null;
    if (t && tabs.find((tab) => tab.key === t)) {
      setActiveTab(t);
    }
  }, [searchParams, tabs]);

  const handleTabChange = useCallback(
    (tab: Category | "tutti") => {
      setActiveTab(tab);
      setSearchParams({ categoria: tab });
      setRowSelection({});
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    [setSearchParams],
  );

  // ─── Filter logic ────────────────────────────────────────
  const filteredData = useMemo(() => {
    let data =
      activeTab === "tutti"
        ? items
        : items.filter((i) => i.categoria === activeTab);

    // Global search
    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      data = data.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.nome.toLowerCase().includes(q) ||
          i.note.toLowerCase().includes(q) ||
          i.sede.toLowerCase().includes(q) ||
          (i.modello || "").toLowerCase().includes(q) ||
          (i.marca || "").toLowerCase().includes(q) ||
          (i.tipo || "").toLowerCase().includes(q) ||
          i.quantita.toString().includes(q) ||
          i.prezzoUnitario.toString().includes(q),
      );
    }

    // Quantity range
    if (filterQtyMin)
      data = data.filter((i) => i.quantita >= Number(filterQtyMin));
    if (filterQtyMax)
      data = data.filter((i) => i.quantita <= Number(filterQtyMax));

    // Price range
    if (filterPriceMin)
      data = data.filter((i) => i.prezzoUnitario >= Number(filterPriceMin));
    if (filterPriceMax)
      data = data.filter((i) => i.prezzoUnitario <= Number(filterPriceMax));

    // Grado filter (monitors only)
    if (filterGrado && (activeTab === "monitor" || activeTab === "tutti")) {
      data = data.filter((i) => i.grado === filterGrado);
    }

    // Sede filter
    if (filterSede) {
      data = data.filter((i) => i.sede === filterSede);
    }

    if (activeTab !== "schede") {
      if (filterBancaleVerifica === "verificati") {
        data = data.filter((i) => i.bancaleVerificato);
      } else if (filterBancaleVerifica === "da_verificare") {
        data = data.filter((i) => !i.bancaleVerificato);
      }
    }

    return data;
  }, [
    items,
    activeTab,
    globalFilter,
    filterQtyMin,
    filterQtyMax,
    filterPriceMin,
    filterPriceMax,
    filterGrado,
    filterSede,
    filterBancaleVerifica,
  ]);

  // ─── Column helpers ──────────────────────────────────────
  const colH = createColumnHelper<UnifiedItem>();

  const baseColumns = useMemo(() => {
    const cols = [
      colH.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
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
      colH.accessor("id", {
        header: ({ column }) => (
          <SortableColumnHeader label="ID" column={column} />
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-text-muted text-xs">
            {getValue()}
          </span>
        ),
        size: 80,
      }),
      colH.accessor("nome", {
        header: ({ column }) => (
          <SortableColumnHeader label="Articolo" column={column} />
        ),
        cell: ({ getValue, row }) => (
          <div className="flex flex-col">
            <span className="font-body text-text-primary font-medium truncate max-w-[200px]">
              {getValue()}
            </span>
            {row.original.categoria === "monitor" && (
              <span className="font-caption text-text-muted">
                {row.original.tipo}
              </span>
            )}
          </div>
        ),
        size: 220,
      }),
      colH.accessor("quantita", {
        header: ({ column }) => (
          <SortableColumnHeader
            label="Quantita"
            column={column}
            align="right"
          />
        ),
        cell: ({ getValue, row, column }) => {
          const val = getValue();
          const isEditing =
            editingCell?.rowId === row.id &&
            editingCell?.columnId === column.id;
          return (
            <div
              className="text-right font-mono text-text-secondary cursor-pointer select-none"
              onDoubleClick={() => {
                if (row.original.categoria !== "monitor") {
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
                        {
                          id: previous.id,
                          patch: { quantita: num },
                          operatore: op,
                          previous,
                        },
                        {
                          onSuccess: (data) => {
                            const action = resolveQuantityAction(
                              previous.quantita,
                              num,
                            );
                            toast.success(
                              inventoryUpdateToast(op, data, action),
                              { duration: 5000 },
                            );
                          },
                          onError: () =>
                            toast.error("Errore aggiornamento quantita"),
                        },
                      );
                    }
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingCell(null);
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
      colH.accessor("prezzoUnitario", {
        header: ({ column }) => (
          <SortableColumnHeader
            label={"\u20AC" + "/unit"}
            column={column}
            align="right"
          />
        ),
        cell: ({ getValue, row, column }) => {
          const val = getValue();
          const isEditing =
            editingCell?.rowId === row.id &&
            editingCell?.columnId === column.id;
          return (
            <div
              className="text-right font-mono text-accent-primary cursor-pointer select-none"
              onDoubleClick={() => {
                if (row.original.categoria !== "monitor") {
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
                        {
                          id: previous.id,
                          patch: { prezzoUnitario: num },
                          operatore: op,
                          previous,
                        },
                        {
                          onSuccess: (data) =>
                            toast.success(inventoryUpdateToast(op, data), {
                              duration: 5000,
                            }),
                          onError: () =>
                            toast.error("Errore aggiornamento prezzo"),
                        },
                      );
                    }
                    setEditingCell(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingCell(null);
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
      colH.accessor("totale", {
        header: ({ column }) => (
          <SortableColumnHeader
            label="Totale"
            column={column}
            align="right"
          />
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-accent-primary font-semibold">
            {formatCurrency(getValue())}
          </span>
        ),
        size: 130,
      }),
    ];

    return cols;
  }, [colH, editingCell, items, editValue, updateItem]);

  // Monitor-specific columns
  const monitorExtraCols = useMemo(
    () => [
      colH.accessor("tipo", {
        header: ({ column }) => (
          <SortableColumnHeader label="Tipo" column={column} />
        ),
        cell: ({ getValue }) => (
          <StatusBadge label={getValue() || ""} variant="tipo" />
        ),
        size: 100,
      }),
      colH.accessor("modello", {
        header: ({ column }) => (
          <SortableColumnHeader label="Modello" column={column} />
        ),
        cell: ({ getValue }) => (
          <span className="font-body text-text-primary">{getValue()}</span>
        ),
        size: 120,
      }),
      colH.accessor("marca", {
        header: ({ column }) => (
          <SortableColumnHeader label="Marca" column={column} />
        ),
        cell: ({ getValue }) => (
          <span className="font-body text-text-secondary">{getValue()}</span>
        ),
        size: 100,
      }),
      colH.accessor("scaffale", {
        header: ({ column }) => (
          <SortableColumnHeader label="Scaff." column={column} align="right" />
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-text-muted">{getValue()}</span>
        ),
        size: 70,
      }),
      colH.accessor("ripiano", {
        header: ({ column }) => (
          <SortableColumnHeader label="Rip." column={column} align="right" />
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-text-muted">{getValue()}</span>
        ),
        size: 70,
      }),
      colH.accessor("bancale", {
        header: ({ column }) => (
          <SortableColumnHeader label="Bancale" column={column} />
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-text-secondary">{getValue()}</span>
        ),
        size: 80,
      }),
      colH.accessor("grado", {
        header: ({ column }) => (
          <SortableColumnHeader label="Grado" column={column} />
        ),
        cell: ({ getValue }) => (
          <StatusBadge label={getValue() || ""} variant="grado" />
        ),
        size: 80,
      }),
    ],
    [colH],
  );

  const noteColumn = useMemo(
    () =>
      colH.accessor("note", {
        header: "Note",
        cell: ({ getValue }) => (
          <span
            className="font-body-small text-text-secondary truncate max-w-[250px] block"
            title={getValue()}
          >
            {getValue() || "-"}
          </span>
        ),
        size: 250,
        enableSorting: false,
      }),
    [colH],
  );

  const sedeColumn = useMemo(
    () =>
      colH.accessor("sede", {
        header: ({ column }) => (
          <SortableColumnHeader label="Sede" column={column} />
        ),
        cell: ({ getValue }) => <SedeBadge sede={getValue()} />,
        size: 150,
      }),
    [colH],
  );

  const schedeNullaostaColumn = useMemo(
    () =>
      colH.accessor((row) => schedaNullaostaLabel(row).text, {
        id: "schedaNullaosta",
        header: ({ column }) => (
          <SortableColumnHeader label="Nullaosta" column={column} />
        ),
        cell: ({ row }) => {
          const label = schedaNullaostaLabel(row.original);
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded font-badge border text-xs max-w-[200px] truncate",
                label.kind === "nullaosta" &&
                  "bg-status-verde/15 text-status-verde border-status-verde/30",
                label.kind === "doc" &&
                  "bg-status-giallo/15 text-status-giallo border-status-giallo/30",
                label.kind === "none" &&
                  "bg-bg-hover text-text-muted border-border-default",
              )}
              title={label.text}
            >
              {label.text}
            </span>
          );
        },
        size: 180,
      }),
    [colH],
  );

  const verificaBancaleColumn = useMemo(
    () =>
      colH.accessor((row) => row.bancaleVerificato ?? false, {
        id: "verificaBancale",
        header: ({ column }) => (
          <SortableColumnHeader
            label="Verificato"
            column={column}
            align="center"
          />
        ),
        cell: ({ row }) => (
          <BancaleVerificaCell
            item={row.original}
            onToggle={toggleBancaleVerificaInTabella}
            disabled={!operatore}
          />
        ),
        size: 56,
        sortingFn: (a, b) =>
          Number(a.original.bancaleVerificato) -
          Number(b.original.bancaleVerificato),
      }),
    [colH, operatore],
  );

  const bancaleStatoOperativoColumn = useMemo(
    () =>
      colH.accessor(
        (row) =>
          normalizeBancaleStatoOperativo(row.bancaleStatoOperativo),
        {
          id: "bancaleStatoOperativo",
          header: ({ column }) => (
            <SortableColumnHeader label="Stato bancale" column={column} />
          ),
          cell: ({ row, getValue }) => (
            <BancaleStatoOperativoBadge
              stato={getValue()}
              nota={row.original.bancaleStatoOperativoNota}
            />
          ),
          size: 168,
        },
      ),
    [colH],
  );

  const categoriaColumn = useMemo(
    () =>
      colH.accessor("categoria", {
        id: "categoria",
        header: ({ column }) => (
          <SortableColumnHeader label="Categoria" column={column} />
        ),
        cell: ({ getValue }) => {
          const cat = getValue();
          return (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded font-badge border text-xs",
                CATEGORY_COLORS[cat] ??
                  "bg-bg-hover text-text-muted border-border-default",
              )}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </span>
          );
        },
        size: 120,
      }),
    [colH],
  );

  const lastModifiedColumn = useMemo(
    () =>
      colH.accessor((row) => row.updatedAt ?? "", {
        id: "ultimoAggiornamento",
        header: ({ column }) => (
          <SortableColumnHeader
            label="Ultimo agg."
            column={column}
            defaultDesc
          />
        ),
        cell: ({ row }) => <LastModifiedCell item={row.original} />,
        sortingFn: (a, b) => {
          const ta = a.original.updatedAt
            ? new Date(a.original.updatedAt).getTime()
            : 0;
          const tb = b.original.updatedAt
            ? new Date(b.original.updatedAt).getTime()
            : 0;
          return ta - tb;
        },
        size: 150,
      }),
    [colH],
  );

  const actionsColumn = useMemo(
    () =>
      colH.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(row.original);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-accent-primary hover:bg-bg-hover transition-colors"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                confirmDelete(row.original);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-muted hover:text-status-rosso hover:bg-bg-hover transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
        size: 90,
        enableSorting: false,
      }),
    [colH],
  );

  // Build final columns based on active tab
  const columns = useMemo(() => {
    if (activeTab === "monitor") {
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
              {"\u20AC"}
              {column.getIsSorted() === "asc" && <ChevronUp size={12} />}
              {column.getIsSorted() === "desc" && <ChevronDown size={12} />}
            </button>
          ),
          accessorKey: "prezzoUnitario",
        } as any,
        monitorExtraCols[3], // scaffale
        monitorExtraCols[4], // ripiano
        monitorExtraCols[5], // bancale
        bancaleStatoOperativoColumn,
        monitorExtraCols[6], // grado
        verificaBancaleColumn,
        lastModifiedColumn,
        actionsColumn,
      ];
    }

    if (activeTab === "tutti") {
      return [
        baseColumns[0],
        baseColumns[1],
        categoriaColumn,
        baseColumns[2],
        baseColumns[3],
        baseColumns[4],
        baseColumns[5],
        noteColumn,
        sedeColumn,
        verificaBancaleColumn,
        lastModifiedColumn,
        actionsColumn,
      ];
    }

    if (activeTab === "schede") {
      return [
        ...baseColumns,
        noteColumn,
        schedeNullaostaColumn,
        sedeColumn,
        lastModifiedColumn,
        actionsColumn,
      ];
    }

    return [
      ...baseColumns,
      noteColumn,
      sedeColumn,
      verificaBancaleColumn,
      lastModifiedColumn,
      actionsColumn,
    ];
  }, [
    activeTab,
    baseColumns,
    monitorExtraCols,
    categoriaColumn,
    noteColumn,
    schedeNullaostaColumn,
    bancaleStatoOperativoColumn,
    sedeColumn,
    verificaBancaleColumn,
    lastModifiedColumn,
    actionsColumn,
  ]);

  // ─── Table instance ──────────────────────────────────────
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, rowSelection, pagination, globalFilter },
    onSortingChange: handleSortingChange,
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
    setModalQuantita(1);
    setModalPrezzo(0);
    setModalFornitore("");
    setModalNote("");
    setShowNoteSection(false);
    setShowCronologiaSection(false);
    setModalBancaleVerificato(false);
    setModalBancaleStatoOperativo(null);
    setModalBancaleStatoNota("");
    setModalGradoMode("A");
    setModalGradoCustom("");
    setModalTipoMode("LED19");
    setModalTipoCustom("");
    setModalDocInviataAt(undefined);
    setModalNullaostaRicevuto(false);
    setModalNullaostaAt(undefined);
    setMovimentoQuantita("");
    setMovimentoNote("");
    setItemModalOpen(true);
  }

  function openEditModal(item: UnifiedItem) {
    if (!requireOperatore()) return;
    setEditingItem(item);
    setModalQuantita(item.quantita);
    setModalPrezzo(item.prezzoUnitario);
    setModalFornitore(item.fornitore || "");
    setModalNote(item.note || "");
    setShowNoteSection(false);
    setShowCronologiaSection(false);
    setModalBancaleVerificato(!!item.bancaleVerificato);
    setModalBancaleStatoOperativo(
      normalizeBancaleStatoOperativo(item.bancaleStatoOperativo),
    );
    setModalBancaleStatoNota(item.bancaleStatoOperativoNota || "");
    const gradoForm = gradoToFormState(item.grado);
    setModalGradoMode(gradoForm.mode);
    setModalGradoCustom(gradoForm.custom);
    const tipoForm = tipoToFormState(item.tipo, monitorTipoOptions);
    setModalTipoMode(tipoForm.mode);
    setModalTipoCustom(tipoForm.custom);
    const nullaosta = initSchedaNullaostaFromItem(item);
    setModalDocInviataAt(nullaosta.docInviataAt);
    setModalNullaostaRicevuto(nullaosta.nullaostaRicevuto);
    setModalNullaostaAt(nullaosta.nullaostaRicevutoAt);
    setMovimentoQuantita("");
    setMovimentoNote("");
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
          toast.success(
            `Eliminazione registrata · ${op} · '${itemToDelete.nome}'`,
            { duration: 5000 },
          );
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        },
        onError: () => toast.error("Errore durante eliminazione"),
      },
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
          toast.success(
            `Eliminazione registrata · ${op} · ${selectedIds.length} articoli`,
            { duration: 5000 },
          );
          setBulkDeleteOpen(false);
          setRowSelection({});
        },
        onError: () => toast.error("Errore durante eliminazione multipla"),
      },
    );
  }

  function parseMovimentoQuantita(): number | null {
    const qty = Number(movimentoQuantita);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Inserisci una quantita valida");
      return null;
    }
    return qty;
  }

  function applicaMovimentoMagazzino(action: "prelievo" | "carico") {
    const op = requireOperatore();
    if (!op || !editingItem) return;
    const delta = parseMovimentoQuantita();
    if (delta === null) return;

    let nuovaGiacenza: number;
    if (action === "prelievo") {
      if (delta > modalQuantita) {
        toast.error(
          `Prelievo superiore alla giacenza: massimo ${modalQuantita}`,
        );
        return;
      }
      nuovaGiacenza = modalQuantita - delta;
    } else {
      nuovaGiacenza = modalQuantita + delta;
    }

    const previous = { ...editingItem, quantita: modalQuantita };
    setMovimentoSaving(true);
    updateItem.mutate(
      {
        id: editingItem.id,
        operatore: op,
        previous,
        patch: { quantita: nuovaGiacenza },
        activityNote: movimentoNote,
      },
      {
        onSuccess: (data) => {
          setEditingItem(data);
          setModalQuantita(data.quantita);
          setMovimentoQuantita("");
          setMovimentoNote("");
          setShowCronologiaSection(true);
          void queryClient.invalidateQueries({
            queryKey: inventoryActivityQueryKey(editingItem.id),
          });
          toast.success(inventoryUpdateToast(op, data, action), {
            duration: 4000,
          });
        },
        onError: () => toast.error("Errore registrazione movimento"),
        onSettled: () => setMovimentoSaving(false),
      },
    );
  }

  function salvaNotaArticolo() {
    if (!editingItem) return;
    const op = requireOperatore();
    if (!op) return;
    setNotaSaving(true);
    updateItem.mutate(
      {
        id: editingItem.id,
        operatore: op,
        previous: editingItem,
        patch: { note: modalNote },
        skipActivityLog: true,
      },
      {
        onSuccess: (data) => {
          setEditingItem(data);
          setModalNote(data.note || "");
          toast.success("Nota salvata");
        },
        onError: () => toast.error("Errore salvataggio nota"),
        onSettled: () => setNotaSaving(false),
      },
    );
  }

  function handleSaveItem(formData: FormData) {
    const op = requireOperatore();
    if (!op) return;
    const nome = formData.get("nome") as string;
    const quantita = Number(formData.get("quantita"));
    const prezzo = Number(formData.get("prezzo"));
    const sede = formData.get("sede") as Sede;

    const onDone = () => {
      setItemModalOpen(false);
      setEditingItem(null);
      setSorting(DEFAULT_TABLE_SORTING);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    };

    const isMonitorForm =
      activeTab === "monitor" || editingItem?.categoria === "monitor";
    if (
      isMonitorForm &&
      modalGradoMode === GRADO_CUSTOM_VALUE &&
      !modalGradoCustom.trim()
    ) {
      toast.error("Inserisci un grado personalizzato");
      return;
    }
    if (
      isMonitorForm &&
      modalTipoMode === TIPO_CUSTOM_VALUE &&
      !modalTipoCustom.trim()
    ) {
      toast.error("Inserisci un tipo personalizzato");
      return;
    }
    const gradoSalvato = isMonitorForm
      ? resolveGradoValue(modalGradoMode, modalGradoCustom, "A")
      : undefined;
    const tipoSalvato = isMonitorForm
      ? resolveTipoValue(modalTipoMode, modalTipoCustom, "LED19")
      : undefined;

    const isSchedeForm =
      activeTab === "schede" || editingItem?.categoria === "schede";
    const schedeNullaostaPatch = isSchedeForm
      ? {
          schedaDocInviataAt: toDateIso(modalDocInviataAt),
          nullaostaRicevutoAt: modalNullaostaRicevuto
            ? toDateIso(modalNullaostaAt ?? new Date())
            : null,
        }
      : {};

    const monitorBancalePatch = isMonitorForm
      ? {
          bancaleStatoOperativo: modalBancaleStatoOperativo,
          bancaleStatoOperativoNota: modalBancaleStatoNota.trim() || null,
        }
      : {};

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
            fornitore: modalFornitore.trim() || null,
            sede,
            tipo: tipoSalvato ?? editingItem.tipo,
            modello: (formData.get("modello") as string) || editingItem.modello,
            marca: (formData.get("marca") as string) || editingItem.marca,
            ...(isMonitorForm ? { grado: gradoSalvato } : {}),
            scaffale: Number(formData.get("scaffale")) || editingItem.scaffale,
            ripiano: Number(formData.get("ripiano")) || editingItem.ripiano,
            bancale: (formData.get("bancale") as string) || editingItem.bancale,
            ...(editingItem.categoria !== "schede"
              ? { bancaleVerificato: modalBancaleVerificato }
              : {}),
            ...monitorBancalePatch,
            ...schedeNullaostaPatch,
          },
        },
        {
          onSuccess: (data) => {
            const action = resolveQuantityAction(previous.quantita, quantita);
            const nullaostaNuovo =
              isSchedeForm &&
              modalNullaostaRicevuto &&
              !previous.nullaostaRicevutoAt &&
              data.nullaostaPrezzoIncrementato;
            toast.success(
              nullaostaNuovo
                ? `${inventoryUpdateToast(op, data, action)} · Prezzo +100 € (nullaosta)`
                : inventoryUpdateToast(op, data, action),
              { duration: 5000 },
            );
            onDone();
          },
          onError: () => toast.error("Errore aggiornamento articolo"),
        },
      );
    } else {
      const cat = activeTab === "tutti" ? "schede" : (activeTab as Category);
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
            fornitore: modalFornitore.trim() || null,
            note: "",
            ...(cat !== "schede"
              ? { bancaleVerificato: modalBancaleVerificato }
              : {}),
            sede: sede || "Magazzino Principale",
            ...(cat === "schede" ? schedeNullaostaPatch : {}),
            ...(cat === "monitor"
              ? {
                  tipo: tipoSalvato ?? "LED19",
                  modello: (formData.get("modello") as string) || "",
                  marca: (formData.get("marca") as string) || "",
                  grado: gradoSalvato ?? "A",
                  scaffale: Number(formData.get("scaffale")) || 1,
                  ripiano: Number(formData.get("ripiano")) || 1,
                  bancale: (formData.get("bancale") as string) || "A",
                  bancaleStatoOperativo: modalBancaleStatoOperativo,
                  bancaleStatoOperativoNota: modalBancaleStatoNota.trim() || null,
                }
              : {}),
          },
        },
        {
          onSuccess: (data) => {
            toast.success(inventoryUpdateToast(op, data, "creazione"), {
              duration: 5000,
            });
            onDone();
          },
          onError: () => toast.error("Errore creazione articolo"),
        },
      );
    }
  }

  function resetFilters() {
    setGlobalFilter("");
    setFilterQtyMin("");
    setFilterQtyMax("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterGrado("");
    setFilterSede("");
    setFilterBancaleVerifica("tutti");
  }

  const hasFilters = Boolean(
    globalFilter ||
    filterQtyMin ||
    filterQtyMax ||
    filterPriceMin ||
    filterPriceMax ||
    filterGrado ||
    filterSede ||
    (activeTab !== "schede" && filterBancaleVerifica !== "tutti"),
  );

  function handleExport(scope: ExportScope) {
    try {
      const filteredExportLabel =
        scope.type === "filtered"
          ? activeTab === "tutti"
            ? hasFilters
              ? "tutti_filtrato"
              : "tutti"
            : hasFilters
              ? `${activeTab}_filtrato`
              : activeTab
          : "";

      const resolvedScope: ExportScope =
        scope.type === "filtered"
          ? { type: "filtered", label: filteredExportLabel }
          : scope;

      const dataForScope =
        scope.type === "selection"
          ? selectedRows.map((r) => r.original)
          : scope.type === "filtered"
            ? filteredData
            : items;

      const { count, filename } = exportInventoryToExcel(
        items,
        resolvedScope,
        dataForScope,
      );
      toast.success(`Esportati ${count} articoli in ${filename}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Errore durante esportazione",
      );
    }
  }

  async function handleImportFile(file: File) {
    const op = requireOperatore();
    if (!op) return;

    const fallbackCategory = activeTab === "tutti" ? undefined : activeTab;
    try {
      const { rows, warnings } = await parseInventoryImportFile(
        file,
        fallbackCategory,
      );
      if (!rows.length) {
        toast.error("Nessuna riga valida da importare");
        return;
      }

      let created = 0;
      let updated = 0;
      let skipped = warnings.length;
      const existingById = new Map(items.map((i) => [i.id, i]));
      const usedIds = new Set(items.map((i) => i.id));
      const categoryMax = {
        schede: 0,
        cabinet: 0,
        cambiamonete: 0,
        accessori: 0,
        monitor: 0,
      } as Record<Category, number>;

      items.forEach((it) => {
        const n = parseInt(it.id.split("-")[1] ?? "0", 10);
        if (Number.isFinite(n)) {
          categoryMax[it.categoria] = Math.max(categoryMax[it.categoria], n);
        }
      });

      for (const row of rows) {
        try {
          if (row.id && existingById.has(row.id)) {
            const previous = existingById.get(row.id)!;
            await updateItem.mutateAsync({
              id: row.id,
              operatore: op,
              previous,
              patch: row,
            });
            updated += 1;
            continue;
          }

          const item = { ...row };
          if (!item.id || usedIds.has(item.id)) {
            const cat = item.categoria;
            categoryMax[cat] += 1;
            const prefix = {
              schede: "SC",
              cabinet: "CB",
              cambiamonete: "CM",
              accessori: "AC",
              monitor: "MN",
            }[cat];
            item.id = `${prefix}-${String(categoryMax[cat]).padStart(3, "0")}`;
          }
          usedIds.add(item.id);
          await createItem.mutateAsync({ item, operatore: op });
          created += 1;
        } catch {
          skipped += 1;
        }
      }

      toast.success(
        `Import completato: ${created} creati, ${updated} aggiornati, ${skipped} scartati`,
        {
          duration: 7000,
        },
      );
      if (warnings.length) {
        toast.message("Righe scartate in parsing", {
          description: warnings.slice(0, 3).join(" · "),
          duration: 8000,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore import file");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  const currentCategoryLabel =
    activeTab === "tutti"
      ? "Tutti"
      : activeTab === "schede"
        ? "Schede"
        : activeTab === "cabinet"
          ? "Cabinet"
          : activeTab === "cambiamonete"
            ? "Cambia Monete"
            : activeTab === "accessori"
              ? "Accessori"
              : "Monitor";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner className="size-8 text-accent-primary" />
        <p className="font-body text-text-muted">
          Caricamento inventario da Supabase...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center max-w-md mx-auto">
        <p className="font-heading-3 text-status-rosso">
          Errore connessione database
        </p>
        <p className="font-body-small text-text-muted">
          {(error as Error).message}
        </p>
        <p className="font-caption text-text-muted">
          Progetto atteso: zewzttibcvuowskykega.supabase.co — se vedi
          zcgynarwbouaaamioegr, aggiorna le variabili Vercel e rifai deploy.
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
            <span
              className="cursor-pointer hover:text-text-secondary"
              onClick={() => (window.location.hash = "/")}
            >
              Dashboard
            </span>
            {" / "}
            <span className="text-text-secondary">Inventario</span>
          </p>
          <h1 className="font-display-lg text-text-primary mb-1">
            Inventario Magazzino
          </h1>
          <p className="font-body text-text-secondary">
            Gestione completa delle scorte — 5 categorie, {items.length}{" "}
            articoli
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImportFile(f);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload size={16} /> Importa Excel
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download size={16} /> Esporta Excel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 border-border-default bg-bg-surface text-text-primary"
            >
              <DropdownMenuLabel className="text-text-muted font-caption">
                Vista corrente ({filteredData.length} articoli)
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleExport({ type: "filtered", label: "" })}
              >
                Excel — tab e filtri attivi
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-subtle" />
              <DropdownMenuLabel className="text-text-muted font-caption">
                Per categoria (tutto il magazzino)
              </DropdownMenuLabel>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => {
                const count = items.filter((i) => i.categoria === cat).length;
                return (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() =>
                      handleExport({ type: "category", category: cat })
                    }
                    disabled={count === 0}
                  >
                    {CATEGORY_LABELS[cat]} ({count})
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator className="bg-border-subtle" />
              <DropdownMenuItem onClick={() => handleExport({ type: "all" })}>
                Excel — inventario completo ({items.length})
              </DropdownMenuItem>
              <p className="px-2 py-1.5 font-caption text-text-muted">
                Il file completo include fogli Riepilogo, Tutti e uno per
                categoria.
              </p>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            onClick={openAddModal}
            className="bg-accent-primary text-bg-base hover:bg-accent-secondary"
          >
            <Plus size={16} /> Nuovo Articolo
          </Button>
        </motion.div>
      </motion.div>

      {!operatore && (
        <motion.div
          {...fadeInUp}
          className="flex items-start gap-3 rounded-xl border border-status-arancione/40 bg-status-arancione/10 px-4 py-3"
        >
          <AlertCircle
            size={20}
            className="text-status-arancione shrink-0 mt-0.5"
          />
          <div>
            <p className="font-body text-status-arancione font-medium">
              Seleziona chi sta operando
            </p>
            <p className="font-body-small text-text-secondary mt-0.5">
              Ogni modifica o prelievo viene registrato con nome e orario, così
              il responsabile vede l&apos;ultimo aggiornamento di ogni articolo.
            </p>
          </div>
        </motion.div>
      )}

      {/* ═══ Category Tabs ═══ */}
      <motion.div
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, delay: 0.05 }}
      >
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
                  transition={{
                    delay: i * 0.05,
                    duration: 0.25,
                    ease: easeSmooth,
                  }}
                  onClick={() => handleTabChange(tab.key as Category | "tutti")}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 font-nav-label transition-colors",
                    isActive
                      ? "text-accent-primary"
                      : "text-text-muted hover:text-text-secondary",
                  )}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold",
                      isActive
                        ? "bg-accent-primary/15 text-accent-primary"
                        : "bg-bg-hover text-text-muted",
                    )}
                  >
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

      {activeTab === "schede" && (
        <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.08 }}>
          <SchedePrenotatePanel
            operatore={operatore}
            requireOperatore={requireOperatore}
          />
        </motion.div>
      )}

      {/* ═══ Search & Filter Bar ═══ */}
      <motion.div
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, delay: 0.1 }}
        className="flex flex-wrap items-center gap-3 bg-bg-elevated border border-border-subtle rounded-xl p-3"
      >
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 h-9 shrink-0",
            operatore
              ? "border-border-default bg-bg-surface"
              : "border-status-arancione/50 bg-status-arancione/10",
          )}
        >
          <User
            size={16}
            className={
              operatore ? "text-text-muted" : "text-status-arancione shrink-0"
            }
          />
          <Select
            value={operatore ?? OPERATOR_PLACEHOLDER}
            onValueChange={(value) =>
              setOperatore(
                value === OPERATOR_PLACEHOLDER ? null : (value as Operatore),
              )
            }
          >
            <SelectTrigger
              aria-label="Operatore"
              className="h-8 min-w-[128px] border-0 bg-transparent px-1 shadow-none text-text-primary focus-visible:ring-0 data-[placeholder]:text-text-muted"
            >
              <SelectValue placeholder="Chi sei?" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="z-[100] border-border-default bg-bg-surface text-text-primary"
            >
              <SelectItem
                value={OPERATOR_PLACEHOLDER}
                className="text-text-muted focus:bg-bg-hover focus:text-text-primary"
              >
                Chi sei?
              </SelectItem>
              {OPERATORS.map((name) => (
                <SelectItem
                  key={name}
                  value={name}
                  className="focus:bg-accent-primary/15 focus:text-accent-primary"
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-[400px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Cerca articolo, codice, marca..."
            className="pl-9 pr-8 bg-bg-surface border-border-default text-text-primary placeholder:text-text-muted focus:border-accent-primary"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {activeTab !== "schede" && (
        <div className="flex items-center gap-1 shrink-0">
          {(
            [
              { key: "tutti" as const, label: "Tutti" },
              { key: "verificati" as const, label: "Verificati" },
              { key: "da_verificare" as const, label: "Da verificare" },
            ] as const
          ).map(({ key, label }) => (
            <Button
              key={key}
              type="button"
              variant={filterBancaleVerifica === key ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 px-2.5 text-xs",
                filterBancaleVerifica === key &&
                  "bg-accent-primary text-bg-base",
              )}
              onClick={() => {
                setFilterBancaleVerifica(key);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              {label}
            </Button>
          ))}
        </div>
        )}

        <div className="flex flex-wrap items-center gap-2 shrink-0 border-l border-border-subtle pl-3">
          <Input
            value={labelSearchArticolo}
            onChange={(e) => setLabelSearchArticolo(e.target.value)}
            placeholder="ID / articolo"
            className="h-8 w-[120px] sm:w-[140px] bg-bg-surface border-border-default text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") stampaEtichettaDaToolbar();
            }}
          />
          <select
            value={labelSearchBancale}
            onChange={(e) => setLabelSearchBancale(e.target.value)}
            aria-label="Bancale etichetta"
            className="h-8 rounded-md border border-border-default bg-bg-surface px-2 text-sm text-text-primary focus:border-accent-primary focus:outline-none"
          >
            <option value="">Bancale</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={stampaEtichettaDaToolbar}
          >
            <Printer size={15} />
            Stampa etichetta
          </Button>
        </div>

        {/* Filter toggle */}
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-accent-primary text-bg-base" : ""}
        >
          <Filter size={16} /> Filtri{" "}
          {hasFilters && (
            <span className="w-2 h-2 rounded-full bg-accent-primary ml-1" />
          )}
        </Button>

        <div className="flex-1" />

        {/* Column visibility */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColMenu(!showColMenu)}
          >
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
                {table
                  .getAllLeafColumns()
                  .filter((c) => c.id !== "select" && c.id !== "actions")
                  .map((col) => (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 py-1.5 cursor-pointer hover:text-accent-primary transition-colors"
                    >
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
                      <span className="font-body-small text-text-secondary">
                        {COLUMN_LABELS[col.id] ?? col.id}
                      </span>
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
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: easeSmooth }}
            className="overflow-hidden"
          >
            <div className="bg-bg-surface border border-border-default rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <Label className="font-caption text-text-muted mb-1.5 block">
                  Q.tà min
                </Label>
                <Input
                  type="number"
                  value={filterQtyMin}
                  onChange={(e) => setFilterQtyMin(e.target.value)}
                  placeholder="0"
                  className="bg-bg-elevated border-border-default"
                />
              </div>
              <div>
                <Label className="font-caption text-text-muted mb-1.5 block">
                  Q.tà max
                </Label>
                <Input
                  type="number"
                  value={filterQtyMax}
                  onChange={(e) => setFilterQtyMax(e.target.value)}
                  placeholder="999"
                  className="bg-bg-elevated border-border-default"
                />
              </div>
              <div>
                <Label className="font-caption text-text-muted mb-1.5 block">
                  Prezzo min (€)
                </Label>
                <Input
                  type="number"
                  value={filterPriceMin}
                  onChange={(e) => setFilterPriceMin(e.target.value)}
                  placeholder="0"
                  className="bg-bg-elevated border-border-default"
                />
              </div>
              <div>
                <Label className="font-caption text-text-muted mb-1.5 block">
                  Prezzo max (€)
                </Label>
                <Input
                  type="number"
                  value={filterPriceMax}
                  onChange={(e) => setFilterPriceMax(e.target.value)}
                  placeholder="99999"
                  className="bg-bg-elevated border-border-default"
                />
              </div>
              {(activeTab === "monitor" || activeTab === "tutti") && (
                <div>
                  <Label className="font-caption text-text-muted mb-1.5 block">
                    Grado
                  </Label>
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
                <Label className="font-caption text-text-muted mb-1.5 block">
                  Sede
                </Label>
                <select
                  value={filterSede}
                  onChange={(e) => setFilterSede(e.target.value)}
                  className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                >
                  <option value="">Tutte</option>
                  {SEDI.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2 col-span-2 md:col-span-4 lg:col-span-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-text-muted hover:text-text-primary"
                >
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
                Ricerca: {globalFilter}{" "}
                <button onClick={() => setGlobalFilter("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filterQtyMin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Q.tà ≥ {filterQtyMin}{" "}
                <button onClick={() => setFilterQtyMin("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filterQtyMax && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Q.tà ≤ {filterQtyMax}{" "}
                <button onClick={() => setFilterQtyMax("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filterPriceMin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Prezzo ≥ €{filterPriceMin}{" "}
                <button onClick={() => setFilterPriceMin("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filterPriceMax && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Prezzo ≤ €{filterPriceMax}{" "}
                <button onClick={() => setFilterPriceMax("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filterGrado && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Grado: {filterGrado}{" "}
                <button onClick={() => setFilterGrado("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filterSede && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                Sede: {filterSede}{" "}
                <button onClick={() => setFilterSede("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {activeTab !== "schede" && filterBancaleVerifica !== "tutti" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent-muted border border-accent-primary/40 text-accent-primary font-body-small">
                {filterBancaleVerifica === "verificati"
                  ? "Solo verificati"
                  : "Da verificare"}{" "}
                <button
                  type="button"
                  onClick={() => setFilterBancaleVerifica("tutti")}
                >
                  <X size={12} />
                </button>
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
                <tr
                  key={hg.id}
                  className="bg-bg-surface border-b border-border-subtle sticky top-0 z-10"
                >
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="h-12 px-4 font-caption text-text-muted uppercase tracking-wider whitespace-nowrap"
                      style={{ width: h.getSize() }}
                    >
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <motion.tbody
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
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
                        "h-12 border-b border-border-subtle/50 transition-colors cursor-pointer group",
                        row.getIsSelected()
                          ? "bg-gradient-to-r from-[#D0FF5910] to-transparent border-l-[3px] border-l-accent-primary"
                          : "hover:bg-bg-hover border-l-[3px] border-l-transparent",
                        row.original.categoria === "schede" &&
                          row.original.nullaostaRicevutoAt &&
                          !row.getIsSelected() &&
                          "bg-status-verde/8 hover:bg-status-verde/12 border-l-status-verde/50",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 whitespace-nowrap">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
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
                <span className="font-body text-text-primary">
                  {selectedCount} articoli selezionati
                </span>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleExport({
                      type: "selection",
                    })
                  }
                >
                  <Download size={14} /> Esporta Excel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteOpen(true)}
                >
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
                Mostrando {pagination.pageIndex * pagination.pageSize + 1}-
                {Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  filteredData.length,
                )}{" "}
                di {filteredData.length}
              </span>
              <select
                value={pagination.pageSize}
                onChange={(e) =>
                  setPagination({
                    pageIndex: 0,
                    pageSize: Number(e.target.value),
                  })
                }
                className="h-7 rounded-md border border-border-default bg-bg-surface px-2 text-text-primary text-xs font-mono focus:border-accent-primary focus:outline-none"
              >
                {[10, 20, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
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
      <Dialog
        open={itemModalOpen}
        onOpenChange={(open) => {
          if (!open) (document.activeElement as HTMLElement | null)?.blur?.();
          setItemModalOpen(open);
          if (!open) {
            setEditingItem(null);
            setShowNoteSection(false);
            setShowCronologiaSection(false);
          }
        }}
      >
        <DialogContent
          className="bg-bg-surface border-border-default text-text-primary max-w-lg max-h-[90vh] overflow-y-auto"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-heading-2 text-text-primary">
              {editingItem
                ? `Modifica Articolo — ${editingItem.nome}`
                : `Nuovo Articolo — ${currentCategoryLabel}`}
            </DialogTitle>
            <DialogDescription className="text-text-muted font-body-small">
              {editingItem
                ? "Modifica i dettagli dell'articolo. La modifica sarà registrata a tuo nome."
                : "Inserisci i dettagli del nuovo articolo. La creazione sarà registrata a tuo nome."}
            </DialogDescription>
          </DialogHeader>
          {editingItem?.updatedAt && (
            <div className="rounded-lg border border-status-blu/30 bg-status-blu/10 px-3 py-2.5 -mt-1">
              <p className="font-caption text-status-blu uppercase tracking-wide mb-1">
                Ultimo aggiornamento registrato
              </p>
              <p className="font-body-small text-text-primary">
                {formatAbsoluteDateTime(editingItem.updatedAt)}
                {editingItem.lastModifiedBy
                  ? ` · ${editingItem.lastModifiedBy}`
                  : ""}
              </p>
              <p className="font-caption text-text-muted mt-1">
                ({formatRelativeTime(editingItem.updatedAt)})
              </p>
            </div>
          )}
          {operatore && (
            <p className="font-caption text-text-muted -mt-1">
              Stai operando come:{" "}
              <span className="text-accent-primary font-medium">
                {operatore}
              </span>
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
              <Input
                name="nome"
                defaultValue={editingItem?.nome || ""}
                required
                placeholder="Inserisci il nome dell'articolo"
                className="bg-bg-elevated border-border-default"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-text-secondary mb-1.5 block">
                  Quantita *
                </Label>
                <Input
                  name="quantita"
                  type="number"
                  min={0}
                  value={modalQuantita}
                  onChange={(e) =>
                    setModalQuantita(Math.max(0, Number(e.target.value || 0)))
                  }
                  required
                  className="bg-bg-elevated border-border-default"
                />
              </div>
              <div>
                <Label className="text-text-secondary mb-1.5 block">
                  Prezzo Unitario (€) *
                </Label>
                <Input
                  name="prezzo"
                  type="number"
                  min={0}
                  step={0.01}
                  value={modalPrezzo}
                  onChange={(e) =>
                    setModalPrezzo(Math.max(0, Number(e.target.value || 0)))
                  }
                  required
                  className="bg-bg-elevated border-border-default"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border-subtle bg-bg-elevated/40 p-3">
              <Label className="text-text-secondary mb-1.5 flex items-center gap-2">
                <Truck size={16} className="text-text-muted" />
                Fornitore
              </Label>
              <Input
                value={modalFornitore}
                onChange={(e) => setModalFornitore(e.target.value)}
                placeholder="es. nome fornitore o ragione sociale"
                className="bg-bg-elevated border-border-default"
                disabled={!operatore}
              />
              <p className="font-caption text-text-muted mt-1.5">
                Identifica da chi proviene l&apos;articolo (salvato con
                Salva modifiche).
              </p>
            </div>

            {editingItem && (
              <div className="rounded-lg border border-border-subtle bg-bg-elevated/40 p-3">
                <button
                  type="button"
                  onClick={() => setShowNoteSection((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <span className="font-caption text-text-muted uppercase tracking-wide">
                    Note
                  </span>
                  {showNoteSection ? (
                    <ChevronUp size={16} className="text-text-muted shrink-0" />
                  ) : (
                    <ChevronDown
                      size={16}
                      className="text-text-muted shrink-0"
                    />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {showNoteSection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 space-y-2 border-t border-border-subtle mt-3">
                        <Textarea
                          value={modalNote}
                          onChange={(e) => setModalNote(e.target.value)}
                          rows={3}
                          className="bg-bg-surface border-border-default text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={notaSaving || !operatore}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            salvaNotaArticolo();
                          }}
                        >
                          {notaSaving ? "Salvataggio..." : "Salva nota"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {editingItem && (
              <div className="rounded-lg border border-border-subtle bg-bg-elevated/40 p-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[88px]">
                    <Label className="text-text-secondary mb-1 block font-caption">
                      Quantita
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={movimentoQuantita}
                      onChange={(e) => setMovimentoQuantita(e.target.value)}
                      placeholder="es. 20"
                      disabled={movimentoSaving}
                      className="bg-bg-surface border-border-default h-9"
                    />
                  </div>
                  <div className="flex-[1.6] min-w-[220px]">
                    <Label className="text-text-secondary mb-1 block font-caption">
                      Nota movimento (facoltativa)
                    </Label>
                    <Input
                      type="text"
                      value={movimentoNote}
                      onChange={(e) => setMovimentoNote(e.target.value)}
                      placeholder="es. Cliente Rossi Gaming, prelevato da Marco..."
                      disabled={movimentoSaving}
                      className="bg-bg-surface border-border-default h-9"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={movimentoSaving}
                    onClick={() => applicaMovimentoMagazzino("prelievo")}
                    className="h-9 shrink-0 border-status-rosso/50 text-status-rosso hover:bg-status-rosso/10 hover:text-status-rosso"
                  >
                    Applica prelievo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={movimentoSaving}
                    onClick={() => applicaMovimentoMagazzino("carico")}
                    className="h-9 shrink-0 border-status-verde/50 text-status-verde hover:bg-status-verde/10 hover:text-status-verde"
                  >
                    Aggiungi stock
                  </Button>
                </div>
                <p className="font-caption text-text-muted mt-2">
                  Giacenza:{" "}
                  <span className="text-text-primary font-semibold">
                    {modalQuantita}
                  </span>
                </p>
                <MovimentiCronologia
                  entries={activityRows}
                  isLoading={activityLoading}
                  isError={activityError}
                  open={showCronologiaSection}
                  onOpenChange={setShowCronologiaSection}
                />
              </div>
            )}

            {/* Monitor extra fields */}
            {(activeTab === "monitor" ||
              editingItem?.categoria === "monitor") && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">
                      Tipo *
                    </Label>
                    <select
                      value={modalTipoMode}
                      onChange={(e) => {
                        const v = e.target.value as TipoFormMode;
                        setModalTipoMode(v);
                        if (v !== TIPO_CUSTOM_VALUE) setModalTipoCustom("");
                      }}
                      className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                    >
                      {monitorTipoOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value={TIPO_CUSTOM_VALUE}>
                        Altro (testo libero)
                      </option>
                    </select>
                    {modalTipoMode === TIPO_CUSTOM_VALUE && (
                      <Input
                        value={modalTipoCustom}
                        onChange={(e) => setModalTipoCustom(e.target.value)}
                        placeholder="es. 20, 17, 27..."
                        required
                        className="mt-2 bg-bg-elevated border-border-default"
                      />
                    )}
                  </div>
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">
                      Grado *
                    </Label>
                    <select
                      value={modalGradoMode}
                      onChange={(e) =>
                        setModalGradoMode(e.target.value as GradoFormMode)
                      }
                      className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                    >
                      {GRADI.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                      <option value={GRADO_CUSTOM_VALUE}>Altro (testo libero)</option>
                    </select>
                    {modalGradoMode === GRADO_CUSTOM_VALUE && (
                      <Input
                        value={modalGradoCustom}
                        onChange={(e) => setModalGradoCustom(e.target.value)}
                        placeholder="Scrivi il grado..."
                        required
                        className="mt-2 bg-bg-elevated border-border-default"
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">
                      Modello *
                    </Label>
                    <Input
                      name="modello"
                      defaultValue={editingItem?.modello || ""}
                      required
                      placeholder="es. 19P4Q"
                      className="bg-bg-elevated border-border-default"
                    />
                  </div>
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">
                      Marca *
                    </Label>
                    <Input
                      name="marca"
                      defaultValue={editingItem?.marca || ""}
                      required
                      placeholder="es. PHILIPS"
                      className="bg-bg-elevated border-border-default"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">
                      Scaffale
                    </Label>
                    <Input
                      name="scaffale"
                      type="number"
                      min={1}
                      defaultValue={editingItem?.scaffale || 1}
                      className="bg-bg-elevated border-border-default"
                    />
                  </div>
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">
                      Ripiano
                    </Label>
                    <Input
                      name="ripiano"
                      type="number"
                      min={1}
                      defaultValue={editingItem?.ripiano || 1}
                      className="bg-bg-elevated border-border-default"
                    />
                  </div>
                  <div>
                    <Label className="text-text-secondary mb-1.5 block">
                      Bancale
                    </Label>
                    <select
                      name="bancale"
                      defaultValue={editingItem?.bancale || "A"}
                      className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
                    >
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                    </select>
                  </div>
                </div>
              <BancaleStatoOperativoPanel
                stato={modalBancaleStatoOperativo}
                onStatoChange={setModalBancaleStatoOperativo}
                nota={modalBancaleStatoNota}
                onNotaChange={setModalBancaleStatoNota}
                item={editingItem}
                disabled={!operatore}
              />
              </>
            )}

            {activeTab !== "schede" &&
              editingItem?.categoria !== "schede" && (
                <BancaleVerificaPanel
                  checked={modalBancaleVerificato}
                  onCheckedChange={handleModalBancaleVerificatoChange}
                  item={editingItem}
                  disabled={!operatore}
                />
              )}

            {(activeTab === "schede" ||
              editingItem?.categoria === "schede") && (
              <SchedaNullaostaPanel
                docInviataAt={modalDocInviataAt}
                onDocInviataAtChange={setModalDocInviataAt}
                nullaostaRicevuto={modalNullaostaRicevuto}
                onNullaostaRicevutoChange={setModalNullaostaRicevuto}
                nullaostaRicevutoAt={modalNullaostaAt}
                onNullaostaRicevutoAtChange={setModalNullaostaAt}
                prezzoIncrementato={
                  editingItem?.nullaostaPrezzoIncrementato ?? false
                }
                disabled={!operatore}
              />
            )}

            <div>
              <Label className="text-text-secondary mb-1.5 block">Sede *</Label>
              <select
                name="sede"
                defaultValue={editingItem?.sede || "Magazzino Principale"}
                required
                className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 text-text-primary text-sm focus:border-accent-primary focus:outline-none"
              >
                {SEDI.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Live total */}
            <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 text-center">
              <span className="font-caption text-text-muted">
                Totale calcolato
              </span>
              <p className="font-data-md text-accent-primary mt-1">
                {formatCurrency(modalQuantita * modalPrezzo)}
              </p>
            </div>

            <DialogFooter className="gap-2 flex-wrap sm:justify-between">
              {editingItem && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto sm:mr-auto"
                  onClick={stampaEtichettaModale}
                >
                  <Printer size={16} />
                  Stampa etichetta
                </Button>
              )}
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setItemModalOpen(false);
                    setEditingItem(null);
                  }}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  className="bg-accent-primary text-bg-base hover:bg-accent-secondary"
                >
                  {editingItem ? "Salva Modifiche" : "Salva"}
                </Button>
              </div>
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
            <AlertDialogTitle className="font-heading-2 text-text-primary">
              Elimina Articolo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary font-body-small">
              Sei sicuro di voler eliminare '{itemToDelete?.nome}'? Questa
              azione non puo essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false);
                setItemToDelete(null);
              }}
            >
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Elimina
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Rimuovi verifica bancale ═══ */}
      <AlertDialog
        open={rimuoviVerificaOpen}
        onOpenChange={(open) => {
          setRimuoviVerificaOpen(open);
          if (!open) setPendingRimuoviVerifica(null);
        }}
      >
        <AlertDialogContent className="bg-bg-surface border-border-default text-text-primary max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading-2">
              Rimuovere verifica bancale?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary font-body-small">
              L&apos;articolo «{pendingRimuoviVerifica?.item.nome}» tornerà come
              da verificare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRimuoviVerificaOpen(false);
                setPendingRimuoviVerifica(null);
              }}
            >
              Annulla
            </Button>
            <Button onClick={confermaRimuoviVerificaBancale}>
              Rimuovi verifica
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
            <AlertDialogTitle className="font-heading-2 text-text-primary">
              Elimina {selectedCount} Articoli
            </AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary font-body-small">
              Sei sicuro di voler eliminare {selectedCount} articoli
              selezionati? Questa azione non puo essere annullata.
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

      <InventoryLabelSheet items={labelPrintItems} />
    </motion.div>
  );
}
