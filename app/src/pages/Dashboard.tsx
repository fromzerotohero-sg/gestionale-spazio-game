import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Wrench,
  FileUp,
  Ticket,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { fetchDashboardData } from '@/lib/dashboard-api';
import { useInventoryItems } from '@/hooks/use-inventory';


const easeSmooth = [0.16, 1, 0.3, 1] as [number, number, number, number];

const dotColors: Record<string, string> = {
  verde: '#22C55E',
  blu: '#3B82F6',
  arancione: '#F97316',
  grigio: '#525252',
};

const severityConfig = {
  rosso: { icon: AlertTriangle, gradient: 'status-gradient-rosso', border: 'border-status-rosso/30', color: '#EF4444' },
  giallo: { icon: Clock, gradient: 'status-gradient-giallo', border: 'border-status-giallo/30', color: '#EAB308' },
  verde: { icon: CheckCircle2, gradient: 'status-gradient-verde', border: 'border-status-verde/30', color: '#22C55E' },
};

/* ───────────────────── SUB-COMPONENTS ───────────────────── */

function CountUp({ target, duration = 1200, prefix = '€', decimals = 0 }: { target: number; duration?: number; prefix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start: number | null = null;
    let raf: number;

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * target);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isInView, target, duration]);

  const formatted = decimals > 0
    ? `${prefix}${display.toFixed(decimals).replace('.', ',')}`
    : `${prefix}${Math.round(display).toLocaleString('it-IT')}`;

  return <span ref={ref}>{formatted}</span>;
}

function KPICard({ cat, index }: { cat: { name: string; value: number; items: number; category: string; color: string }; index: number }) {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: easeSmooth }}
      whileHover={{ y: -1, borderColor: '#2A2A2A' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/inventario?categoria=${cat.category}`)}
      className="relative bg-bg-elevated rounded-xl p-6 text-left w-full border border-border-subtle transition-shadow duration-200 hover:shadow-glow"
    >
      <p className="font-caption text-text-muted mb-3">{(cat.name || cat.category).toUpperCase()}</p>
      <p className="font-data-lg text-text-primary">
        <CountUp target={cat.value} />
      </p>
      <div className="flex items-center gap-1 mt-2">
        <span className="font-caption text-text-muted">{cat.items} articoli</span>
      </div>
    </motion.button>
  );
}

function HeroSection({ totalValue, totalItems, categories }: { totalValue: number; totalItems: number; categories: number }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: easeSmooth }}
      className="relative w-full h-[320px] md:h-[320px] rounded-xl overflow-hidden mb-8"
      style={{ background: 'radial-gradient(circle at 50% 50%, #1A1A1A 0%, #050505 70%)' }}
    >
      {/* Glow behind image */}
      <div
        className="absolute right-[20%] top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full animate-pulse-glow pointer-events-none"
        style={{ background: 'radial-gradient(circle, #D0FF5920 0%, transparent 60%)' }}
      />

      {/* 3D Cabinet Image */}
      <motion.img
        src="/hero-3d-cabinet.png"
        alt="3D Cabinet"
        onLoad={() => setImgLoaded(true)}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: imgLoaded ? 1 : 0, x: imgLoaded ? 0 : 40 }}
        transition={{ duration: 0.6, delay: 0.2, ease: easeSmooth }}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-[90%] w-auto object-contain z-10"
      />

      {/* Text Overlay */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex flex-col justify-center pl-8 pr-[50%]">
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: easeSmooth }}
          className="font-caption text-text-muted mb-2"
        >
          VALORE TOTALE MAGAZZINO
        </motion.p>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease: easeSmooth }}
          className="font-data-lg text-accent-primary mb-1"
        >
          <CountUp target={totalValue} />
        </motion.p>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: easeSmooth }}
          className="font-caption text-text-muted mb-6"
        >
          Aggiornato in tempo reale
        </motion.p>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.6, ease: easeSmooth }}
          className="flex items-center gap-3"
        >
          <span className="font-body-small text-text-secondary">{totalItems} articoli</span>
          <span className="w-px h-3 bg-border-subtle" />
          <span className="font-body-small text-text-secondary">{categories} categorie</span>
          <span className="w-px h-3 bg-border-subtle" />
          <span className="font-body-small text-text-secondary">3 sedi</span>
        </motion.div>
      </div>
    </motion.section>
  );
}

function CategoryChart({ categories, totalValue }: { categories: { name: string; value: number; items: number; color: string }[]; totalValue: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4, ease: easeSmooth }}
      className="bg-bg-elevated border border-border-subtle rounded-xl p-6"
    >
      <h2 className="font-heading-2 text-text-primary mb-6">Distribuzione per Categoria</h2>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {categories.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                  style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-bg-surface border border-border-default rounded-md px-3 py-2 shadow-lg">
                    <p className="font-body-small text-text-primary">{d.name}</p>
                    <p className="font-mono text-accent-primary text-sm">
                      €{d.value.toLocaleString('it-IT')}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {categories.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="font-body-small text-text-secondary">{item.name}</span>
            <span className="font-mono text-xs text-text-muted ml-auto">
              {((item.value / totalValue) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CategoryList({ categories, totalValue }: { categories: { name: string; value: number; items: number; color: string }[]; totalValue: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5, ease: easeSmooth }}
      className="bg-bg-elevated border border-border-subtle rounded-xl p-6"
    >
      <h2 className="font-heading-2 text-text-primary mb-6">Dettaglio Categorie</h2>
      <div className="space-y-4">
        {categories.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.5 + index * 0.08, ease: easeSmooth }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-body text-text-primary flex-1">{item.name}</span>
              <span className="font-caption text-text-muted">{item.items} articoli</span>
              <span className="font-mono text-sm text-accent-primary">
                €{item.value.toLocaleString('it-IT')}
              </span>
            </div>
            <div className="mt-2 h-1 bg-border-subtle rounded-full overflow-hidden ml-5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isInView ? `${(item.value / totalValue) * 100}%` : 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1, ease: easeSmooth }}
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function AlertsSection({ alerts }: { alerts: { id: string; severity: "rosso" | "giallo" | "verde"; title: string; description: string; time: string }[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visibleAlerts = alerts.filter((a) => !dismissed.includes(a.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6, ease: easeSmooth }}
      className="bg-bg-elevated border border-border-subtle rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <h2 className="font-heading-2 text-text-primary">Allerte &amp; Avvisi</h2>
        {visibleAlerts.length > 0 && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-rosso opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-rosso" />
          </span>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {visibleAlerts.map((alert, index) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: easeSmooth }}
                className={`flex items-start gap-3 p-4 rounded-lg border ${config.gradient} ${config.border}`}
              >
                <Icon size={20} style={{ color: config.color }} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-body-small text-text-primary font-semibold">{alert.title}</p>
                  <p className="font-caption text-text-secondary mt-1">{alert.description}</p>
                  <p className="font-caption text-text-muted mt-1">{alert.time}</p>
                </div>
                <button
                  onClick={() => setDismissed((prev) => [...prev, alert.id])}
                  className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
                >
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {visibleAlerts.length < alerts.length && (
        <button
          onClick={() => setDismissed([])}
          className="mt-4 font-body-small text-accent-primary hover:text-accent-secondary transition-colors"
        >
          Ripristina avvisi
        </button>
      )}
    </motion.div>
  );
}

function ActivityTimeline({ activities }: { activities: { id: string; type: "verde" | "blu" | "arancione" | "grigio"; action: string; item: string; operatore: string; time: string }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7, ease: easeSmooth }}
      className="bg-bg-elevated border border-border-subtle rounded-xl p-6"
    >
      <h2 className="font-heading-2 text-text-primary mb-6">Attivita Recenti</h2>

      <div className="relative">
        {/* Vertical line */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 1.5, delay: 0.8, ease: easeSmooth }}
          className="absolute left-[4px] top-0 w-px bg-border-subtle"
        />

        <div className="space-y-6">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.8 + index * 0.08, ease: easeSmooth }}
              className="relative flex items-start gap-4 pl-6"
            >
              {/* Dot */}
              <div
                className="absolute left-0 top-1.5 w-[9px] h-[9px] rounded-full border-2 border-bg-elevated"
                style={{ backgroundColor: dotColors[activity.type] }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-body-small text-text-secondary">{activity.action}</span>
                  <span className="font-body-small text-text-primary font-medium hover:underline cursor-pointer">
                    {activity.item}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-caption text-text-muted">{activity.operatore}</span>
                  <span className="font-caption text-text-muted">·</span>
                  <span className="font-caption text-text-muted">{activity.time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { icon: Plus, label: 'Nuovo Articolo', action: () => {} },
    { icon: Wrench, label: 'Nuova Riparazione', action: () => navigate('/riparazioni') },
    { icon: FileUp, label: 'Carica Documento', action: () => {} },
    { icon: Ticket, label: 'Apri Ticket', action: () => navigate('/supporto') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 1.0, ease: easeSmooth }}
      className="fixed bottom-6 right-6 z-30 flex flex-col gap-3"
    >
      {actions.map((a, index) => (
        <motion.button
          key={a.label}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.0 + index * 0.06, ease: easeSmooth }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={a.action}
          className="group relative w-14 h-14 rounded-full bg-accent-primary flex items-center justify-center shadow-glow-accent hover:shadow-glow-accent transition-shadow"
        >
          <a.icon size={24} className="text-bg-base" />
          <span className="absolute right-full mr-3 px-2 py-1 bg-bg-surface border border-border-default rounded-md font-caption text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {a.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}

/* ───────────────────── MAIN DASHBOARD ───────────────────── */

export default function Dashboard() {
  const { data: items = [] } = useInventoryItems();
  const { data: dashData, isLoading, isError } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: fetchDashboardData,
    refetchInterval: 60000,
  });

  // Compute inventory stats from real items
  const catMap = new Map<string, { value: number; items: number; color: string; name: string }>();
  let totalValue = 0;
  let totalItems = 0;

  const CAT_COLORS: Record<string, string> = {
    schede: "#D0FF59", cabinet: "#22C55E", cambiamonete: "#3B82F6",
    accessori: "#8B5CF6", monitor: "#F97316",
  };
  const CAT_NAMES: Record<string, string> = {
    schede: "Schede", cabinet: "Cabinet", cambiamonete: "Cambia Monete",
    accessori: "Accessori", monitor: "Monitor",
  };

  for (const item of items as any[]) {
    const cat = item.categoria as string;
    if (!cat) continue;
    const prezzo = Number(item.prezzoUnitario ?? item.prezzo_unitario) || 0;
    const qty = Number(item.quantita) || 0;
    const val = prezzo * qty;
    totalValue += val;
    totalItems += qty;

    const existing = catMap.get(cat);
    if (existing) {
      existing.value += val;
      existing.items += qty;
    } else {
      catMap.set(cat, {
        value: val,
        items: qty,
        color: CAT_COLORS[cat] || "#525252",
        name: CAT_NAMES[cat] || cat,
      });
    }
  }

  const categories = Array.from(catMap.entries())
    .map(([category, data]) => ({ ...data, category }))
    .sort((a, b) => b.value - a.value);

  const alerts = dashData?.alerts ?? [];
  const activities = dashData?.activities ?? [];

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeSmooth }}
        className="mb-8"
      >
        <p className="font-caption text-text-muted mb-1">Dashboard</p>
        <h1 className="font-display-lg text-text-primary">Dashboard</h1>
        <p className="font-body text-text-secondary mt-2">Panoramica del magazzino Spazio Games</p>
      </motion.div>

      {/* Hero Section */}
      {isLoading ? (
        <div className="w-full h-[320px] rounded-xl mb-8 bg-bg-elevated animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="w-full h-[120px] rounded-xl mb-8 bg-status-rosso/10 border border-status-rosso/30 flex items-center justify-center">
          <p className="text-status-rosso font-body">Errore nel caricamento dati</p>
        </div>
      ) : (
        <HeroSection totalValue={totalValue} totalItems={totalItems} categories={categories.length} />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {categories.map((cat, index) => (
          <KPICard key={cat.category} cat={cat} index={index} />
        ))}
      </div>

      {/* Chart + Category List */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-2">
          <CategoryChart categories={categories} totalValue={totalValue} />
        </div>
        <div className="lg:col-span-3">
          <CategoryList categories={categories} totalValue={totalValue} />
        </div>
      </div>

      {/* Alerts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AlertsSection alerts={alerts} />
        <ActivityTimeline activities={activities} />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
