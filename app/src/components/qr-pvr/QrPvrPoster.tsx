import { forwardRef, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import '@/styles/qr-pvr-poster.css';

export interface QrPvrPosterProps {
  refLink: string;
  pvrName: string;
  siteText: string;
  benefits: string;
}

const DEFAULT_LINK = 'https://example.com';

export const QrPvrPoster = forwardRef<HTMLDivElement, QrPvrPosterProps>(function QrPvrPoster(
  { refLink, pvrName, siteText, benefits },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const link = refLink.trim() || DEFAULT_LINK;
  const pvr = pvrName.trim() || 'PVR non specificato';
  const site = siteText.trim();
  const benefitLines = (benefits || '')
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    QRCode.toCanvas(canvas, link, {
      width: 330,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).catch((err) => {
      if (!cancelled) console.error('QRCode', err);
    });

    return () => {
      cancelled = true;
    };
  }, [link]);

  return (
    <div ref={ref} className="qr-pvr-poster">
      <div className="qr-pvr-corner-top" aria-hidden />
      <div className="qr-pvr-corner-bottom" aria-hidden />

      <div className="qr-pvr-hero">
        <h2 className="qr-pvr-title">APRI IL TUO CONTO GIOCO</h2>
        <div className="qr-pvr-divider" />
        <p className="qr-pvr-subtitle">
          Scansiona il <strong>QR CODE</strong> per essere assistito nella registrazione con il supporto del
          tuo punto vendita di fiducia
        </p>
      </div>

      <div className="qr-pvr-qr-box">
        <canvas ref={canvasRef} role="img" aria-label={`QR code per ${pvr}`} />
      </div>

      <div className="qr-pvr-benefits">
        {benefitLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>

      <div className="qr-pvr-section-divider" />

      <p className="qr-pvr-pvr-label">PVR di Riferimento:</p>
      <p className="qr-pvr-pvr-value">{pvr}</p>

      <div className="qr-pvr-footer">
        <div className="qr-pvr-adm">
          <div className="qr-pvr-adm-badge">ADM</div>
          <div className="qr-pvr-adm-text">
            Gioca
            <br />
            Responsabile
          </div>
        </div>
        {site ? <div className="qr-pvr-site">{site}</div> : null}
      </div>
    </div>
  );
});

/** Larghezza nativa del poster (px) — usata per lo scale della preview */
export const QR_POSTER_WIDTH = 768;
export const QR_POSTER_MIN_HEIGHT = 1152;
