// Import a document from Google Drive with the official Drive Picker. Activates
// only when the app is configured with a Google API key and OAuth client id.
// The user provides these in .env.local:
//   VITE_GOOGLE_API_KEY=...
//   VITE_GOOGLE_CLIENT_ID=...
// and enables the Google Picker API and Google Drive API on the Cloud project.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { blobToDataUrl } from './url';
import { firebaseConfigured, getDriveTokenViaFirebase } from './firebase';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
// drive.file is a non-sensitive scope: it grants access only to the file the
// user explicitly picks, so the app needs no Google verification review.
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

// The Picker needs an API key. The OAuth token can come from a hand-made OAuth
// client (GIS) or from Firebase Auth, whichever is configured.
export const driveConfigured = (): boolean => Boolean(API_KEY && (CLIENT_ID || firebaseConfigured()));

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google Drive.'));
    document.head.appendChild(s);
  });
}

let pickerReady = false;
async function ensurePicker(): Promise<void> {
  await loadScript('https://apis.google.com/js/api.js');
  if (!pickerReady) {
    await new Promise<void>((resolve) => (window as any).gapi.load('picker', { callback: () => resolve() }));
    pickerReady = true;
  }
}

let tokenClient: any = null;
async function getToken(): Promise<string> {
  if (firebaseConfigured()) return getDriveTokenViaFirebase();
  await loadScript('https://accounts.google.com/gsi/client');
  const google = (window as any).google;
  return new Promise((resolve, reject) => {
    const cb = (resp: any) => (resp && resp.access_token ? resolve(resp.access_token) : reject(new Error('Google sign-in was cancelled.')));
    if (!tokenClient) {
      tokenClient = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPE, callback: cb });
    } else {
      tokenClient.callback = cb;
    }
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export async function pickFromDrive(): Promise<{ dataUrl: string; isPdf: boolean; name: string }> {
  if (!driveConfigured()) throw new Error('Google Drive is not configured.');
  await ensurePicker();
  const token = await getToken();
  const google = (window as any).google;

  const doc: any = await new Promise((resolve, reject) => {
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes(
      'application/pdf,image/png,image/jpeg,image/webp,image/heic',
    );
    new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setCallback((data: any) => {
        if (data.action === google.picker.Action.PICKED) resolve(data.docs[0]);
        else if (data.action === google.picker.Action.CANCEL) reject(new Error('No file was chosen.'));
      })
      .build()
      .setVisible(true);
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not download that file from Drive.');
  const blob = await res.blob();
  return { dataUrl: await blobToDataUrl(blob), isPdf: doc.mimeType === 'application/pdf', name: doc.name };
}
