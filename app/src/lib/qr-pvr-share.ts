export function buildQrPvrReopenHash(params: {
  refLink: string;
  pvrName: string;
  siteText: string;
  benefits: string;
}): string {
  const sp = new URLSearchParams();
  if (params.refLink.trim()) sp.set('ref', params.refLink.trim());
  if (params.pvrName.trim()) sp.set('pvr', params.pvrName.trim());
  if (params.siteText.trim()) sp.set('site', params.siteText.trim());
  const benefitsPipe = params.benefits
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('|');
  if (benefitsPipe) sp.set('benefits', benefitsPipe);
  const q = sp.toString();
  return q ? `#/qr-pvr?${q}` : '#/qr-pvr';
}

/** Testo per cliente: referral, PVR, vantaggi — senza link al gestionale. */
export function buildClientShareText(params: {
  refLink: string;
  pvrName: string;
  siteText: string;
  benefits: string;
}): string {
  const lines = [
    'Ciao,',
    'ti invio il poster con QR per il punto vendita.',
    '',
    'Link di registrazione / referral (codificato nel QR):',
    params.refLink.trim() || '(non impostato)',
    '',
    'PVR di riferimento:',
    params.pvrName.trim() || '(non impostato)',
  ];
  if (params.siteText.trim()) {
    lines.push('', 'Sito / footer poster:', params.siteText.trim());
  }
  if (params.benefits.trim()) {
    lines.push('', 'Vantaggi sul poster:', params.benefits.trim());
  }
  lines.push('', 'Il poster completo è il file immagine in allegato (PNG).');
  return lines.join('\n');
}

/** Messaggio breve se non si può allegare il file (es. WhatsApp da PC dopo solo download). */
export function buildClientShortFallbackText(params: {
  refLink: string;
  pvrName: string;
  filename: string;
}): string {
  return [
    'Ciao,',
    'ti invio il poster QR per il punto vendita.',
    '',
    `PVR: ${params.pvrName.trim() || '—'}`,
    `Link referral (nel QR): ${params.refLink.trim() || '—'}`,
    '',
    `Allega in questa chat il file immagine "${params.filename}" (appena salvato nella cartella Download).`,
  ].join('\n');
}

export function buildWhatsAppUrl(phoneDigits: string | undefined, message: string): string {
  const text = encodeURIComponent(message);
  const digits = phoneDigits?.replace(/\D/g, '') ?? '';
  if (digits.length >= 8) {
    return `https://api.whatsapp.com/send?phone=${digits}&text=${text}`;
  }
  return `https://api.whatsapp.com/send?text=${text}`;
}

export function buildMailtoUrl(to: string | undefined, subject: string, body: string): string {
  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body);
  const query = params.toString();
  const addr = (to ?? '').trim();
  return addr ? `mailto:${addr}?${query}` : `mailto:?${query}`;
}

export function triggerPngDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.download = filename;
  a.href = dataUrl;
  a.click();
}
