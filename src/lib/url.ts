// Import a document by link. Many hosts block cross-origin fetches, so the caller
// must handle a thrown error gracefully and offer upload instead.

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(blob);
  });
}

export async function fetchAsDataUrl(url: string): Promise<{ dataUrl: string; isPdf: boolean }> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('That link could not be reached from the browser. Try downloading it and uploading instead.');
  }
  if (!res.ok) throw new Error(`That link returned an error (status ${res.status}).`);
  const blob = await res.blob();
  const isPdf = blob.type === 'application/pdf' || url.toLowerCase().split('?')[0].endsWith('.pdf');
  if (!isPdf && !blob.type.startsWith('image/')) {
    throw new Error('That link is not an image or a PDF.');
  }
  return { dataUrl: await blobToDataUrl(blob), isPdf };
}
