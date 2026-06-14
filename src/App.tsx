import { useEffect, useState } from 'react';
import { Decoder } from './Decoder';
import { Landing } from './Landing';

// A lightweight hash route: the landing page is the entry, and "Try it free"
// (or visiting #app) opens the decoder.

function currentView(): 'landing' | 'app' {
  return window.location.hash === '#app' ? 'app' : 'landing';
}

export default function App() {
  const [view, setView] = useState<'landing' | 'app'>(currentView);

  useEffect(() => {
    const onHash = () => setView(currentView());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (view === 'app') return <Decoder onHome={() => { window.location.hash = ''; }} />;
  return <Landing onTry={() => { window.location.hash = 'app'; }} />;
}
