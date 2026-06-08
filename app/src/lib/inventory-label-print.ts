import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CATEGORY_LABELS } from "@/lib/inventory-export";
import type { UnifiedItem } from "@/types/inventory";

export function findItemsForLabelPrint(
  items: UnifiedItem[],
  articoloQuery: string,
  bancaleFilter: string,
): UnifiedItem[] {
  let data = items;
  const q = articoloQuery.trim().toLowerCase();

  if (q) {
    data = data.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.nome.toLowerCase().includes(q) ||
        (i.modello || "").toLowerCase().includes(q) ||
        (i.marca || "").toLowerCase().includes(q),
    );
  }

  const b = bancaleFilter.trim().toUpperCase();
  if (b) {
    data = data.filter((i) => (i.bancale || "").toUpperCase() === b);
  }

  return data;
}

export function formatLabelCliente(item: UnifiedItem): string {
  const v = item.fornitore?.trim();
  return v || "—";
}

export function formatLabelTipoProdotto(item: UnifiedItem): string {
  const cat = CATEGORY_LABELS[item.categoria] ?? item.categoria;
  if (item.categoria === "monitor" && item.tipo) {
    return `${cat} · ${item.tipo}`;
  }
  return cat;
}

export function formatLabelDataStampa(): string {
  return format(new Date(), "d MMMM yyyy", { locale: it });
}

export function formatLabelVerificato(item: UnifiedItem): string {
  return item.bancaleVerificato ? "Sì" : "No";
}

export function formatLabelModello(item: UnifiedItem): string {
  const modello = item.modello?.trim();
  const marca = item.marca?.trim();
  if (marca && modello) return `${marca} ${modello}`;
  return modello || marca || "—";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getLabelRows(item: UnifiedItem): {
  label: string;
  format: (item: UnifiedItem) => string;
}[] {
  const rows: { label: string; format: (item: UnifiedItem) => string }[] = [
    { label: "Cliente", format: formatLabelCliente },
    { label: "Tipo prodotto", format: formatLabelTipoProdotto },
  ];
  if (item.categoria === "monitor") {
    rows.push({ label: "Modello", format: formatLabelModello });
  }
  rows.push(
    { label: "Data", format: () => formatLabelDataStampa() },
    { label: "Verificato", format: formatLabelVerificato },
    { label: "Quantità", format: (item) => String(item.quantita) },
  );
  return rows;
}

/** Documento HTML isolato: un solo foglio 100×50 mm */
export function buildLabelPrintDocument(item: UnifiedItem): string {
  const rows = getLabelRows(item).map(
    ({ label, format }) =>
      `<div class="row"><span class="lbl">${escapeHtml(label)}</span><span class="val">${escapeHtml(format(item))}</span></div>`,
  ).join("");

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<title>Etichetta ${escapeHtml(item.id)}</title>
<style>
  @page { size: 100mm 50mm; margin: 0; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 100mm;
    height: 50mm;
    overflow: hidden;
    background: #fff;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
  }
  .label {
    width: 100mm;
    height: 50mm;
    padding: 4mm 5mm;
    border: 0.4mm solid #000;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 2.5mm;
  }
  .title {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    line-height: 1;
  }
  .grid {
    display: grid;
    grid-template-columns: 28mm 1fr;
    column-gap: 2mm;
    row-gap: 1.6mm;
    font-size: 9.5pt;
    line-height: 1.2;
  }
  .row { display: contents; }
  .lbl {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 8.5pt;
    letter-spacing: 0.02em;
  }
  .val {
    font-weight: 700;
    font-size: 11pt;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
</head>
<body>
  <article class="label">
    <p class="title">Spazio Games</p>
    <div class="grid">${rows}</div>
  </article>
</body>
</html>`;
}

/** Stampa in iframe dedicato: niente modale/app nel foglio */
export function triggerBrowserLabelPrint(
  item: UnifiedItem,
  onAfter?: () => void,
) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden",
  );
  iframe.setAttribute("title", "Stampa etichetta");
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    iframe.remove();
    onAfter?.();
    return;
  }

  doc.open();
  doc.write(buildLabelPrintDocument(item));
  doc.close();

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
    onAfter?.();
  };

  win.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(cleanup, 120_000);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      win.focus();
      win.print();
    });
  });
}
