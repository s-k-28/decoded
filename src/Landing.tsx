const STEPS = [
  { n: '01', title: 'Add your document', body: 'Paste the text or take a photo of any official letter, bill, or notice. No account, no upload of your private documents to keep.' },
  { n: '02', title: 'Decoded reads it', body: 'It explains what the document is and what it means for you, finds the deadlines, lists your rights, and flags anything predatory or like a scam.' },
  { n: '03', title: 'Know what to do', body: 'Get a clear checklist, a drafted reply, a calendar reminder for the deadline, and a path to real human help, all in your language, read aloud.' },
];

const HELPS = [
  { title: 'Renters', body: 'Understand an eviction or pay-or-quit notice and its deadline before it becomes a default judgment.' },
  { title: 'Patients', body: 'Make sense of a medical bill or an insurance denial, and learn that a denial can be appealed.' },
  { title: 'Families on benefits', body: 'Decode a SNAP, Medicaid, or unemployment letter and find the hearing rights and deadlines inside it.' },
  { title: 'Older adults', body: 'Spot debt-collection pressure and scam demands, like a request to pay by gift card.' },
];

const STATS = [
  { big: '28%', small: 'of US adults read at the lowest literacy level.' },
  { big: '29.6M', small: 'people in the US have limited English proficiency.' },
  { big: '<1%', small: 'of denied insurance claims are appealed, because people do not know they can.' },
];

export function Landing({ onTry }: { onTry: () => void }) {
  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-brand">
          <span className="brand-mark">D</span>
          <span className="lp-word">Decoded</span>
        </div>
        <nav className="lp-links">
          <a href="#how">How it works</a>
          <a href="#who">Who it helps</a>
        </nav>
        <button className="btn btn--sm" onClick={onTry}>Try it free</button>
      </header>

      <section className="lp-hero">
        <span className="lp-eyebrow">AI for social good</span>
        <h1 className="lp-h1">Understand any official document.</h1>
        <p className="lp-sub">
          Paste or photograph an eviction notice, a medical bill, or a benefits letter. Decoded tells you what it
          means, your deadlines, your rights, and exactly what to do, in your language, read aloud.
        </p>
        <div className="lp-cta">
          <button className="btn" onClick={onTry}>Try Decoded free</button>
          <span className="lp-cta-note">No account. Your documents stay on your device.</span>
        </div>
      </section>

      <section className="lp-stats">
        {STATS.map((s) => (
          <div className="lp-stat" key={s.big}>
            <span className="lp-stat-big">{s.big}</span>
            <span className="lp-stat-small">{s.small}</span>
          </div>
        ))}
      </section>

      <section className="lp-section" id="how">
        <h2 className="lp-h2">How it works</h2>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div className="lp-step" key={s.n}>
              <span className="lp-step-n">{s.n}</span>
              <h3 className="lp-step-title">{s.title}</h3>
              <p className="lp-step-body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section lp-section--alt" id="who">
        <h2 className="lp-h2">Who it helps</h2>
        <div className="lp-who">
          {HELPS.map((h) => (
            <div className="lp-who-item" key={h.title}>
              <h3 className="lp-who-title">{h.title}</h3>
              <p className="lp-who-body">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <h2 className="lp-h2">Built to be trusted</h2>
        <div className="lp-trust">
          <div className="lp-trust-item">
            <h3 className="lp-trust-title">It explains, it does not advise</h3>
            <p className="lp-trust-body">Decoded translates a document into plain language and lays out your options. It is not legal or medical advice, and it routes you to real human help.</p>
          </div>
          <div className="lp-trust-item">
            <h3 className="lp-trust-title">It never makes things up</h3>
            <p className="lp-trust-body">It only states rights that are in the document or broadly established, it shows what it is unsure about, and it never invents a law or a number.</p>
          </div>
          <div className="lp-trust-item">
            <h3 className="lp-trust-title">Your documents stay private</h3>
            <p className="lp-trust-body">Saved analyses live on your device, not on a server. There is no account, and nothing to leak.</p>
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--alt">
        <h2 className="lp-h2">Free for the people who need it</h2>
        <p className="lp-lead">
          Decoded is free for any individual, forever. To sustain it and reach more people, we plan to offer a
          supported plan for the organizations that already do this work by hand, legal-aid clinics, libraries, and
          community groups, with shared workspaces, more languages, and bulk usage. The core stays free for the person
          holding the letter.
        </p>
      </section>

      <section className="lp-final">
        <h2 className="lp-final-h">Turn a letter that causes a panic into a plan.</h2>
        <button className="btn" onClick={onTry}>Try Decoded free</button>
      </section>

      <footer className="lp-foot">
        <span>Decoded</span>
        <span>Understand any official document. Built for STEMINATE Hacks 2026.</span>
      </footer>
    </div>
  );
}
