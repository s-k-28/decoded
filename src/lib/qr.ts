// Generate a QR code as a data URL. Used for the "scan with your phone" handoff:
// the code points to the app, so a person on a laptop can open Decoded on their
// phone and photograph the letter with a real camera.
import QRCode from 'qrcode';

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 232,
    color: { dark: '#0a0e0d', light: '#eaf2ee' },
  });
}
