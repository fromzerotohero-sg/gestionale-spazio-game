import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Copy, Download, Mail, MessageCircle, Printer, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QrPvrPoster, QR_POSTER_WIDTH } from '@/components/qr-pvr/QrPvrPoster';
import {
  buildClientShareText,
  buildClientShortFallbackText,
  buildMailtoUrl,
  buildQrPvrReopenHash,
  buildWhatsAppUrl,
  triggerPngDownload,
} from '@/lib/qr-pvr-share';
import { cn } from '@/lib/utils';

const DEFAULT_REF = 'https://example.com/ref?pvr=PVR-BOLOGNA-01';
const DEFAULT_PVR = 'PVR Bologna Centro - ID 001';
const DEFAULT_SITE = 'www.daznbet.it';
const DEFAULT_BENEFITS = `- Attivazione veloce
- Vantaggi all'iscrizione
- Supporto dedicato`;

const easeSmooth = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function QRGenerator() {
  const [searchParams] = useSearchParams();
  const posterRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [refLink, setRefLink] = useState(DEFAULT_REF);
  const [pvrName, setPvrName] = useState(DEFAULT_PVR);
  const [siteText, setSiteText] = useState(DEFAULT_SITE);
  const [benefits, setBenefits] = useState(DEFAULT_BENEFITS);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [emailTo, setEmailTo] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    const pvr = searchParams.get('pvr');
    const site = searchParams.get('site');
    const benefitsParam = searchParams.get('benefits');

    if (ref) setRefLink(ref);
    if (pvr) setPvrName(pvr);
    if (site) setSiteText(site);
    if (benefitsParam) setBenefits(benefitsParam.split('|').join('\n'));
  }, [searchParams]);

  const updatePreviewScale = useCallback(() => {
    const wrap = previewWrapRef.current;
    if (!wrap) return;
    const available = wrap.clientWidth - 16;
    setPreviewScale(Math.min(1, available / QR_POSTER_WIDTH));
  }, []);

  useEffect(() => {
    updatePreviewScale();
    window.addEventListener('resize', updatePreviewScale);
    return () => window.removeEventListener('resize', updatePreviewScale);
  }, [updatePreviewScale]);

  async function renderPosterToCanvas() {
    const el = posterRef.current;
    if (!el) throw new Error('Poster non pronto');
    return html2canvas(el, {
      backgroundColor: '#050505',
      scale: 2,
      useCORS: true,
      logging: false,
    });
  }

  async function getPosterPng(): Promise<{ file: File; dataUrl: string; filename: string }> {
    const canvas = await renderPosterToCanvas();
    const slug = pvrName.trim().replace(/[^\w\-]+/g, '_').slice(0, 40) || 'pvr';
    const filename = `qr-pvr-${slug}.png`;
    const dataUrl = canvas.toDataURL('image/png');
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png', 1)
    );
    if (!blob) throw new Error('Impossibile creare il PNG');
    const file = new File([blob], filename, { type: 'image/png' });
    return { file, dataUrl, filename };
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const { dataUrl, filename } = await getPosterPng();
      triggerPngDownload(dataUrl, filename);
      toast.success('Poster scaricato come immagine PNG');
    } catch {
      toast.error('Errore durante il download del poster');
    } finally {
      setDownloading(false);
    }
  }

  const reopenUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}${buildQrPvrReopenHash({
          refLink,
          pvrName,
          siteText,
          benefits,
        })}`
      : '';

  const clientCaption = buildClientShareText({
    refLink,
    pvrName,
    siteText,
    benefits,
  });

  function openExternalUrl(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function copyStaffEditLink() {
    if (!reopenUrl) return;
    try {
      await navigator.clipboard.writeText(reopenUrl);
      toast.success('Link copiato (uso interno — riapre il generatore con questi dati)');
    } catch {
      toast.error('Impossibile copiare negli appunti');
    }
  }

  async function handleWhatsAppToClient() {
    setSharing(true);
    try {
      const { file, dataUrl, filename } = await getPosterPng();
      const shareData: ShareData = {
        files: [file],
        title: 'Poster QR PVR',
        text: clientCaption,
      };
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success('Scegli WhatsApp: il poster è in allegato');
        return;
      }
      triggerPngDownload(dataUrl, filename);
      toast.message('Poster salvato', {
        description: 'Su questo dispositivo allega il PNG in WhatsApp. Apro la chat con messaggio di testo.',
      });
      const shortMsg = buildClientShortFallbackText({ refLink, pvrName, filename });
      openExternalUrl(buildWhatsAppUrl(whatsappPhone.trim() || undefined, shortMsg));
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      toast.error('Errore durante la preparazione per WhatsApp');
    } finally {
      setSharing(false);
    }
  }

  async function handleEmailToClient() {
    setSharing(true);
    try {
      const { file, dataUrl, filename } = await getPosterPng();
      const shareData: ShareData = {
        files: [file],
        title: 'Poster QR PVR',
        text: clientCaption,
      };
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success('Scegli Mail o altra app: poster in allegato');
        return;
      }
      triggerPngDownload(dataUrl, filename);
      const subject = `Poster QR PVR — ${pvrName.trim().slice(0, 60) || 'Spazio Games'}`;
      let body =
        clientCaption +
        `\n\n---\nAllega il file "${filename}" (salvato nella cartella Download di questo computer).`;
      const maxLen = 2000;
      if (body.length > maxLen) {
        body = `${body.slice(0, maxLen - 120)}\n\n[… testo troncato. I dati principali sono nel file PNG allegato manualmente.]`;
      }
      window.location.href = buildMailtoUrl(emailTo.trim() || undefined, subject, body);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      toast.error('Errore durante la preparazione per email');
    } finally {
      setSharing(false);
    }
  }

  async function handleShareFile() {
    setSharing(true);
    try {
      const { file } = await getPosterPng();
      const shareData: ShareData = {
        files: [file],
        title: 'Poster QR PVR',
        text: clientCaption,
      };
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success('Condivisione avviata');
      } else {
        toast.info('Condivisione file non disponibile qui', {
          description: 'Usa «WhatsApp» o «Email»: generano il PNG e aprono l’app (su PC viene scaricato il file da allegare).',
        });
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      toast.error('Errore durante la condivisione');
    } finally {
      setSharing(false);
    }
  }

  function handlePrint() {
    document.body.classList.add('qr-pvr-printing');
    const cleanup = () => document.body.classList.remove('qr-pvr-printing');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  }

  return (
    <div className="qr-pvr-page flex flex-col gap-6 max-w-[min(1180px,100%)] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeSmooth }}
        className="flex items-start gap-3"
      >
        <div className="w-10 h-10 rounded-lg bg-accent-primary/15 flex items-center justify-center shrink-0">
          <QrCode className="text-accent-primary" size={22} />
        </div>
        <div>
          <p className="font-caption text-text-muted mb-1">Strumenti</p>
          <h2 className="font-display-lg text-text-primary">Generatore QR PVR</h2>
          <p className="font-body text-text-secondary mt-1">
            Crea poster con QR code per i punti vendita. Layout e proporzioni originali (768×1152 px).
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Controlli */}
        <motion.section
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: easeSmooth, delay: 0.05 }}
          className="rounded-xl border border-border-subtle bg-bg-elevated p-5 space-y-4 xl:sticky xl:top-24"
        >
          <div>
            <h3 className="font-heading-3 text-text-primary">Dati poster</h3>
            <p className="font-body-small text-text-muted mt-1">
              Il QR e il riferimento PVR si aggiornano in tempo reale nel layout a destra.
            </p>
          </div>

          <div>
            <Label className="text-text-secondary mb-1.5 block">Referral link PVR</Label>
            <Input
              value={refLink}
              onChange={(e) => setRefLink(e.target.value)}
              placeholder="https://..."
              className="bg-bg-surface border-border-default"
            />
          </div>

          <div>
            <Label className="text-text-secondary mb-1.5 block">Riferimento PVR</Label>
            <Input
              value={pvrName}
              onChange={(e) => setPvrName(e.target.value)}
              placeholder="PVR nome - ID"
              className="bg-bg-surface border-border-default"
            />
          </div>

          <div>
            <Label className="text-text-secondary mb-1.5 block">Testo footer</Label>
            <Input
              value={siteText}
              onChange={(e) => setSiteText(e.target.value)}
              placeholder="www.daznbet.it"
              className="bg-bg-surface border-border-default"
            />
          </div>

          <div>
            <Label className="text-text-secondary mb-1.5 block">Vantaggi</Label>
            <Textarea
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              rows={4}
              className="bg-bg-surface border-border-default resize-y min-h-[84px]"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              className="bg-accent-primary text-bg-base hover:bg-accent-secondary"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download size={16} />
              {downloading ? 'Generazione...' : 'Scarica come immagine'}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer size={16} />
              Stampa / PDF
            </Button>
          </div>

          <div className="rounded-lg border border-border-subtle bg-bg-surface/50 p-4 space-y-3">
            <h4 className="font-heading-3 text-text-primary text-sm">Invia al cliente</h4>
            <p className="font-body-small text-text-muted">
              Su <strong className="text-text-secondary">telefono o tablet</strong> il pulsante WhatsApp o Email apre
              la condivisione di sistema con il <strong className="text-text-secondary">file PNG del poster</strong>{' '}
              (il risultato dell&apos;anteprima). Su <strong className="text-text-secondary">PC</strong> i browser non
              allegano file a WhatsApp: viene scaricato il PNG e si apre la chat con un messaggio breve — allega il
              file dalla cartella Download. Il testo al cliente <strong className="text-text-secondary">non</strong>{' '}
              include il link al gestionale.
            </p>
            <div>
              <Label className="text-text-secondary mb-1.5 block text-xs">
                Numero WhatsApp (opzionale, solo cifre con prefisso paese, es. 393331234567)
              </Label>
              <Input
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="Lascia vuoto per scegliere il destinatario nell’app"
                className="bg-bg-surface border-border-default h-9 text-sm"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label className="text-text-secondary mb-1.5 block text-xs">Email destinatario (opzionale)</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="es. punto.vendita@azienda.it"
                className="bg-bg-surface border-border-default h-9 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => void handleWhatsAppToClient()}
                disabled={sharing || downloading}
                className="border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10"
              >
                <MessageCircle size={16} />
                {sharing ? 'Preparo…' : 'WhatsApp con poster'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => void handleEmailToClient()}
                disabled={sharing || downloading}
              >
                <Mail size={16} />
                {sharing ? 'Preparo…' : 'Email con poster'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => void handleShareFile()}
                disabled={sharing || downloading}
              >
                <Share2 size={16} />
                Condividi (sistema)
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => void copyStaffEditLink()} className="text-text-muted">
                <Copy size={16} />
                Copia link modifica (interno)
              </Button>
            </div>
          </div>

          <p className="font-caption text-text-muted">
            Parametri URL: <code className="text-text-secondary">?ref=...&amp;pvr=...&amp;site=...&amp;benefits=riga1|riga2</code>
          </p>
        </motion.section>

        {/* Anteprima poster */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeSmooth, delay: 0.1 }}
          className="flex justify-center items-start min-w-0"
        >
          <div
            ref={previewWrapRef}
            className="w-full overflow-x-auto flex justify-center py-2 qr-pvr-print-root"
          >
            <div
              style={{
                width: QR_POSTER_WIDTH * previewScale,
                height: 'auto',
              }}
            >
              <div
                className="qr-pvr-print-scale"
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                  width: QR_POSTER_WIDTH,
                  margin: '0 auto',
                }}
              >
                <QrPvrPoster
                  ref={posterRef}
                  refLink={refLink}
                  pvrName={pvrName}
                  siteText={siteText}
                  benefits={benefits}
                />
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {previewScale < 1 && (
        <p className={cn('font-caption text-text-muted text-center xl:hidden')}>
          Anteprima ridotta al {Math.round(previewScale * 100)}% — il download usa la risoluzione piena (768 px).
        </p>
      )}
    </div>
  );
}
