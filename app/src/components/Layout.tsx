import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bell, Settings } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import {
  isSupabaseConfigured,
  isWrongSupabaseProject,
  supabaseConfigError,
  supabaseProjectHost,
} from '@/lib/supabase';

const routeNames: Record<string, { title: string; breadcrumb: string }> = {
  '/': { title: 'Dashboard', breadcrumb: 'Dashboard' },
  '/inventario': { title: 'Inventario', breadcrumb: 'Inventario' },
  '/riparazioni': { title: 'Riparazioni', breadcrumb: 'Riparazioni' },
  '/modulistica': { title: 'Modulistica', breadcrumb: 'Modulistica' },
  '/supporto': { title: 'Supporto', breadcrumb: 'Supporto' },
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const routeInfo = routeNames[location.pathname] || { title: 'Page', breadcrumb: 'Page' };

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

          {/* Right: Search, Bell, Settings */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cerca..."
                className="h-9 w-[280px] bg-bg-surface border border-border-default rounded-md pl-9 pr-3 font-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
              />
            </div>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-rosso rounded-full" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-bg-hover transition-colors text-text-secondary hover:text-text-primary">
              <Settings size={18} />
            </button>
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
