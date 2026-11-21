import type { Section } from '../schema';

type Entry = Record<string, any>;

const ICONS: Record<string, string> = {
  server: '<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 1 0-1.3-8.8A6 6 0 1 0 6 16.5"/><path d="M6 19h11.5"/>',
  chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>',
  desktop: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
};

export function Preview({ section, entry: e }: { section: Section; entry: Entry }) {
  switch (section.id) {
    case 'profile':
      return (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, ['--accent' as string]: e.accent }}>
          <div className="row" style={{ gap: 8 }}>
            {e.openToWork && <span className="pill pill-green"><span className="live" />open to new opportunities</span>}
            {e.certification?.url && <span className="pill pill-gold">AWS Certified ↗</span>}
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 0.98, letterSpacing: '-.045em' }}>{e.firstName}<br /><span style={{ color: e.accent }}>{e.lastName}</span></h1>
          <p className="soft">{e.intro}</p>
          <div className="stats card" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {(e.stats ?? []).map((s: Entry, i: number) => <div key={i} className="stat"><b style={{ fontSize: 24 }}>{s.value}</b><span>{s.label}</span></div>)}
          </div>
        </div>
      );
    case 'vaylo':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h2 className="h2" style={{ fontSize: 28 }}>{e.heading}</h2>
          <div className="grid" style={{ ['--min' as string]: '150px', gap: 8 }}>
            {(e.modules ?? []).map((m: Entry, i: number) => <div key={i} className={`module ${m.builtByMe ? 'mine' : ''}`}><b>{m.name}</b><span>{m.detail}</span></div>)}
          </div>
          <div className="feature" style={{ padding: 22, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <h3 style={{ fontSize: 24, fontWeight: 700 }}>{e.feature?.title}</h3>
            <p className="soft">{e.feature?.body}</p>
          </div>
        </div>
      );
    case 'capabilities':
      return (
        <div className="card cap">
          <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={e.color || '#3DDC97'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICONS[e.icon] ?? ICONS.server }} />
          <h3>{e.title}</h3>
          <p>{e.description}</p>
          <span className="tools">{e.tools}</span>
        </div>
      );
    case 'projects':
      if (e.size === 'small')
        return <div className="card proj-small"><span className="mono muted" style={{ fontSize: 12 }}>{e.linkLabel}</span><h3>{e.title}</h3><p className="soft" style={{ fontSize: 15 }}>{e.summary}</p></div>;
      return (
        <div className={e.size === 'featured' ? 'proj-featured' : 'card proj-med'} style={{ flexDirection: 'column' }}>
          <div className="copy" style={{ padding: 24, gap: 12 }}>
            <div className="kind-row"><span className="tag" style={{ background: '#14201A', border: '1px solid #1F3A2E', color: '#9FE8C6' }}>{e.kind || 'kind'}</span><span className="mono muted" style={{ fontSize: 12 }}>{e.stack}</span></div>
            <h3 style={{ fontSize: 28 }}>{e.title}</h3>
            <p className="soft">{e.summary}</p>
            {e.size === 'featured' && e.bullets?.length > 0 && <ul>{e.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul>}
          </div>
          {e.image && <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}><img src={e.image} alt="" style={{ maxHeight: 260, borderRadius: 10 }} />{e.screenshotStyle === 'phone' && e.secondaryImage && <img src={e.secondaryImage} alt="" style={{ maxHeight: 260, borderRadius: 10 }} />}</div>}
        </div>
      );
    case 'experience':
      return (
        <div className="timeline" style={{ marginLeft: 6 }}>
          <div className="tl-item">
            <span className={`tl-dot ${e.dot}`} />
            <span className="mono muted" style={{ fontSize: 13 }}>{e.period}</span>
            <h3>{e.title}{e.url ? ' ↗' : ''}</h3>
            <p>{e.description}</p>
          </div>
        </div>
      );
    case 'posts':
      return (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="mono muted" style={{ fontSize: 13 }}>{e.date} · {e.draft ? 'draft — hidden' : 'published'}</span>
          <h3 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.03em' }}>{e.title}</h3>
          <p className="soft">{e.summary}</p>
          <pre className="mono soft" style={{ whiteSpace: 'pre-wrap', fontSize: 13, margin: 0 }}>{String(e.body ?? '').slice(0, 600)}</pre>
        </div>
      );
    default:
      return null;
  }
}
