import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { CATEGORY_LABELS } from '@/lib/inventory-export';
import { formatLabelLocation } from '@/lib/inventory-label-print';
import type { UnifiedItem } from '@/types/inventory';
import '@/styles/inventory-label.css';

function LabelCard({ item }: { item: UnifiedItem }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const location = formatLabelLocation(item);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void QRCode.toCanvas(canvas, item.id, { width: 88, margin: 1 });
  }, [item.id]);

  return (
    <article className="inventory-label-card">
      <div className="inventory-label-card__body">
        <div>
          <p className="inventory-label-card__id">{item.id}</p>
          <p className="inventory-label-card__nome">{item.nome}</p>
          <p className="inventory-label-card__meta">
            {CATEGORY_LABELS[item.categoria]}
            {item.grado ? ` · Grado ${item.grado}` : ''}
          </p>
          {location ? <p className="inventory-label-card__meta">{location}</p> : null}
        </div>
        <p className="inventory-label-card__brand">Spazio Games</p>
      </div>
      <div className="inventory-label-card__qr">
        <canvas ref={canvasRef} aria-hidden />
      </div>
    </article>
  );
}

export function InventoryLabelSheet({ items }: { items: UnifiedItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="inventory-label-print-root" aria-hidden>
      <div className="inventory-label-sheet">
        {items.map((item) => (
          <LabelCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
