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

export function buildQrPvrShareText(params: {
  refLink: string;
  pvrName: string;
  siteText: string;
  benefits: string;
  reopenUrl: string;
}): string {
  const lines = [
    'Poster QR PVR — Spazio Games',
    '',
    'Referral (contenuto del QR):',
    params.refLink.trim() || '(non impostato)',
    '',
    'PVR di riferimento:',
    params.pvrName.trim() || '(non impostato)',
  ];
  if (params.siteText.trim()) {
    lines.push('', 'Testo footer:', params.siteText.trim());
  }
  if (params.benefits.trim()) {
    lines.push('', 'Vantaggi:', params.benefits.trim());
  }
  lines.push(
    '',
    'Riapri questi dati nel gestionale:',
    params.reopenUrl,
    '',
    'Per il poster in immagine: apri il link sopra (o il gestionale → QR PVR) e usa «Scarica come immagine», poi allega il PNG qui su WhatsApp o in email.'
  );
  return lines.join('\n');
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
