import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bell, X, AlertTriangle, Clock, User, Calendar } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import {
  isSupabaseConfigured,
  isWrongSupabaseProject,
  supabaseConfigError,
  supabaseProjectHost,
} from '@/lib/supabase';
import { fetchComunicazioni, updateComunicazione, type Comunicazione, type Operatore } from '@/lib/comunicazioni-api';

const UTENTE_KEY = 'comunicazioni_utente';
const OPERATORI: Operatore[] = ['Giangrossi', 'Irene', 'Matteo', 'Paolo'];

function getUtenteCorrente(): Operatore {
  try {
    const saved = localStorage.getItem(UTENTE_KEY);
    if (saved && OPERATORI.includes(saved as Operatore)) return saved as Operatore;
  } catch { /* ignore */ }
  return 'Giangrossi';
}

interface Notifica {
  id: string;
  tipo: 'per_me' | 'urgente' | 'scaduta' | 'in_scadenza';
  messaggio: string;
  comunicazioneId: string;
}

const routeNames: Record<string, { title: string; breadcrumb: string }> = {
  '/': { title: 'Dashboard', breadcrumb: 'Dashboard' },
  '/inventario': { title: 'Inventario', breadcrumb: 'Inventario' },
  '/riparazioni': { title: 'Riparazioni Esterne', breadcrumb: 'Rip. Esterne' },
  '/modulistica': { title: 'Modulistica', breadcrumb: 'Modulistica' },
  '/supporto': { title: 'Supporto', breadcrumb: 'Supporto' },
  '/qr-pvr': { title: 'Generatore QR PVR', breadcrumb: 'QR PVR' },
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [comunicazioni, setComunicazioni] = useState<Comunicazione[]>([]);
  const [notificheAperte, setNotificheAperte] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const routeInfo = routeNames[location.pathname] || { title: 'Page', breadcrumb: 'Page' };

  /* Carica comunicazioni per notifiche */
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    fetchComunicazioni().then(setComunicazioni).catch(() => {});
  }, []);

  /* Chiudi dropdown cliccando fuori */
  useEffect(() => {
    if (!notificheAperte) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotificheAperte(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notificheAperte]);

  /* Re-read operatore da localStorage ad ogni cambio pagina */
  const [utente, setUtente] = useState(getUtenteCorrente);
  useEffect(() => {
    setUtente(getUtenteCorrente());
  }, [location.pathname]);

  const notifiche = useMemo(() => {
    const result: Notifica[] = [];
    const now = Date.now();
    const giornoMs = 24 * 60 * 60 * 1000;

    for (const c of comunicazioni) {
      if (c.archiviata) continue;

      // Comunicazioni indirizzate a me non archiviate
      if (c.destinatario?.includes(utente)) {
        result.push({
          id: c.id + '_per_me',
          tipo: 'per_me',
          messaggio: c.messaggio.length > 80 ? c.messaggio.slice(0, 80) + '...' : c.messaggio,
          comunicazioneId: c.id,
        });
      }

      // Urgenti non archiviate
      if (c.urgente) {
        result.push({
          id: c.id + '_urgente',
          tipo: 'urgente',
          messaggio: (c.messaggio.length > 80 ? c.messaggio.slice(0, 80) + '...' : c.messaggio),
          comunicazioneId: c.id,
        });
      }

      // Scadute
      if (c.scadenza && new Date(c.scadenza).getTime() <= now) {
        result.push({
          id: c.id + '_scaduta',
          tipo: 'scaduta',
          messaggio: (c.messaggio.length > 80 ? c.messaggio.slice(0, 80) + '...' : c.messaggio),
          comunicazioneId: c.id,
        });
      }
      // In scadenza (oggi o domani)
      if (c.scadenza) {
        const diff = new Date(c.scadenza).getTime() - now;
        if (diff > 0 && diff <= 2 * giornoMs) {
          result.push({
            id: c.id + '_in_scadenza',
            tipo: 'in_scadenza',
            messaggio: (c.messaggio.length > 80 ? c.messaggio.slice(0, 80) + '...' : c.messaggio),
            comunicazioneId: c.id,
          });
        }
      }
    }

    return result;
  }, [comunicazioni, utente]);

  /* Archivia una notifica (archivia la comunicazione su Supabase) */
  const handleArchiviaNotifica = useCallback(async (id: string) => {
    try {
      await updateComunicazione(id, { archiviata: true });
      setComunicazioni((prev) => prev.map((c) => c.id === id ? { ...c, archiviata: true } : c));
    } catch { /* ignore */ }
  }, []);

  /* Archivia tutte */
  const handleArchiviaTutte = useCallback(async () => {
    const ids = [...new Set(notifiche.map((n) => n.comunicazioneId))];
    for (const id of ids) {
      try {
        await updateComunicazione(id, { archiviata: true });
        setComunicazioni((prev) => prev.map((c) => c.id === id ? { ...c, archiviata: true } : c));
      } catch { /* ignore */ }
    }
  }, [notifiche]);

  return (
    <div className="flex min-h-[100dvh] bg-bg-base">
      <Navbar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      <motion.div
        initial={false}
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="flex-1 flex flex-col min-w-0"
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 bg-bg-elevated border-b border-border-subtle flex items-center justify-between px-8">
          {/* Left: Breadcrumb + Title */}
          <div>
            <p className="font-caption text-text-muted">{routeInfo.breadcrumb}</p>
            <h1 className="font-heading-1 text-text-primary">{routeInfo.title}</h1>
          </div>

          {/* Right: Search + Notifiche */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cerca..."
                className="h-9 w-[280px] bg-bg-surface border border-border-default rounded-md pl-9 pr-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
              />
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setNotificheAperte(!notificheAperte)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary"
              >
                <Bell size={18} />
                {notifiche.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-status-rosso rounded-full">
                    {notifiche.length > 9 ? '9+' : notifiche.length}
                  </span>
                )}
              </button>

              {/* Dropdown notifiche */}
              {notificheAperte && (
                <div className="absolute right-0 top-full mt-2 w-[380px] bg-bg-surface border border-border-default rounded-xl shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                    <h3 className="font-semibold text-sm text-text-primary">Notifiche</h3>
                    <button onClick={() => setNotificheAperte(false)} className="text-text-muted hover:text-text-primary transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifiche.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-text-muted">
                        <Bell size={24} className="mb-2 opacity-40" />
                        <p className="text-sm">Nessuna notifica</p>
                      </div>
                    ) : (
                      notifiche.map((n) => (
                        <NotificaRow
                          key={n.id}
                          notifica={n}
                          onArchivia={handleArchiviaNotifica}
                        />
                      ))
                    )}
                  </div>
                  {notifiche.length > 0 && (
                    <button
                      onClick={handleArchiviaTutte}
                      className="w-full px-4 py-2.5 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors border-t border-border-subtle text-center"
                    >
                      Archivia tutte
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-x-hidden">
          {!isSupabaseConfigured && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-status-arancione/40 bg-status-arancione/10 px-4 py-3 text-sm text-status-arancione"
            >
              {supabaseConfigError}
            </div>
          )}
          {isWrongSupabaseProject && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-status-rosso/40 bg-status-rosso/10 px-4 py-3 text-sm text-status-rosso"
            >
              Progetto Supabase errato ({supabaseProjectHost}). Usa zewzttibcvuowskykega.supabase.co e la
              relativa anon key, poi Redeploy su Vercel.
            </div>
          )}
          {children}
        </main>

        <Footer />
      </motion.div>
    </div>
  );
}

/* ------------ RIGA NOTIFICA ------------ */

function NotificaRow({ notifica, onArchivia }: { notifica: Notifica; onArchivia: (id: string) => void }) {
  const icona = {
    per_me: <User size={14} />,
    urgente: <AlertTriangle size={14} />,
    scaduta: <Clock size={14} />,
    in_scadenza: <Calendar size={14} />,
  }[notifica.tipo];

  const colore = {
    per_me: '#22C55E',
    urgente: '#EF4444',
    scaduta: '#EF4444',
    in_scadenza: '#EAB308',
  }[notifica.tipo];

  const label = {
    per_me: 'Per te',
    urgente: 'Urgente',
    scaduta: 'Scaduta',
    in_scadenza: 'In scadenza',
  }[notifica.tipo];

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-bg-hover transition-colors border-b border-border-subtle last:border-b-0 group">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: colore + '15', color: colore }}
      >
        {icona}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: colore }}>
            {label}
          </span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
          {notifica.messaggio}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onArchivia(notifica.comunicazioneId); }}
        title="Archivia"
        className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-bg-hover text-text-muted hover:text-text-primary transition-all flex-shrink-0 mt-0.5"
      >
        <X size={12} />
      </button>
    </div>
  );
}
