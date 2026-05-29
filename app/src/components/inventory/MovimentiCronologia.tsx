import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatAbsoluteDateTime, formatRelativeTime } from '@/lib/inventory-tracking';
import type { InventoryActivityEntry } from '@/types/inventory';
import { Spinner } from '@/components/ui/spinner';

export function MovimentiCronologia({
  entries,
  isLoading,
  isError,
  open,
  onOpenChange,
}: {
  entries: InventoryActivityEntry[];
  isLoading?: boolean;
  isError?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="mt-3 border-t border-border-subtle pt-3">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="font-caption text-text-muted uppercase tracking-wide">Cronologia movimenti</span>
        {open ? (
          <ChevronUp size={16} className="text-text-muted shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-text-muted shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {isLoading && (
                <div className="flex justify-center py-3">
                  <Spinner className="text-text-muted size-5" />
                </div>
              )}

              {isError && <p className="font-caption text-status-rosso">Cronologia non disponibile.</p>}

              {!isLoading && !isError && entries.length === 0 && (
                <p className="font-caption text-text-muted">Nessun movimento.</p>
              )}

              {!isLoading && !isError && entries.length > 0 && (
                <ul className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {entries.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-start gap-2 py-1 border-b border-border-subtle/50 last:border-0"
                    >
                      {row.action === 'prelievo' ? (
                        <ArrowDownRight size={13} className="text-status-rosso shrink-0 mt-0.5" />
                      ) : (
                        <ArrowUpRight size={13} className="text-status-verde shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-caption text-text-secondary leading-snug">{row.summary}</p>
                        <p
                          className="font-caption text-text-muted mt-0.5"
                          title={formatAbsoluteDateTime(row.createdAt)}
                        >
                          <Clock size={10} className="inline mr-1" />
                          {formatRelativeTime(row.createdAt)} · {row.operatore}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
