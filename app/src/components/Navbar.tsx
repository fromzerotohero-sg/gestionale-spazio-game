import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Wrench,
  FileText,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Inventario', path: '/inventario' },
  { icon: Wrench, label: 'Riparazioni', path: '/riparazioni' },
  { icon: FileText, label: 'Modulistica', path: '/modulistica' },
  { icon: Headphones, label: 'Supporto', path: '/supporto' },
];

interface NavbarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Navbar({ collapsed, onToggleCollapse }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="h-screen bg-bg-elevated border-r border-border-subtle flex flex-col fixed left-0 top-0 z-50"
    >
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border-subtle">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 flex-shrink-0 bg-accent-primary rounded-lg flex items-center justify-center">
            <span className="text-bg-base font-extrabold text-sm">SG</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-heading-3 text-text-primary whitespace-nowrap"
              >
                SPAZIO GAMES
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                w-full flex items-center gap-3 h-10 px-3 rounded-lg transition-colors duration-150 relative
                ${isActive
                  ? 'text-accent-primary bg-[#D0FF5915]'
                  : hoveredItem === item.path
                    ? 'text-text-secondary bg-bg-hover'
                    : 'text-text-muted bg-transparent'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent-primary rounded-r-full"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                />
              )}
              <Icon size={20} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="font-nav-label whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-subtle p-3 space-y-2">
        {/* User avatar */}
        <div className="flex items-center gap-3 px-2 h-10">
          <div className="w-8 h-8 rounded-full bg-border-hover flex items-center justify-center flex-shrink-0">
            <span className="font-body-small font-semibold text-text-muted">SG</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="font-body-small text-text-primary truncate">Spazio Games</p>
                <p className="font-caption text-text-muted">Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center h-8 rounded-lg hover:bg-bg-hover transition-colors text-text-muted hover:text-text-secondary"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
