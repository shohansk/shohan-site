import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { sections, type Field, type Section } from '../schema';
import { Preview } from './Preview';

type Entry = Record<string, any>;
type Item = { slug: string; entry: Entry };
type Data = Record<string, Entry | Item[]>;
type Toast = { kind: 'ok' | 'err'; text: string } | null;

const api = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, { credentials: 'same-origin', ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
};
const send = (method: string, body: unknown) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export default function Admin() {
  const [session, setSession] = useState<{ authed: boolean; configured: boolean; mode: string } | null>(null);
  useEffect(() => {
    api('/api/admin/session').then(setSession).catch(() => setSession({ authed: false, configured: false, mode: 'local' }));
  }, []);
  if (!session) return <div className="cms-center muted">loading…</div>;
  if (!session.authed) return <Login configured={session.configured} onDone={() => setSession({ ...session, authed: true })} />;
  return <Shell mode={session.mode} onSignOut={() => setSession({ ...session, authed: false })} />;
}

function Login({ configured, onDone }: { configured: boolean; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/admin/session', send('POST', { password }));
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="cms-center">
      <form className="cms-login" onSubmit={submit}>
        <div className="cms-term-bar"><i style={{ background: '#FF5F57' }} /><i style={{ background: '#FEBC2E' }} /><i style={{ background: '#28C840' }} /><span>zsh — admin</span></div>
        <div className="cms-login-body">
          <p><span className="accent">❯</span> sudo shohan-admin</p>
          {!configured && <p className="cms-error">ADMIN_PASSWORD is not set on the server. Add it to .env (local) or Vercel (live).</p>}
          <label htmlFor="pw">[sudo] password:</label>
          <input id="pw" type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="cms-error" role="alert">{error}</p>}
          <button className="cms-btn cms-btn-accent" disabled={busy || !password}>{busy ? 'checking…' : 'Sign in ↵'}</button>
        </div>
      </form>
    </div>
  );
}

function Shell({ mode, onSignOut }: { mode: string; onSignOut: () => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [sectionId, setSectionId] = useState('projects');
  const [slug, setSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<Entry | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const section = sections.find((s) => s.id === sectionId)!;
  const items = (section.kind === 'collection' ? (data?.[sectionId] as Item[]) : []) ?? [];

  const flash = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    try {
      setData((await api('/api/admin/content')).data);
    } catch (e) {
      if ((e as Error).message === 'Not signed in.') onSignOut();
      else flash({ kind: 'err', text: (e as Error).message });
    }
  }, [onSignOut]);
  useEffect(() => void load(), [load]);

  const open = (sid: string, s: string | null, entry: Entry | null) => {
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return;
    setSectionId(sid);
    setSlug(s);
    setDraft(entry ? structuredClone(entry) : null);
    setDirty(false);
  };

  useEffect(() => {
    if (!data || draft) return;
    if (section.kind === 'singleton') setDraft(structuredClone(data[sectionId] as Entry));
    else if (items[0]) {
      setSlug(items[0].slug);
      setDraft(structuredClone(items[0].entry));
    }
  }, [data, sectionId, draft, section.kind, items]);

  const update = (next: Entry) => {
    setDraft(next);
    setDirty(true);
  };

  const save = useCallback(async () => {
    if (!draft || saving) return;
    setSaving(true);
    try {
      const res = await api('/api/admin/content', send('PUT', { section: sectionId, slug: slug ?? undefined, entry: draft }));
      if (section.kind === 'collection') {
        const saved = res.entry ?? draft;
        const newSlug = res.slug ?? slug;
        const list = items.some((i) => i.slug === newSlug) ? items.map((i) => (i.slug === newSlug ? { slug: newSlug, entry: saved } : i)) : [...items, { slug: newSlug, entry: saved }];
        setData({ ...data!, [sectionId]: list });
        setSlug(newSlug);
        setDraft(structuredClone(saved));
      } else setData({ ...data!, [sectionId]: draft });
      setDirty(false);
      flash({ kind: 'ok', text: mode === 'github' ? 'Saved to GitHub — the live site updates in about a minute.' : 'Saved. Refresh the site tab to see it.' });
    } catch (e) {
      flash({ kind: 'err', text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }, [draft, saving, sectionId, slug, section.kind, items, data, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const remove = async () => {
    if (!slug || !confirm(`Delete "${draft?.title}"? This can't be undone from here.`)) return;
    try {
      await api('/api/admin/content', send('DELETE', { section: sectionId, slug }));
      const rest = items.filter((i) => i.slug !== slug);
      setData({ ...data!, [sectionId]: rest });
      setDirty(false);
      setSlug(rest[0]?.slug ?? null);
      setDraft(rest[0] ? structuredClone(rest[0].entry) : null);
      flash({ kind: 'ok', text: 'Deleted.' });
    } catch (e) {
      flash({ kind: 'err', text: (e as Error).message });
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const other = index + dir;
    if (other < 0 || other >= items.length) return;
    const list = items.map((i) => ({ ...i, entry: { ...i.entry } }));
    list.forEach((i, n) => (i.entry.order = n + 1));
    [list[index].entry.order, list[other].entry.order] = [list[other].entry.order, list[index].entry.order];
    list.sort((a, b) => a.entry.order - b.entry.order);
    setData({ ...data!, [sectionId]: list });
    if (draft && slug) setDraft({ ...draft, order: list.find((i) => i.slug === slug)!.entry.order });
    try {
      await Promise.all(list.map((i) => api('/api/admin/content', send('PUT', { section: sectionId, slug: i.slug, entry: slug === i.slug && draft ? { ...draft, order: i.entry.order } : i.entry }))));
      if (slug) setDirty(false);
      flash({ kind: 'ok', text: 'Order saved.' });
    } catch (e) {
      flash({ kind: 'err', text: (e as Error).message });
    }
  };

  const signOut = async () => {
    if (dirty && !confirm('You have unsaved changes. Sign out anyway?')) return;
    await api('/api/admin/session', { method: 'DELETE' });
    onSignOut();
  };

  if (!data) return <div className="cms-center muted">loading content…</div>;
  const isNew = section.kind === 'collection' && draft && !slug;

  return (
    <div className="cms">
      <aside className="cms-side">
        <div className="cms-brand"><span className="accent">shohan</span><span className="muted">/admin</span></div>
        {(['Site', 'Content'] as const).map((g) => (
          <nav key={g} aria-label={g}>
            <span className="cms-group">{g.toUpperCase()}</span>
            {sections.filter((s) => s.group === g).map((s) => (
              <button key={s.id} className={`cms-nav ${s.id === sectionId ? 'on' : ''}`} onClick={() => open(s.id, null, null)}>
                {s.label}
                {s.kind === 'collection' && <span className="mono">{(data[s.id] as Item[]).length}</span>}
              </button>
            ))}
          </nav>
        ))}
        <div className="cms-side-foot">
          <span className={`cms-mode ${mode}`}>{mode === 'github' ? '● live · saves to GitHub' : mode === 'readonly' ? '● read-only · set GITHUB_TOKEN' : '● local · saves to files'}</span>
          <a href="/" target="_blank" rel="noopener">View site ↗</a>
          <button className="cms-link" onClick={signOut}>Sign out</button>
        </div>
      </aside>

      <main className="cms-main">
        <header className="cms-top">
          <div className="cms-crumb">
            <span>{section.label.toLowerCase()}</span>
            {section.kind === 'collection' && draft && <><span>/</span><b>{slug ?? 'new'}</b></>}
            {dirty && <span className="cms-pill">unsaved changes</span>}
          </div>
          <div className="cms-actions">
            {section.kind === 'collection' && slug && <button className="cms-btn cms-btn-danger" onClick={remove}>Delete</button>}
            <button className="cms-btn cms-btn-accent" onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : isNew ? 'Create ↵' : 'Save ↵'}</button>
          </div>
        </header>

        <div className="cms-body">
          {section.kind === 'collection' && (
            <section className="cms-list" aria-label={`${section.label} list`}>
              <div className="cms-list-head">
                <h2>All items · {items.length}</h2>
                <button className="cms-btn cms-btn-ghost" onClick={() => open(sectionId, null, structuredClone(section.newItem ?? { title: 'New item' }))}>+ New</button>
              </div>
              {items.map((it, i) => (
                <div key={it.slug} className={`cms-row ${it.slug === slug ? 'on' : ''}`}>
                  <button className="cms-row-main" onClick={() => open(sectionId, it.slug, it.entry)}>
                    <b>{it.entry.title}</b>
                    <span className="mono">{subtitle(section, it.entry)}</span>
                  </button>
                  <div className="cms-row-move">
                    <button aria-label={`Move ${it.entry.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                    <button aria-label={`Move ${it.entry.title} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="muted" style={{ padding: 18 }}>Nothing here yet.</p>}
            </section>
          )}

          {draft ? (
            <>
              <form className="cms-form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
                <h1>{isNew ? `New ${section.label.toLowerCase()}` : section.kind === 'singleton' ? section.label : `Edit: ${draft.title ?? ''}`}</h1>
                <Fields fields={section.fields} value={draft} onChange={update} idPrefix={sectionId} mode={mode} />
                <p className="muted mono" style={{ fontSize: 12 }}>Tip: ⌘S / Ctrl+S saves.</p>
              </form>
              <section className="cms-preview" aria-label="Live preview">
                <h2 className="cms-label">LIVE PREVIEW</h2>
                <Preview section={section} entry={draft} />
              </section>
            </>
          ) : (
            <div className="cms-empty muted">Pick an item or add a new one.</div>
          )}
        </div>
      </main>

      {toast && <div className={`cms-toast ${toast.kind}`} role="status">{toast.text}</div>}
    </div>
  );
}

function subtitle(s: Section, e: Entry) {
  if (s.id === 'projects') return `${e.size ?? ''} · ${e.kind || 'project'}`;
  if (s.id === 'experience') return e.period ?? '';
  if (s.id === 'posts') return `${e.date ?? ''} · ${e.draft ? 'draft' : 'published'}`;
  return e.tools ?? '';
}

function Fields({ fields, value, onChange, idPrefix, mode }: { fields: Field[]; value: Entry; onChange: (v: Entry) => void; idPrefix: string; mode: string }) {
  return (
    <>
      {fields.map((f) => (
        <FieldInput key={f.key} field={f} value={value[f.key]} id={`${idPrefix}-${f.key}`} mode={mode} onChange={(v) => onChange({ ...value, [f.key]: v })} />
      ))}
    </>
  );
}

function Wrap({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="cms-field">
      <label htmlFor={id}>{label}{hint && <span className="muted"> · {hint}</span>}</label>
      {children}
    </div>
  );
}

function FieldInput({ field: f, value, onChange, id, mode }: { field: Field; value: any; onChange: (v: any) => void; id: string; mode: string }) {
  switch (f.type) {
    case 'text':
    case 'url':
    case 'date':
      return <Wrap id={id} label={f.label} hint={f.hint}><input id={id} type={f.type === 'url' ? 'url' : f.type === 'date' ? 'date' : 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Wrap>;
    case 'color':
      return (
        <Wrap id={id} label={f.label}>
          <div className="cms-color"><input type="color" aria-label={`${f.label} picker`} value={/^#[0-9a-f]{6}$/i.test(value ?? '') ? value : '#3DDC97'} onChange={(e) => onChange(e.target.value.toUpperCase())} /><input id={id} type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></div>
        </Wrap>
      );
    case 'textarea':
      return <Wrap id={id} label={f.label} hint={f.hint}><textarea id={id} rows={f.key === 'body' ? 16 : 4} className={f.key === 'body' ? 'mono' : ''} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></Wrap>;
    case 'number':
      return <Wrap id={id} label={f.label}><input id={id} type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} /></Wrap>;
    case 'checkbox':
      return <label className="cms-check"><input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> {f.label}</label>;
    case 'select':
      return <Wrap id={id} label={f.label}><select id={id} value={value ?? f.options[0].value} onChange={(e) => onChange(e.target.value)}>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Wrap>;
    case 'list':
      return <ListInput id={id} label={f.label} hint={f.hint} value={value ?? []} onChange={onChange} />;
    case 'object':
      return (
        <fieldset className="cms-group-box">
          <legend>{f.label}</legend>
          <Fields fields={f.fields} value={value ?? {}} onChange={onChange} idPrefix={id} mode={mode} />
        </fieldset>
      );
    case 'objectList':
      return <ObjectList field={f} id={id} value={value ?? []} onChange={onChange} mode={mode} />;
    case 'upload':
      return <Upload id={id} label={f.label} dir={f.dir} accept={f.accept} value={value} onChange={onChange} mode={mode} />;
  }
}

function ListInput({ id, label, hint, value, onChange }: { id: string; label: string; hint?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [next, setNext] = useState('');
  const add = () => {
    if (!next.trim()) return;
    onChange([...value, next.trim()]);
    setNext('');
  };
  return (
    <Wrap id={id} label={label} hint={hint}>
      <div className="cms-list-input">
        {value.map((v, i) => (
          <div key={i} className="cms-list-item">
            <input aria-label={`${label} ${i + 1}`} value={v} onChange={(e) => onChange(value.map((x, n) => (n === i ? e.target.value : x)))} />
            <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_, n) => n !== i))}>×</button>
          </div>
        ))}
        <div className="cms-list-item">
          <input id={id} placeholder="Add and press Enter" value={next} onChange={(e) => setNext(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
          <button type="button" aria-label="Add" onClick={add}>+</button>
        </div>
      </div>
    </Wrap>
  );
}

function ObjectList({ field, id, value, onChange, mode }: { field: Extract<Field, { type: 'objectList' }>; id: string; value: Entry[]; onChange: (v: Entry[]) => void; mode: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const blank = useMemo(() => Object.fromEntries(field.fields.map((f) => [f.key, f.type === 'checkbox' ? false : ''])), [field.fields]);
  const swap = (i: number, j: number) => {
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <fieldset className="cms-group-box">
      <legend>{field.label} · {value.length}</legend>
      {value.map((item, i) => (
        <div key={i} className="cms-obj">
          <div className="cms-obj-head">
            <button type="button" className="cms-obj-title" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{open === i ? '▾' : '▸'} {String(item[field.itemTitle] || `Item ${i + 1}`)}</button>
            <div className="cms-row-move">
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => swap(i, i - 1)}>↑</button>
              <button type="button" aria-label="Move down" disabled={i === value.length - 1} onClick={() => swap(i, i + 1)}>↓</button>
              <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_, n) => n !== i))}>×</button>
            </div>
          </div>
          {open === i && <Fields fields={field.fields} value={item} onChange={(v) => onChange(value.map((x, n) => (n === i ? v : x)))} idPrefix={`${id}-${i}`} mode={mode} />}
        </div>
      ))}
      <button type="button" className="cms-btn cms-btn-ghost" onClick={() => { onChange([...value, { ...blank }]); setOpen(value.length); }}>+ Add</button>
    </fieldset>
  );
}

function Upload({ id, label, dir, accept, value, onChange, mode }: { id: string; label: string; dir: string; accept: string; value?: string; onChange: (v: string) => void; mode: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    form.append('dir', dir);
    try {
      onChange((await api('/api/admin/upload', { method: 'POST', body: form })).path);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const isImage = accept.startsWith('image');
  return (
    <Wrap id={id} label={label}>
      <div className="cms-upload">
        {value && isImage && <img src={value} alt="" />}
        {value && !isImage && <a className="mono" href={value} target="_blank" rel="noopener">{value}</a>}
        <div className="cms-upload-actions">
          <label className="cms-btn cms-btn-ghost">
            {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
            <input id={id} type="file" accept={accept} hidden onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {value && <button type="button" className="cms-link" onClick={() => onChange('')}>Remove</button>}
        </div>
        {mode === 'github' && <span className="muted" style={{ fontSize: 12 }}>New files appear on the live site after the next rebuild.</span>}
        {error && <span className="cms-error">{error}</span>}
      </div>
    </Wrap>
  );
}
