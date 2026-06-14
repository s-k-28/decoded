import { useEffect, useRef, useState } from 'react';

// A live camera capture modal. Uses getUserMedia for a real webcam or phone
// camera, draws the frame to a canvas, and returns a JPEG data URL. Falls back
// to a clear message if the camera is unavailable or permission is denied.
export function CameraCapture({ onCapture, onClose }: { onCapture: (dataUrl: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera api');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setErr('We could not open the camera. Check the browser permission, or upload a photo instead.');
      }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    onCapture(c.toDataURL('image/jpeg', 0.92));
  };

  return (
    <div className="cam-overlay" role="dialog" aria-modal="true" aria-label="Take a picture" onClick={onClose}>
      <div className="cam-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cam-bar">
          <span className="cam-title">Take a picture of your document</span>
          <button className="cam-x" onClick={onClose} aria-label="Close camera">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="cam-stage">
          {err ? (
            <div className="cam-err">{err}</div>
          ) : (
            <>
              <video ref={videoRef} playsInline muted className="cam-video" />
              <div className="cam-reticle" aria-hidden="true" />
            </>
          )}
        </div>
        <div className="cam-foot">
          <button className="btn btn--ghost btn--sm" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={snap} disabled={!ready || !!err}>Capture</button>
        </div>
      </div>
    </div>
  );
}
