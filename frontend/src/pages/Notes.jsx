import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NoteCard from '../components/cards/NoteCard.jsx';
import { useApiCollection } from '../hooks/useApiCollection.js';
import { useAuth } from '../hooks/useAuth.js';
import { navigate } from '../hooks/useRoute.js';
import { useSavedContent } from '../hooks/useSavedContent.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const typeOptions = ['All Types', 'PDF', 'Cheat Sheet', 'Notes', 'Source Code'];
const languageOptions = ['All Languages', 'Java', 'SQL', 'Python', 'Linux', 'JavaScript', 'Git'];
const sortOptions = ['Most Popular', 'Newest', 'Shortest', 'Longest'];
// One row of notes per page — keep in sync with lg:grid-cols-3 below.
const NOTES_PER_PAGE = 3;
const SEARCH_DEBOUNCE_MS = 150;

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICON_PATHS = {
  shield: <><path d="M12 3 19 6v5c0 4.5-2.9 8.4-7 10-4.1-1.6-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-5" /></>,
  file: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v6h5" /></>,
  rocket: <><path d="M14 4c3 1 5 3 6 6l-5 5-6-6 5-5Z" /><path d="m9 15-4 4" /><path d="M8 12l-3 1 1-3" /><path d="m12 16-1 3 3-1" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></>,
  filter: <><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></>,
  grid: <><path d="M5 5h6v6H5z" /><path d="M13 5h6v6h-6z" /><path d="M5 13h6v6H5z" /><path d="M13 13h6v6h-6z" /></>,
  code: <><path d="m9 8-4 4 4 4" /><path d="m15 8 4 4-4 4" /><path d="m13 5-2 14" /></>,
  database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
  network: <><circle cx="6" cy="12" r="2" /><circle cx="12" cy="6" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="12" cy="18" r="2" /><path d="m8 11 3-3" /><path d="m13 8 3 3" /><path d="m16 13-3 3" /><path d="m11 16-3-3" /></>,
  python: <><path d="M8 9V6a3 3 0 0 1 3-3h3a2 2 0 0 1 2 2v4H9a4 4 0 0 0-4 4v1" /><path d="M16 15v3a3 3 0 0 1-3 3h-3a2 2 0 0 1-2-2v-4h7a4 4 0 0 0 4-4v-1" /><path d="M11 6h.01" /><path d="M13 18h.01" /></>,
  terminal: <><path d="m7 8 4 4-4 4" /><path d="M12 17h5" /><rect x="3" y="4" width="18" height="16" rx="2" /></>,
  github: <><path d="M9 19c-4 1.2-4-2-5-2.5" /><path d="M15 22v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.3 5.5-6A4.6 4.6 0 0 0 18.7 7c.1-.3.6-1.6-.1-3.3 0 0-1.1-.3-3.6 1.3a12.3 12.3 0 0 0-6 0C6.5 3.4 5.4 3.7 5.4 3.7c-.7 1.7-.2 3-.1 3.3A4.6 4.6 0 0 0 4 10.5c0 4.7 2.7 5.7 5.5 6-.6.5-.6 1.2-.5 2V22" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  bookmark: <><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.4L6 20V5a1 1 0 0 1 1-1Z" /></>,
  chevronLeft: <><path d="m14 6-6 6 6 6" /></>,
  chevronRight: <><path d="m10 6 6 6-6 6" /></>,
};

const SVG_COMMON = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.8',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg {...SVG_COMMON} className={className}>
      {ICON_PATHS[name] ?? ICON_PATHS.file}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDownloads(value) {
  const text = String(value || '0').toLowerCase();
  const number = Number.parseFloat(text) || 0;
  return text.includes('k') ? number * 1000 : number;
}

function iconForNote(item) {
  const category = String(item.category || '').toLowerCase();
  if (category === 'java') return 'code';
  if (category === 'sql') return 'database';
  if (category === 'python') return 'python';
  if (category === 'devops') return 'terminal';
  if (category === 'dsa') return 'github';
  return 'file';
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
    coverImageName: item.coverImageName || item.imageName || '',
    coverImageType: item.coverImageType || item.imageType || '',
    coverImageData: item.coverImageData || item.imageData || item.imageUrl || '',
  };
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[10px] border border-white/8 bg-[#0b1226]/80 p-5 h-64 flex flex-col gap-4">
      <div className="h-5 w-2/3 rounded bg-white/10" />
      <div className="h-3 w-full rounded bg-white/8" />
      <div className="h-3 w-5/6 rounded bg-white/8" />
      <div className="mt-auto flex gap-2">
        <div className="h-6 w-16 rounded-full bg-white/10" />
        <div className="h-6 w-16 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-[7px] border border-white/10 bg-[#07101f] px-3 text-xs font-bold text-slate-200 outline-none focus:border-cyan-300"
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

// ─── LibraryFeature ───────────────────────────────────────────────────────────
const TONE_CLASSES = {
  cyan: 'bg-cyan-500/15 text-cyan-200',
  blue: 'bg-blue-500/15 text-blue-200',
  violet: 'bg-violet-500/18 text-violet-200',
};

function LibraryFeature({ icon, title, text, tone }) {
  return (
    <div className="flex items-center gap-4 border-b border-white/10 p-5 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${TONE_CLASSES[tone]}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-sm font-black text-white">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, setPage }) {
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );
  return (
    <div className="mt-8 flex justify-center">
      <div className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-[#0b1226]/86 p-1.5">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="grid h-10 w-10 place-items-center rounded-[7px] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="chevronLeft" />
        </button>
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPage(item)}
            className={`h-10 min-w-10 rounded-[7px] px-3 text-sm font-bold transition ${page === item ? 'bg-gradient-to-r from-sky-400 to-violet-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="grid h-10 w-10 place-items-center rounded-[7px] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>
  );
}

// ─── NoteCardWithSave (memoized + optimistic bookmark) ────────────────────────
// Wrapped in React.memo so it only re-renders when its own note or saved state
// changes — not when a sibling card is bookmarked.
const NoteCardWithSave = memo(function NoteCardWithSave({ note, saved, onToggleSave }) {
  return (
    <div className="group relative h-full w-full">
      <button
        type="button"
        aria-label={saved ? 'Remove bookmark' : 'Save note'}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave(note._id);
        }}
        className={`absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border transition active:scale-90 ${saved ? 'border-violet-300 bg-violet-500/25 text-violet-100' : 'border-white/10 bg-black/40 text-white hover:bg-white/10'}`}
      >
        <Icon name="bookmark" className={`h-4.5 w-4.5 ${saved ? 'fill-current' : ''}`} />
      </button>
      <NoteCard item={note} />
    </div>
  );
});

// ─── Custom debounce hook ─────────────────────────────────────────────────────
function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Notes() {
  const auth = useAuth();
  const { items, loading } = useApiCollection('notes');
  const { savedIds: serverSavedIds, toggleSaved } = useSavedContent(auth?.token);

  // ── Optimistic save state ──────────────────────────────────────────────────
  // The bookmark icon flips instantly on click (no waiting for the network).
  // An override is only cleared once serverSavedIds itself agrees with it —
  // never immediately after the request resolves — so there is no flicker
  // back to the old icon state while the server/hook state is still catching
  // up to the just-completed toggle.
  const [optimisticOverrides, setOptimisticOverrides] = useState(new Map());
  // pendingRef prevents double-clicking from firing two simultaneous requests.
  const pendingRef = useRef(new Set());

  const savedIds = useMemo(() => {
    if (optimisticOverrides.size === 0) return serverSavedIds;
    const merged = new Set(serverSavedIds);
    optimisticOverrides.forEach((add, id) => (add ? merged.add(id) : merged.delete(id)));
    return merged;
  }, [serverSavedIds, optimisticOverrides]);

  // Drop an override the moment serverSavedIds' truth matches it — this is
  // what actually prevents the flicker, instead of clearing on a timer or
  // immediately after the await resolves.
  useEffect(() => {
    if (optimisticOverrides.size === 0) return;
    setOptimisticOverrides((prev) => {
      let changed = false;
      const next = new Map(prev);
      prev.forEach((shouldBeSaved, id) => {
        const serverHasIt = serverSavedIds.has(id);
        if (serverHasIt === shouldBeSaved) {
          next.delete(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [serverSavedIds, optimisticOverrides]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [rawQuery, setRawQuery] = useState('');
  const query = useDebounced(rawQuery, SEARCH_DEBOUNCE_MS);
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('All Types');
  const [language, setLanguage] = useState('All Languages');
  const [sort, setSort] = useState('Most Popular');
  const [page, setPage] = useState(1);

  // ── Data normalization (stable across re-renders) ──────────────────────────
  const notes = useMemo(() => items.map(normalizeNote), [items]);

  const categories = useMemo(() => {
    const values = Array.from(new Set(notes.map((n) => n.category).filter(Boolean))).sort();
    return [
      { id: 'all', label: 'All' },
      ...values.map((v) => ({ id: v, label: v.replace(/^\w/, (c) => c.toUpperCase()) })),
    ];
  }, [notes]);

  // ── Filtering + sorting ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const result = notes.filter((note) => {
      if (category !== 'all' && note.category !== category) return false;
      if (type !== 'All Types' && note.type !== type) return false;
      if (language !== 'All Languages' && note.language !== language) return false;
      if (search) {
        const haystack = `${note.title} ${note.description} ${note.category} ${note.type} ${note.language} ${note.topics.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sort === 'Shortest') return a.pages - b.pages;
      if (sort === 'Longest') return b.pages - a.pages;
      if (sort === 'Newest') return String(b.updated).localeCompare(String(a.updated));
      return parseDownloads(b.downloads) - parseDownloads(a.downloads);
    });
  }, [category, language, notes, query, sort, type]);

  // Reset to page 1 whenever filters change.
  useEffect(() => { setPage(1); }, [category, language, query, sort, type]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / NOTES_PER_PAGE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * NOTES_PER_PAGE, page * NOTES_PER_PAGE),
    [filtered, page],
  );

  // ── Reset all filters ──────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setRawQuery('');
    setCategory('all');
    setType('All Types');
    setLanguage('All Languages');
    setSort('Most Popular');
  }, []);

  // ── Category icon helper ───────────────────────────────────────────────────
  const categoryIcon = useCallback((id) => {
    if (id === 'all') return 'grid';
    if (id === 'sql') return 'database';
    if (id === 'devops') return 'terminal';
    return 'file';
  }, []);

  // ── Optimistic toggle save (fire-and-forget, fast path) ────────────────────
  const handleToggleSave = useCallback((id) => {
    if (!auth?.token) { navigate('/login'); return; }
    if (pendingRef.current.has(id)) return; // ignore rapid double-click

    pendingRef.current.add(id);
    const willBeSaved = !savedIds.has(id);

    // Instant UI flip — synchronous, same frame as the click, no network wait.
    setOptimisticOverrides((prev) => new Map(prev).set(id, willBeSaved));

    // Fire the request without blocking the click handler on await. The
    // override is cleared by the effect above once serverSavedIds confirms
    // it, not here — so there's no premature flicker back.
    toggleSaved(id)
      .catch(() => {
        // Revert immediately on failure so the icon reflects reality.
        setOptimisticOverrides((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        navigate('/login');
      })
      .finally(() => {
        pendingRef.current.delete(id);
      });
  }, [auth?.token, savedIds, toggleSaved]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative overflow-hidden bg-[#050817] pt-[70px] text-white">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_16%_14%,rgba(20,184,166,0.14),transparent_22%),radial-gradient(circle_at_82%_22%,rgba(124,58,237,0.20),transparent_20%),linear-gradient(180deg,#050817_0%,#071223_52%,#050817_100%)]" />

      {/* Hero */}
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

      {/* Feature strip */}
      <section className="relative mx-auto w-full max-w-6xl px-5 py-3 sm:px-6 lg:px-8">
        <div className="grid rounded-[8px] border border-white/10 bg-[#0b1226]/82 shadow-2xl shadow-black/30 sm:grid-cols-3">
          <LibraryFeature icon="shield" title="High Quality" text="Well-structured and easy to understand" tone="cyan" />
          <LibraryFeature icon="file" title="Free Access" text="All notes and PDFs are free to download" tone="blue" />
          <LibraryFeature icon="rocket" title="Always Updated" text="New resources added regularly" tone="violet" />
        </div>
      </section>

      {/* Filters */}
      <section className="relative mx-auto w-full max-w-6xl px-5 py-3 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-[8px] border border-white/10 bg-[#0b1226]/80 p-3 shadow-xl shadow-black/25 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
          <label className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" className="h-4 w-4" />
            </span>
            <input
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="Search notes..."
              className="h-10 w-full rounded-[7px] border border-white/10 bg-black/30 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>
          <Select value={type} onChange={setType} options={typeOptions} />
          <Select value={language} onChange={setLanguage} options={languageOptions} />
          <Select value={sort} onChange={setSort} options={sortOptions} />
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[7px] border border-white/10 px-4 text-xs font-bold text-slate-200 transition hover:bg-white/10"
          >
            <Icon name="filter" className="h-4 w-4" /> Reset
          </button>
        </div>
      </section>

      {/* Category pills */}
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
              <Icon name={categoryIcon(item.id)} className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Cards */}
      <section className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-2 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Popular Resources</h2>
            <p className="mt-1 text-xs text-slate-400">Hand-picked resources to boost your development skills</p>
          </div>
          <span className="text-xs text-slate-400">{filtered.length} resources</span>
        </div>

        {/* Skeleton shown while first fetch is in progress */}
        {loading && items.length === 0 ? (
          <div className="-mx-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="flex items-stretch gap-5 lg:grid lg:grid-cols-3">
              {Array.from({ length: NOTES_PER_PAGE }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} className="w-[85vw] max-w-sm flex-none sm:w-[380px] lg:w-auto lg:max-w-none">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="-mx-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:overflow-visible lg:px-0">
              <div className="flex items-stretch gap-5 lg:grid lg:grid-cols-3">
                {paginated.map((note) => (
                  <div key={note._id} className="w-[85vw] max-w-sm flex-none sm:w-[380px] lg:w-auto lg:max-w-none">
                    <NoteCardWithSave
                      note={note}
                      saved={savedIds.has(note._id)}
                      onToggleSave={handleToggleSave}
                    />
                  </div>
                ))}
              </div>
            </div>
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
          </>
        ) : (
          <div className="rounded-[8px] border border-white/10 bg-[#0b1226]/82 p-10 text-center">
            <h2 className="text-2xl font-bold">No notes found</h2>
            <p className="mt-2 text-slate-400">Try another search, category or filter.</p>
          </div>
        )}
      </section>
    </div>
  );
}