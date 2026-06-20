import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import { buttonOutline, buttonPrimary, buttonSecondary, glass, input, shell } from '../components/ui/classes.js';
import { useAuth } from '../hooks/useAuth.js';
import { apiDelete, apiGet, apiPost, apiPut } from '../services/api.js';

const collections = ['tutorials', 'notes', 'roadmaps', 'resources'];

const emptyForms = {
  tutorials: {
    title: '',
    category: 'development',
    description: '',
    level: 'Beginner',
    duration: '',
    minutes: '',
    lessons: '',
    instructor: '',
    status: 'published',
    featured: false,
    videoUrl: '',
    body: '',
  },
  notes: {
    title: '',
    category: 'development',
    description: '',
    resourceType: 'PDF',
    pages: '',
    author: 'The Epoch Nova',
    readTime: '',
    fileName: '',
    fileType: '',
    fileData: '',
    status: 'published',
    featured: false,
    body: '',
  },
  roadmaps: {
    title: '',
    category: 'development',
    description: '',
    level: 'Beginner to Advanced',
    modules: '',
    status: 'published',
    featured: false,
    steps: '',
    outcomes: '',
    body: '',
  },
  resources: {
    title: '',
    category: 'development',
    description: '',
    resourceType: 'Guide',
    author: 'The Epoch Nova',
    status: 'published',
    featured: false,
    fileName: '',
    fileType: '',
    fileData: '',
    body: '',
  },
};

function normalizeListItem(item) {
  return {
    _id: item._id,
    title: item.title || '',
    category: item.category || 'development',
    status: item.status || 'draft',
    featured: Boolean(item.featured),
    description: item.description || item.excerpt || '',
    type: item.type,
  };
}

function serializePayload(collection, form) {
  const payload = { ...form };
  payload.featured = Boolean(form.featured);

  ['minutes', 'lessons', 'pages', 'modules'].forEach((key) => {
    if (payload[key] === '') delete payload[key];
    else if (payload[key] != null) payload[key] = Number(payload[key]);
  });

  if (collection === 'roadmaps') {
    payload.steps = String(form.steps || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    payload.outcomes = String(form.outcomes || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    delete payload.minutes;
    delete payload.lessons;
    delete payload.duration;
    delete payload.videoUrl;
    delete payload.resourceType;
    delete payload.pages;
    delete payload.author;
    delete payload.readTime;
  }

  if (collection === 'notes') {
    delete payload.lessons;
    delete payload.minutes;
    delete payload.duration;
    delete payload.instructor;
    delete payload.modules;
    delete payload.fileUrl;
  }

  if (collection === 'tutorials') {
    delete payload.resourceType;
    delete payload.pages;
    delete payload.author;
    delete payload.readTime;
    delete payload.modules;
  }

  if (collection === 'resources') {
    delete payload.lessons;
    delete payload.minutes;
    delete payload.duration;
    delete payload.instructor;
    delete payload.pages;
    delete payload.readTime;
    delete payload.modules;
    delete payload.fileUrl;
  }

  return payload;
}

function hydrateForm(collection, item) {
  const base = { ...emptyForms[collection] };
  if (!item) return base;

  const next = {
    ...base,
    title: item.title || '',
    category: item.category || base.category,
    description: item.description || item.excerpt || '',
    status: item.status || base.status,
    featured: Boolean(item.featured),
    body: item.body || '',
  };

  if (collection === 'tutorials') {
    next.level = item.level || 'Beginner';
    next.duration = item.duration || '';
    next.minutes = item.minutes ?? '';
    next.lessons = item.lessons ?? '';
    next.instructor = item.instructor || '';
    next.videoUrl = item.videoUrl || '';
  }

  if (collection === 'notes') {
    next.resourceType = item.resourceType || 'PDF';
    next.pages = item.pages ?? '';
    next.author = item.author || 'The Epoch Nova';
    next.readTime = item.readTime || '';
    next.fileName = item.fileName || '';
    next.fileType = item.fileType || '';
    next.fileData = item.fileData || '';
  }

  if (collection === 'roadmaps') {
    next.level = item.level || 'Beginner to Advanced';
    next.modules = item.modules ?? '';
    next.steps = Array.isArray(item.steps) ? item.steps.join('\n') : '';
    next.outcomes = Array.isArray(item.outcomes) ? item.outcomes.join('\n') : '';
  }

  if (collection === 'resources') {
    next.resourceType = item.resourceType || 'Guide';
    next.author = item.author || 'The Epoch Nova';
    next.fileName = item.fileName || '';
    next.fileType = item.fileType || '';
    next.fileData = item.fileData || '';
  }

  return next;
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-4 text-center shadow-lg shadow-black/20">
      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
    </div>
  );
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboard() {
  const auth = useAuth();
  const [collection, setCollection] = useState('tutorials');
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(emptyForms.tutorials);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [authDraft, setAuthDraft] = useState({ email: 'admin@theepochnova.com', password: 'admin123' });

  useEffect(() => {
    setForm(hydrateForm(collection));
    setEditingId(null);
    setNotice('');
    setError('');
  }, [collection]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      apiGet(`/${collection}?status=all&limit=200&sort=-createdAt`, auth?.token),
      apiGet(`/${collection}/stats`, auth?.token),
    ])
      .then(([list, statData]) => {
        if (!mounted) return;
        setItems((list.items || []).map(normalizeListItem));
        setStats(statData);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load content');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [auth?.token, collection]);

  const pageTitle = useMemo(() => collection.charAt(0).toUpperCase() + collection.slice(1), [collection]);
  const actionLabel = editingId ? `Edit ${pageTitle.slice(0, -1)}` : `Create ${pageTitle.slice(0, -1)}`;

  async function handleFileInput(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileData = await readFileAsDataURL(file);
      setForm((current) => ({
        ...current,
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        fileData,
      }));
      setNotice(`Loaded ${file.name}`);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to read file');
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError('');

    try {
      const data = await apiPost('/auth/login', authDraft);
      localStorage.setItem('epochNovaAuth', JSON.stringify(data));
      window.dispatchEvent(new Event('epochNovaAuthChange'));
    } catch (err) {
      setError(err.message || 'Unable to log in');
    }
  }

  async function startEdit(item) {
    setError('');
    setNotice(`Loading ${item.title}...`);

    try {
      const response = await apiGet(`/${collection}/${item._id}`, auth.token);
      const fullItem = response?.item || item;
      setEditingId(item._id);
      setForm(hydrateForm(collection, fullItem));
      setNotice(`Editing ${item.title}`);
    } catch (err) {
      setEditingId(item._id);
      setForm(hydrateForm(collection, item));
      setNotice(`Editing ${item.title} with list data`);
      setError(err.message || 'Loaded a partial item because the full record could not be fetched.');
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(hydrateForm(collection));
    setNotice('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!auth?.token || auth?.user?.role !== 'admin') return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = serializePayload(collection, form);
      const saved = editingId
        ? await apiPut(`/${collection}/${editingId}`, payload, auth.token)
        : await apiPost(`/${collection}`, payload, auth.token);

      const item = normalizeListItem(saved.item || saved);
      setItems((current) => {
        if (editingId) return current.map((entry) => (entry._id === item._id ? item : entry));
        return [item, ...current];
      });
      setNotice(editingId ? `${pageTitle.slice(0, -1)} updated successfully.` : `${pageTitle.slice(0, -1)} created successfully.`);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!auth?.token || auth?.user?.role !== 'admin') return;
    if (!window.confirm(`Delete ${item.title}?`)) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      await apiDelete(`/${collection}/${item._id}`, auth.token);
      setItems((current) => current.filter((entry) => entry._id !== item._id));
      if (editingId === item._id) resetForm();
      setNotice(`${item.title} deleted.`);
    } catch (err) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setSaving(false);
    }
  }

  if (!auth?.token || auth?.user?.role !== 'admin') {
    return (
      <>
        <PageHeader title="Admin" accent="Dashboard" subtitle="Sign in to manage tutorials, notes, roadmaps and resources." />
        <section className="py-10">
          <div className={shell}>
            <form className={`${glass} mx-auto grid max-w-md gap-5`} onSubmit={handleLogin}>
              <h3 className="text-2xl font-bold text-white">Admin Login</h3>
              <Field label="Email">
                <input className={input} name="email" type="email" value={authDraft.email} onChange={(event) => setAuthDraft((current) => ({ ...current, email: event.target.value }))} />
              </Field>
              <Field label="Password">
                <input className={input} name="password" type="password" value={authDraft.password} onChange={(event) => setAuthDraft((current) => ({ ...current, password: event.target.value }))} />
              </Field>
              <button className={buttonPrimary}>Login</button>
              <p className="text-sm text-neutral-500">Seed admin: admin@theepochnova.com / admin123</p>
              {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            </form>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Admin" accent="Dashboard" subtitle="Manage tutorials, notes, roadmaps and resources end to end." />
      <section className="pb-10">
        <div className={shell}>
          <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-neutral-900/70 p-3 backdrop-blur">
            {collections.map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${collection === item ? 'border-transparent bg-gradient-to-r from-cyan-300 to-violet-500 text-black' : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/10'}`}
                onClick={() => setCollection(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <SummaryCard label="Total" value={stats?.total ?? items.length} />
            <SummaryCard label="Published" value={stats?.published ?? 0} />
            <SummaryCard label="Drafts" value={stats?.drafts ?? 0} />
            <SummaryCard label="Featured" value={stats?.featured ?? 0} />
          </div>

          {notice && <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
          {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <form className={`${glass} grid gap-4`} onSubmit={handleSubmit}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-white">{actionLabel}</h3>
                {editingId && (
                  <button type="button" onClick={resetForm} className={buttonSecondary}>
                    Cancel
                  </button>
                )}
              </div>

              <Field label="Title">
                <input className={input} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Content title" />
              </Field>

              <Field label="Category">
                <input className={input} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="java, sql, dsa, development..." />
              </Field>

              <Field label="Description">
                <textarea className={input} rows="4" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Short description" />
              </Field>

              {collection === 'tutorials' && (
                <>
                  <Field label="Level">
                    <input className={input} value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} placeholder="Beginner, Intermediate, Advanced" />
                  </Field>
                  <Field label="Duration">
                    <input className={input} value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))} placeholder="42 min" />
                  </Field>
                  <Field label="Minutes">
                    <input className={input} type="number" value={form.minutes} onChange={(event) => setForm((current) => ({ ...current, minutes: event.target.value }))} placeholder="42" />
                  </Field>
                  <Field label="Lessons">
                    <input className={input} type="number" value={form.lessons} onChange={(event) => setForm((current) => ({ ...current, lessons: event.target.value }))} placeholder="18" />
                  </Field>
                  <Field label="Instructor">
                    <input className={input} value={form.instructor} onChange={(event) => setForm((current) => ({ ...current, instructor: event.target.value }))} placeholder="Instructor name" />
                  </Field>
                  <Field label="Video URL">
                    <input className={input} value={form.videoUrl} onChange={(event) => setForm((current) => ({ ...current, videoUrl: event.target.value }))} placeholder="https://..." />
                  </Field>
                </>
              )}

              {collection === 'notes' && (
                <>
                  <Field label="Resource Type">
                    <input className={input} value={form.resourceType} onChange={(event) => setForm((current) => ({ ...current, resourceType: event.target.value }))} placeholder="PDF, Cheat Sheet, Notes" />
                  </Field>
                  <Field label="Pages">
                    <input className={input} type="number" value={form.pages} onChange={(event) => setForm((current) => ({ ...current, pages: event.target.value }))} placeholder="28" />
                  </Field>
                  <Field label="Author">
                    <input className={input} value={form.author} onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))} placeholder="The Epoch Nova" />
                  </Field>
                  <Field label="Read Time">
                    <input className={input} value={form.readTime} onChange={(event) => setForm((current) => ({ ...current, readTime: event.target.value }))} placeholder="8 min read" />
                  </Field>
                  <Field label="PDF File">
                    <input className={input} type="file" accept="application/pdf" onChange={handleFileInput} />
                  </Field>
                  <Field label="Selected File">
                    <input className={input} readOnly value={form.fileName || 'No file selected'} />
                  </Field>
                </>
              )}

              {collection === 'roadmaps' && (
                <>
                  <Field label="Level">
                    <input className={input} value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} placeholder="Beginner to Advanced" />
                  </Field>
                  <Field label="Modules">
                    <input className={input} type="number" value={form.modules} onChange={(event) => setForm((current) => ({ ...current, modules: event.target.value }))} placeholder="12" />
                  </Field>
                  <Field label="Steps">
                    <textarea className={input} rows="5" value={form.steps} onChange={(event) => setForm((current) => ({ ...current, steps: event.target.value }))} placeholder={['Phase 1', 'Phase 2', 'Phase 3'].join('\n')} />
                  </Field>
                  <Field label="Outcomes">
                    <textarea className={input} rows="4" value={form.outcomes} onChange={(event) => setForm((current) => ({ ...current, outcomes: event.target.value }))} placeholder={['Outcome 1', 'Outcome 2'].join('\n')} />
                  </Field>
                </>
              )}

              {collection === 'resources' && (
                <>
                  <Field label="Resource Type">
                    <input className={input} value={form.resourceType} onChange={(event) => setForm((current) => ({ ...current, resourceType: event.target.value }))} placeholder="Guide, Tool, Checklist" />
                  </Field>
                  <Field label="Author">
                    <input className={input} value={form.author} onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))} placeholder="The Epoch Nova" />
                  </Field>
                  <Field label="PDF File">
                    <input className={input} type="file" accept="application/pdf" onChange={handleFileInput} />
                  </Field>
                  <Field label="Selected File">
                    <input className={input} readOnly value={form.fileName || 'No file selected'} />
                  </Field>
                </>
              )}

              <Field label="Status">
                <select className={input} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>

              <label className="flex items-center gap-3 text-sm font-medium text-neutral-300">
                <input
                  type="checkbox"
                  checked={Boolean(form.featured)}
                  onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))}
                  className="h-4 w-4 rounded border-white/20 bg-white/5"
                />
                Featured content
              </label>

              <div className="flex gap-3">
                <button className={buttonPrimary} disabled={saving} type="submit">
                  {saving ? 'Saving...' : editingId ? 'Update Content' : 'Publish'}
                </button>
                <button type="button" className={buttonOutline} onClick={resetForm}>
                  Reset
                </button>
              </div>
            </form>

            <div className={glass}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-white">Manage {pageTitle}</h3>
                <span className="text-sm text-neutral-400">{loading ? 'Loading...' : `${items.length} items`}</span>
              </div>

              <div className="grid gap-3">
                {items.map((item) => (
                  <article key={item._id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/30">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="block truncate text-white">{item.title}</strong>
                          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-xs text-cyan-300">{item.status || 'draft'}</span>
                          {item.featured && <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-0.5 text-xs text-violet-300">featured</span>}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{item.description || 'No description provided.'}</p>
                        <p className="mt-2 text-xs text-neutral-500">Category: {item.category || 'general'}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" className={buttonSecondary} onClick={() => startEdit(item)}>
                          Edit
                        </button>
                        <button type="button" className={`${buttonSecondary} border-red-400/20 text-red-200 hover:bg-red-500/10`} onClick={() => handleDelete(item)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {!items.length && !loading && (
                  <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-neutral-500">
                    No content yet for this collection.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
