import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { navigate } from '../hooks/useRoute.js';
import { useApiCollection } from '../hooks/useApiCollection.js';
import { useSavedContent } from '../hooks/useSavedContent.js';

const fallbackNotes = [];

const typeOptions = ['All Types', 'PDF', 'Cheat Sheet', 'Notes', 'Source Code'];
const languageOptions = ['All Languages', 'Java', 'SQL', 'Python', 'Linux', 'JavaScript', 'Git'];
const sortOptions = ['Most Popular', 'Newest', 'Shortest', 'Longest'];

function Icon({ name, className = 'h-5 w-5' }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };
  const icons = {
    shield: <svg {...common}><path d="M12 3 19 6v5c0 4.5-2.9 8.4-7 10-4.1-1.6-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-5" /></svg>,
    file: <svg {...common}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v6h5" /></svg>,
    rocket: <svg {...common}><path d="M14 4c3 1 5 3 6 6l-5 5-6-6 5-5Z" /><path d="m9 15-4 4" /><path d="M8 12l-3 1 1-3" /><path d="m12 16-1 3 3-1" /></svg>,
    search: <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></svg>,
    filter: <svg {...common}><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></svg>,
    grid: <svg {...common}><path d="M5 5h6v6H5z" /><path d="M13 5h6v6h-6z" /><path d="M5 13h6v6H5z" /><path d="M13 13h6v6h-6z" /></svg>,
    code: <svg {...common}><path d="m9 8-4 4 4 4" /><path d="m15 8 4 4-4 4" /><path d="m13 5-2 14" /></svg>,
    database: <svg {...common}><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>,
    network: <svg {...common}><circle cx="6" cy="12" r="2" /><circle cx="12" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="12" cy="18" r="2" /><path d="m8 11 3-3" /><path d="m13 8 3 3" /><path d="m16 13-3 3" /><path d="m11 16-3-3" /></svg>,
    python: <svg {...common}><path d="M8 9V6a3 3 0 0 1 3-3h3a2 2 0 0 1 2 2v4H9a4 4 0 0 0-4 4v1" /><path d="M16 15v3a3 3 0 0 1-3 3h-3a2 2 0 0 1-2-2v-4h7a4 4 0 0 0 4-4v-1" /><path d="M11 6h.01" /><path d="M13 18h.01" /></svg>,
    terminal: <svg {...common}><path d="m7 8 4 4-4 4" /><path d="M12 17h5" /><rect x="3" y="4" width="18" height="16" rx="2" /></svg>,
    github: <svg {...common}><path d="M9 19c-4 1.2-4-2-5-2.5" /><path d="M15 22v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.3 5.5-6A4.6 4.6 0 0 0 18.7 7c.1-.3.6-1.6-.1-3.3 0 0-1.1-.3-3.6 1.3a12.3 12.3 0 0 0-6 0C6.5 3.4 5.4 3.7 5.4 3.7c-.7 1.7-.2 3-.1 3.3A4.6 4.6 0 0 0 4 10.5c0 4.7 2.7 5.7 5.5 6-.6.5-.6 1.2-.5 2V22" /></svg>,
    download: <svg {...common}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>,
    eye: <svg {...common}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>,
    close: <svg {...common}><path d="m6 6 12 12" /><path d="m18 6-12 12" /></svg>,
  };
  return icons[name] || icons.file;
}

function normalizeNote(item) {
  const category = String(item.category || 'development').toLowerCase();
  const resourceType = item.resourceType || item.type || 'PDF';

  return {
    ...item,
    _id: item._id || item.id || item.slug || item.title,
    category,
    type: resourceType,
    language: item.language || 'General',
    pages: Number(item.pages || 0),
    downloads: item.downloads || '0',
    icon: item.icon || iconForNote(item),
    topics: Array.isArray(item.topics) ? item.topics : [],
    updated: item.updated || item.updatedAt || new Date().toISOString(),
    fileName: item.fileName || '',
    fileType: item.fileType || '',
    fileData: item.fileData || '',
  };
}

function iconForNote(item) {
  const category = String(item.category || '').toLowerCase();
  if (['java'].includes(category)) return 'code';
  if (['sql'].includes(category)) return 'database';
  if (['python'].includes(category)) return 'python';
  if (['devops'].includes(category)) return 'terminal';
  if (['dsa'].includes(category)) return 'github';
  return 'file';
}

export default function Notes() {
  const auth = useAuth();
  const { items, loading } = useApiCollection('notes');
  const { savedIds, toggleSaved } = useSavedContent(auth?.token);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('All Types');
  const [language, setLanguage] = useState('All Languages');
  const [sort, setSort] = useState('Most Popular');
  const [preview, setPreview] = useState(null);

  const notes = useMemo(() => items.map((item) => normalizeNote(item)), [items]);
  const categories = useMemo(() => {
    const values = Array.from(new Set(notes.map((item) => item.category).filter(Boolean))).sort();
    return [{ id: 'all', label: 'All' }, ...values.map((value) => ({ id: value, label: value.replace(/^\w/, (letter) => letter.toUpperCase()) }))];
  }, [notes]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const result = notes.filter((note) => {
      const matchesCategory = category === 'all' || note.category === category;
      const matchesType = type === 'All Types' || note.type === type;
      const matchesLanguage = language === 'All Languages' || note.language === language;
      const searchable = `${note.title} ${note.description} ${note.category} ${note.type} ${note.language} ${note.topics.join(' ')}`.toLowerCase();
      return matchesCategory && matchesType && matchesLanguage && searchable.includes(search);
    });

    return result.sort((a, b) => {
      if (sort === 'Shortest') return a.pages - b.pages;
      if (sort === 'Longest') return b.pages - a.pages;
      if (sort === 'Newest') return String(b.updated).localeCompare(String(a.updated));
      return parseDownloads(b.downloads) - parseDownloads(a.downloads);
    });
  }, [category, language, notes, query, sort, type]);

  const toggleSave = async (id) => {
    if (!auth?.token) {
      navigate('/login');
      return;
    }

    try {
      await toggleSaved(id);
    } catch (_error) {
      navigate('/login');
    }
  };

  const downloadNote = (note) => {
    const url = note.fileData || URL.createObjectURL(new Blob([
      note.title,
      '',
      note.description,
      '',
      `Type: ${note.type}`,
      `Language: ${note.language}`,
      `Pages: ${note.pages}`,
      '',
      'Topics:',
      ...note.topics.map((topic) => `- ${topic}`),
    ], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = note.fileName || `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${note.fileType.includes('pdf') ? 'pdf' : 'txt'}`;
    anchor.click();
    if (!note.fileData) URL.revokeObjectURL(url);
  };

  return (
    <div className="relative overflow-hidden bg-[#050817] pt-[70px] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_16%_14%,rgba(20,184,166,0.14),transparent_22%),radial-gradient(circle_at_82%_22%,rgba(124,58,237,0.20),transparent_20%),linear-gradient(180deg,#050817_0%,#071223_52%,#050817_100%)]" />

      <section className="relative mx-auto w-full max-w-6xl px-5 pb-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            Tech <span className="text-cyan-300">Resources</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Discover developer-focused resources crafted to help you master modern technologies faster
          </p>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-5 py-3 sm:px-6 lg:px-8">
        <div className="grid rounded-[8px] border border-white/10 bg-[#0b1226]/82 shadow-2xl shadow-black/30 sm:grid-cols-3">
          <LibraryFeature icon="shield" title="High Quality" text="Well-structured and easy to understand" tone="cyan" />
          <LibraryFeature icon="file" title="Free Access" text="All notes and PDFs are free to download" tone="blue" />
          <LibraryFeature icon="rocket" title="Always Updated" text="New resources added regularly" tone="violet" />
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-5 py-3 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-[8px] border border-white/10 bg-[#0b1226]/80 p-3 shadow-xl shadow-black/25 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
          <label className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" className="h-4 w-4" /></span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes..."
              className="h-10 w-full rounded-[7px] border border-white/10 bg-black/30 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>
          <Select value={type} onChange={setType} options={typeOptions} />
          <Select value={language} onChange={setLanguage} options={languageOptions} />
          <Select value={sort} onChange={setSort} options={sortOptions} />
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('all');
              setType('All Types');
              setLanguage('All Languages');
              setSort('Most Popular');
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[7px] border border-white/10 px-4 text-xs font-bold text-slate-200 transition hover:bg-white/10"
          >
            <Icon name="filter" className="h-4 w-4" /> Reset
          </button>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-5 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white">Browse by Category</h2>
            <p className="mt-1 text-xs text-slate-400">Explore resources by type</p>
          </div>
          <span className="text-xs text-slate-400">{filtered.length} resources</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`inline-flex h-10 items-center gap-2 rounded-[7px] border px-5 text-xs font-black transition ${category === item.id ? 'border-transparent bg-gradient-to-r from-cyan-300 to-violet-500 text-white shadow-lg shadow-cyan-950/30' : 'border-white/10 bg-[#0b1226]/74 text-slate-300 hover:bg-white/10'}`}
            >
              <Icon name={item.id === 'all' ? 'grid' : item.id === 'sql' ? 'database' : item.id === 'devops' ? 'terminal' : 'file'} className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-2 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Popular Resources</h2>
            <p className="mt-1 text-xs text-slate-400">Hand-picked resources to boost your development skills</p>
          </div>
          <button type="button" onClick={() => setCategory('all')} className="rounded-[7px] border border-cyan-300/30 px-4 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-300/10">
            View All
          </button>
        </div>

        {loading && <p className="mb-4 text-sm text-slate-400">Refreshing library...</p>}
        {filtered.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((note) => (
              <NoteResourceCard
                key={note._id}
                note={note}
                saved={savedIds.has(note._id)}
                onToggleSave={toggleSave}
                onPreview={setPreview}
                onDownload={downloadNote}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-white/10 bg-[#0b1226]/82 p-10 text-center">
            <h2 className="text-2xl font-bold">No notes found</h2>
            <p className="mt-2 text-slate-400">Try another search, category or filter.</p>
          </div>
        )}
      </section>

      {preview && (
        <PreviewModal
          note={preview}
          saved={savedIds.has(preview._id)}
          onClose={() => setPreview(null)}
          onToggleSave={toggleSave}
          onDownload={downloadNote}
        />
      )}
    </div>
  );
}

function parseDownloads(value) {
  const text = String(value || '0').toLowerCase();
  const number = Number.parseFloat(text) || 0;
  return text.includes('k') ? number * 1000 : number;
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-[7px] border border-white/10 bg-[#07101f] px-3 text-xs font-bold text-slate-200 outline-none focus:border-cyan-300"
    >
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  );
}

function LibraryFeature({ icon, title, text, tone }) {
  const tones = {
    cyan: 'bg-cyan-500/15 text-cyan-200',
    blue: 'bg-blue-500/15 text-blue-200',
    violet: 'bg-violet-500/18 text-violet-200',
  };

  return (
    <div className="flex items-center gap-4 border-b border-white/10 p-5 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tones[tone]}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-sm font-black text-white">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function NoteResourceCard({ note, saved, onToggleSave, onPreview, onDownload }) {
  const typeTone = note.type === 'PDF' ? 'text-cyan-300 bg-cyan-300/10 border-cyan-300/20' : note.type === 'Cheat Sheet' ? 'text-violet-300 bg-violet-300/10 border-violet-300/20' : 'text-emerald-300 bg-emerald-300/10 border-emerald-300/20';

  return (
    <article className="overflow-hidden rounded-[8px] border border-white/10 bg-[#0b1226]/86 shadow-2xl shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/45">
      <div className="flex items-center justify-between border-b border-white/8 p-4">
        <span className={`rounded-[6px] border px-2.5 py-1 text-[11px] font-black uppercase ${typeTone}`}>{note.type}</span>
        <button
          type="button"
          aria-label={saved ? 'Remove saved resource' : 'Save resource'}
          onClick={() => onToggleSave(note._id)}
          className={`grid h-8 w-8 place-items-center rounded-[7px] border transition ${saved ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100' : 'border-white/10 text-slate-400 hover:bg-white/10'}`}
        >
          <Icon name="file" className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="p-5">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-cyan-400/25 to-violet-500/25 text-cyan-200 shadow-[0_0_34px_rgba(34,211,238,0.18)]">
          <Icon name={note.icon} className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-center text-lg font-black leading-snug text-white">{note.title}</h3>
        <p className="mt-2 min-h-12 text-center text-sm leading-6 text-slate-400">{note.description}</p>
        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500">
          <span>{note.pages} Pages</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span>{note.downloads} downloads</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/8 p-4">
        <button
          type="button"
          onClick={() => onDownload(note)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[7px] bg-gradient-to-r from-cyan-300 to-violet-500 px-3 text-xs font-black text-white transition hover:-translate-y-0.5"
        >
          <Icon name="download" className="h-4 w-4" /> Download
        </button>
        <button
          type="button"
          onClick={() => onPreview(note)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[7px] border border-white/10 bg-white/[0.03] px-3 text-xs font-black text-slate-200 transition hover:bg-white/10"
        >
          <Icon name="eye" className="h-4 w-4" /> Preview
        </button>
      </div>
    </article>
  );
}

function PreviewModal({ note, saved, onClose, onToggleSave, onDownload }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${note.title} preview`}>
      <div className="w-full max-w-2xl overflow-hidden rounded-[8px] border border-white/10 bg-[#0b1226] shadow-2xl shadow-black">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{note.type} Resource</p>
            <h2 className="mt-1 text-2xl font-black text-white">{note.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close preview" className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-white/10 text-slate-200 transition hover:bg-white/10">
            <Icon name="close" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm leading-6 text-slate-300">{note.description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Info label="Language" value={note.language} />
            <Info label="Pages" value={note.pages} />
            <Info label="Downloads" value={note.downloads} />
          </div>
          <div className="mt-5 overflow-hidden rounded-[8px] border border-white/10 bg-black/30">
            {note.fileData ? (
              <iframe title={note.title} src={note.fileData} className="h-[60vh] w-full" />
            ) : (
              <div className="grid min-h-[260px] place-items-center px-6 py-12 text-center text-sm text-slate-400">
                No file preview available. Upload a PDF in the admin panel to enable preview.
              </div>
            )}
          </div>
          <div className="mt-5">
            <h3 className="text-sm font-black uppercase text-white">Included Topics</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {note.topics.map((topic) => (
                <span key={topic} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-200">{topic}</span>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => onDownload(note)} className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-cyan-300 to-violet-500 px-5 text-sm font-black text-white">
              <Icon name="download" /> Download
            </button>
            <button type="button" onClick={() => onToggleSave(note._id)} className={`inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border px-5 text-sm font-black ${saved ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100' : 'border-white/10 text-slate-200 hover:bg-white/10'}`}>
              <Icon name="file" /> {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
      <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-black text-white">{value}</div>
    </div>
  );
}



