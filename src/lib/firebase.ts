// Optional Firebase-Auth path for Google Drive. When the app is configured with a
// Firebase web config, signing in with Google through Firebase auto-provisions the
// OAuth client and returns a Drive-scoped access token, so no OAuth client has to
// be created by hand. The Firebase SDK is loaded on demand to keep the initial
// bundle small for everyone who never signs in.
/* eslint-disable @typescript-eslint/no-explicit-any */

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export const firebaseConfigured = (): boolean => Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId);

export async function getDriveTokenViaFirebase(): Promise<string> {
  if (!firebaseConfigured()) throw new Error('Firebase is not configured.');
  const [{ initializeApp, getApps }, { getAuth, GoogleAuthProvider, signInWithPopup }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);
  const app = getApps().length ? getApps()[0] : initializeApp(cfg as any);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  const result = await signInWithPopup(auth, provider);
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) throw new Error('Google sign-in did not return a Drive token.');
  return token;
}
