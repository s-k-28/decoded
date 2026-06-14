// Render a PDF to an image so the vision model can read it the same way it reads
// a photo. We rasterize the first few pages and stack them into one JPEG data
// URL. This handles both digital and scanned PDFs, since we never depend on a
// text layer being present.
//
// pdf.js is large, so it is loaded on demand the first time a PDF is opened.
// That keeps the initial app bundle small for everyone who never uploads a PDF.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const MAX_PAGES = 3;
const SCALE = 1.6;
const GAP = 14;
const MAX_CANVAS_HEIGHT = 12000; // stay well under browser canvas limits

let libP: Promise<typeof import('pdfjs-dist')> | null = null;
function getPdfjs() {
  if (!libP) {
    libP = import('pdfjs-dist').then((m) => {
      m.GlobalWorkerOptions.workerSrc = workerUrl;
      return m;
    });
  }
  return libP;
}

export async function pdfToImage(file: File, maxPages = MAX_PAGES): Promise<string> {
  const pdfjs = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);

  const pages: HTMLCanvasElement[] = [];
  let width = 0;
  let height = 0;

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not render the PDF in this browser.');
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    if (height + canvas.height > MAX_CANVAS_HEIGHT) break;
    pages.push(canvas);
    width = Math.max(width, canvas.width);
    height += canvas.height + (pages.length > 1 ? GAP : 0);
  }

  if (!pages.length) throw new Error('That PDF had no readable pages.');

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const octx = out.getContext('2d');
  if (!octx) throw new Error('Could not render the PDF in this browser.');
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, width, height);
  let y = 0;
  for (const c of pages) {
    octx.drawImage(c, 0, y);
    y += c.height + GAP;
  }
  return out.toDataURL('image/jpeg', 0.82);
}
