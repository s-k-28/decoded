import { useEffect, useRef, useState } from 'react';
import { FLAGSHIP_TEXT } from '../lib/demoFallback';
import { pdfToImage } from '../lib/pdf';
import { fetchAsDataUrl } from '../lib/url';
import { pickFromDrive, driveConfigured } from '../lib/drive';
import { qrDataUrl } from '../lib/qr';
import { CameraCapture } from './CameraCapture';
import './import.css';

const EXAMPLES: { label: string; text: string }[] = [
  { label: 'Debt collection letter', text: FLAGSHIP_TEXT },
  {
    label: 'Insurance denial',
    text:
      'EXPLANATION OF BENEFITS. This is not a bill. Member: J. Rivera. Claim #99213. Date of service 05/02/2026. Provider: Lakeshore Cardiology. Your claim was DENIED. Reason: services deemed not medically necessary. Plan paid: 0.00. Patient responsibility: 2,310.00. If you disagree with this decision you may contact member services.',
  },
  {
    label: 'Medical bill',
    text:
      'STATEMENT. Date of service 04/18/2026. EMERGENCY ROOM visit at Regional Medical Center, an in-network hospital. The treating physician was OUT-OF-NETWORK. Your health plan paid the in-network rate. Remaining balance billed to patient: 3,400.00. Patient responsibility is due within 30 days. Please remit payment to the address on the statement.',
  },
  {
    label: 'Eviction notice',
    text:
      'NOTICE TO PAY RENT OR QUIT. You owe 1450 dollars in rent for the month of May 2026. You must pay this amount in full or move out and surrender the premises within THREE (3) DAYS after you receive this notice, not counting weekends or legal holidays. If you fail to pay or move out, we will begin a court case to evict you and to recover possession, unpaid rent, damages, and costs. Payment must be made by certified check or money order to the landlord at the address above. Dated June 12, 2026.',
  },
];

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(f);
  });
}

interface Props {
  text: string;
  setText: (s: string) => void;
  imageUrl: string | null;
  setImageUrl: (s: string | null) => void;
  tab: 'paste' | 'photo';
  setTab: (t: 'paste' | 'photo') => void;
  canRun: boolean;
  onRun: () => void;
}

export function ImportPanel({ text, setText, imageUrl, setImageUrl, tab, setTab, canRun, onRun }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const mobileCamRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showCam, setShowCam] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const useImage = (dataUrl: string) => {
    setImageUrl(dataUrl);
    setTab('photo');
    setErr(null);
  };

  const ingest = async (job: () => Promise<string>, label: string) => {
    setErr(null);
    setBusy(label);
    try {
      useImage(await job());
    } catch (e) {
      setErr((e as Error).message || 'Something went wrong with that file.');
    } finally {
      setBusy(null);
    }
  };

  const handleFile = (f: File) => {
    if (f.type === 'application/pdf') return ingest(() => pdfToImage(f), 'Reading the PDF');
    if (f.type.startsWith('image/')) return ingest(() => fileToDataUrl(f), 'Loading the image');
    setErr('Please choose an image or a PDF.');
  };

  const importUrl = async () => {
    const u = urlValue.trim();
    if (!u) return;
    await ingest(async () => {
      const { dataUrl, isPdf } = await fetchAsDataUrl(u);
      if (!isPdf) return dataUrl;
      const blob = await (await fetch(dataUrl)).blob();
      return pdfToImage(new File([blob], 'document.pdf', { type: 'application/pdf' }));
    }, 'Fetching the link');
    setUrlOpen(false);
  };

  const importDrive = () =>
    ingest(async () => {
      const { dataUrl, isPdf } = await pickFromDrive();
      if (!isPdf) return dataUrl;
      const blob = await (await fetch(dataUrl)).blob();
      return pdfToImage(new File([blob], 'document.pdf', { type: 'application/pdf' }));
    }, 'Importing from Drive');

  const openQr = async () => {
    try {
      const origin = window.location.origin + window.location.pathname;
      setQr(await qrDataUrl(origin + '#app'));
    } catch {
      setErr('Could not make the QR code.');
    }
  };

  // Paste an image (a screenshot) from the clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) {
            e.preventDefault();
            handleFile(f);
            return;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag a file onto the window from anywhere.
  useEffect(() => {
    let depth = 0;
    const over = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
    };
    const enter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        depth++;
        setDrag(true);
      }
    };
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDrag(false);
    };
    const drop = (e: DragEvent) => {
      depth = 0;
      setDrag(false);
      if (e.dataTransfer?.files?.length) {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
      }
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="input-card">
      <div className="input-tabs" role="tablist" aria-label="Document input">
        <button className="input-tab" role="tab" aria-selected={tab === 'paste'} onClick={() => setTab('paste')}>
          Paste text
        </button>
        <button className="input-tab" role="tab" aria-selected={tab === 'photo'} onClick={() => setTab('photo')}>
          Upload or scan
        </button>
      </div>

      <div className="input-body">
        {tab === 'paste' ? (
          <textarea
            className="input-area"
            placeholder="Paste the words from your letter or bill here, or paste a screenshot..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Document text"
          />
        ) : (
          <>
            <div
              className="dropzone"
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
            >
              {imageUrl ? (
                <img className="dropzone-preview" src={imageUrl} alt="Your document" />
              ) : (
                <>
                  <span className="dropzone-icon"><IconCamera /></span>
                  <span>Drop a photo or PDF here, or click to choose</span>
                  <span className="dropzone-hint">Images and PDF, or paste a screenshot with Ctrl+V</span>
                </>
              )}
            </div>

            <div className="imp-actions">
              <button className="imp-btn" onClick={() => fileRef.current?.click()}><IconUpload /> Upload file</button>
              <button className="imp-btn" onClick={() => (isMobile ? mobileCamRef.current?.click() : setShowCam(true))}>
                <IconCamera /> Take a picture
              </button>
              {driveConfigured() && (
                <button className="imp-btn" onClick={importDrive}><IconDrive /> Google Drive</button>
              )}
              <button className="imp-btn" onClick={() => setUrlOpen((v) => !v)}><IconLink /> From a link</button>
              {!isMobile && (
                <button className="imp-btn" onClick={openQr}><IconQr /> Scan with phone</button>
              )}
              {imageUrl && (
                <button className="imp-btn" onClick={() => setImageUrl(null)}><IconX /> Remove</button>
              )}
            </div>

            {urlOpen && (
              <div className="imp-url">
                <input
                  type="url"
                  placeholder="https://example.com/letter.pdf"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && importUrl()}
                  aria-label="Document link"
                />
                <button className="btn btn--sm" onClick={importUrl}>Fetch</button>
              </div>
            )}
          </>
        )}

        {busy && (
          <div className="imp-busy"><span className="imp-busy-dot" /> {busy}...</div>
        )}
        {err && <div className="imp-err" role="alert">{err}</div>}

        <div className="input-foot">
          <div className="example-chips">
            {EXAMPLES.map((ex) => (
              <button key={ex.label} className="chip" onClick={() => { setText(ex.text); setTab('paste'); setImageUrl(null); }}>
                {ex.label}
              </button>
            ))}
          </div>
          <button className="btn" disabled={!canRun || !!busy} onClick={onRun}>Decode this</button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      <input ref={mobileCamRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

      {showCam && <CameraCapture onCapture={(d) => { useImage(d); setShowCam(false); }} onClose={() => setShowCam(false)} />}

      {qr && (
        <div className="qr-overlay" role="dialog" aria-modal="true" aria-label="Scan with your phone" onClick={() => setQr(null)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-title">Scan with your phone</div>
            <p className="qr-sub">Open Decoded on your phone and photograph the letter with your camera.</p>
            <img className="qr-img" src={qr} alt="QR code to open Decoded on your phone" />
            <div className="qr-foot"><button className="btn btn--ghost btn--sm" onClick={() => setQr(null)}>Close</button></div>
          </div>
        </div>
      )}

      {drag && <div className="imp-drop-overlay"><span>Drop your document</span></div>}
    </div>
  );
}

const IconUpload = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 9l5-5 5 5" /><path d="M12 4v12" /></svg>);
const IconCamera = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4z" /><circle cx="12" cy="13" r="3.5" /></svg>);
const IconDrive = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3h8l5 9-5 9H8l-5-9z" /><path d="M8 3l4 9 4-9" /><path d="M3 12h18" /></svg>);
const IconLink = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>);
const IconQr = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M14 21h.01M21 21v-4M17 21h.01" /></svg>);
const IconX = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>);
