// Turns a file the user uploads from their computer or phone into something the
// decoder accepts: either plain text or an image data URL.
//   - images (png, jpg, heic, ...)  -> data URL, sent to the vision model as-is
//   - PDFs                          -> extracted text; if the PDF is a scan with
//                                      no selectable text, the first page is
//                                      rendered to an image instead
//   - text files (txt, md, csv)     -> read as text
// All of this runs in the browser, so the file never leaves the device until the
// user presses Decode, and the backend contract (text | imageUrl) is unchanged.
export interface Extracted {
  kind: 'text' | 'image';
  text?: string;
  imageUrl?: string;
  name: string;
}

const readAs = (file: File, how: 'dataURL' | 'text'): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error ?? new Error('Could not read the file'));
    if (how === 'dataURL') r.readAsDataURL(file);
    else r.readAsText(file);
  });

export async function extractFile(file: File): Promise<Extracted> {
  const name = file.name || 'document';
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(name);

  if (file.type.startsWith('image/')) {
    return { kind: 'image', imageUrl: await readAs(file, 'dataURL'), name };
  }
  if (isPdf) {
    return await extractPdf(file, name);
  }
  // Everything else is treated as plain text (txt, md, csv, ...).
  return { kind: 'text', text: await readAs(file, 'text'), name };
}

// pdf.js is heavy, so it is loaded only when a PDF is actually uploaded.
async function loadPdfjs() {
  const pdfjsLib = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjsLib;
}

async function extractPdf(file: File, name: string): Promise<Extracted> {
  const pdfjsLib = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  // Pull selectable text from up to the first 15 pages.
  const maxPages = Math.min(pdf.numPages, 15);
  let text = '';
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items.map((it) => ('str' in it ? it.str : '')).join(' ');
    text += line + '\n';
  }
  text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  // Enough real text means it is a digital PDF; use the text path.
  if (text.replace(/\s/g, '').length >= 40) {
    return { kind: 'text', text, name };
  }

  // Otherwise it is a scan: render the first page to an image for the vision model.
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not render the PDF page');
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return { kind: 'image', imageUrl: canvas.toDataURL('image/jpeg', 0.85), name };
}
