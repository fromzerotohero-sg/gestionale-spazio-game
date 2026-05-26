import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Wrench,
  FileUp,
  Ticket,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Download,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';


const easeSmooth = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ───────────────────── DATA ───────────────────── */

const kpiData = [
  { label: 'SCHEDE', value: 26900, trend: 2.3, accent: false, category: 'schede' },
  { label: 'CABINET', value: 32210, trend: -1.1, accent: false, category: 'cabinet' },
  { label: 'CAMBIA MONETE', value: 23610, trend: 5.7, accent: true, category: 'cambiamonete' },
  { label: 'ACCESSORI', value: 21172.10, trend: 0, accent: false, category: 'accessori' },
  { label: 'MONITOR', value: 28686, trend: 12.4, accent: true, category: 'monitor' },
];

const totalValue = kpiData.reduce((acc, k) => acc + k.value, 0);

const chartData = [
  { name: 'Schede', value: 26900, color: '#D0FF59', items: 28 },
  { name: 'Cabinet', value: 32210, color: '#22C55E', items: 35 },
  { name: 'Cambia Monete', value: 23610, color: '#3B82F6', items: 22 },
  { name: 'Accessori', value: 21172, color: '#8B5CF6', items: 25 },
  { name: 'Monitor', value: 28686, color: '#F97316', items: 22 },
];

const alerts = [
  {
    id: 1,
    severity: 'rosso' as const,
    title: 'Scorte critiche — TELAI BISTROT',
    description: 'Quantita sotto la soglia minima: 92 unita rimaste',
    time: '2 ore fa',
  },
  {
    id: 2,
    severity: 'giallo' as const,
    title: 'Riparazione in attesa — EARTH NUOVO',
    description: 'Assegnazione tecnico pendente da 3 giorni',
    time: '1 giorno fa',
  },
  {
    id: 3,
    severity: 'verde' as const,
    title: 'Inventario aggiornato',
    description: 'Monitor Grado A: 21 nuovi articoli registrati',
    time: '3 giorni fa',
  },
];

const activities = [
  { id: 1, type: 'verde' as const, action: 'Aggiunto', item: 'APEX cambiamonete', user: 'Marco R.', time: '10 minuti fa' },
  { id: 2, type: 'blu' as const, action: 'Modificato', item: 'Quantita MASTER 5: 11 → 12', user: 'Luca B.', time: '2 ore fa' },
  { id: 3, type: 'arancione' as const, action: 'Riparazione avviata', item: 'EARTH cabinet #3', user: 'Tecnico A.', time: '5 ore fa' },
  { id: 4, type: 'blu' as const, action: 'Aggiornato prezzo', item: 'FULL METAL: €100 → €120', user: 'Admin', time: '1 giorno fa' },
  { id: 5, type: 'grigio' as const, action: 'Archiviato', item: 'REGAL DISTRUTTO', user: 'Sistema', time: '2 giorni fa' },
];

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

function KPICard({ kpi, index }: { kpi: typeof kpiData[0]; index: number }) {
  const navigate = useNavigate();
  const trendUp = kpi.trend > 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: easeSmooth }}
      whileHover={{ y: -1, borderColor: '#2A2A2A' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/inventario?categoria=${kpi.category}`)}
      className={`
        relative bg-bg-elevated rounded-xl p-6 text-left w-full
        border transition-shadow duration-200 hover:shadow-glow
        ${kpi.accent ? 'border-t border-t-[#D0FF5930]' : 'border-border-subtle'}
      `}
    >
      {kpi.accent && (
        <div className="absolute top-0 left-4 right-4 h-px card-border-top" />
      )}
      <p className="font-caption text-text-muted mb-3">{kpi.label}</p>
      <p className="font-data-lg text-text-primary">
        <CountUp target={kpi.value} decimals={kpi.label === 'ACCESSORI' ? 0 : 0} />
      </p>
      {kpi.trend !== 0 && (
        <div className="flex items-center gap-1 mt-2">
          {trendUp ? (
            <TrendingUp size={12} className="text-status-verde" />
          ) : (
            <TrendingDown size={12} className="text-status-rosso" />
          )}
          <span className={`font-caption ${trendUp ? 'text-status-verde' : 'text-status-rosso'}`}>
            {trendUp ? '+' : ''}{kpi.trend}%
          </span>
        </div>
      )}
    </motion.button>
  );
}

function HeroSection() {
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
          €132.578
        </motion.p>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: easeSmooth }}
          className="font-caption text-text-muted mb-6"
        >
          Aggiornato al 31/12/2025
        </motion.p>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.6, ease: easeSmooth }}
          className="flex items-center gap-3"
        >
          <span className="font-body-small text-text-secondary">132 articoli</span>
          <span className="w-px h-3 bg-border-subtle" />
          <span className="font-body-small text-text-secondary">5 categorie</span>
          <span className="w-px h-3 bg-border-subtle" />
          <span className="font-body-small text-text-secondary">3 sedi</span>
        </motion.div>
      </div>
    </motion.section>
  );
}

function CategoryChart() {
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
              data={chartData}
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
              {chartData.map((entry, index) => (
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
        {chartData.map((item) => (
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

function CategoryList() {
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
        {chartData.map((item, index) => (
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

function AlertsSection() {
  const [dismissed, setDismissed] = useState<number[]>([]);
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

function ActivityTimeline() {
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
                  <span className="font-caption text-text-muted">{activity.user}</span>
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

      {/* Header actions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: easeSmooth }}
        className="flex items-center gap-3 mb-8"
      >
        <button className="h-10 px-4 rounded-lg border border-border-default bg-transparent font-body-small text-text-secondary hover:bg-bg-hover hover:text-text-primary hover:border-border-hover transition-colors">
          Ultimi 30 giorni
        </button>
        <button className="h-10 px-5 rounded-lg bg-accent-primary font-body-small font-semibold text-bg-base hover:bg-accent-secondary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
          <Download size={16} />
          Esporta Report
        </button>
      </motion.div>

      {/* Hero Section */}
      <HeroSection />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {kpiData.map((kpi, index) => (
          <KPICard key={kpi.label} kpi={kpi} index={index} />
        ))}
      </div>

      {/* Chart + Category List */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-2">
          <CategoryChart />
        </div>
        <div className="lg:col-span-3">
          <CategoryList />
        </div>
      </div>

      {/* Alerts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AlertsSection />
        <ActivityTimeline />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
