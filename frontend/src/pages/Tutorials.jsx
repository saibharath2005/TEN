import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { navigate } from '../hooks/useRoute.js';
import { useApiCollection } from '../hooks/useApiCollection.js';
import { useSavedContent } from '../hooks/useSavedContent.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const categoryOptions = [
  { id: 'all',         label: 'All' },
  { id: 'cs',          label: 'Core CSE' },
  { id: 'java',        label: 'Java' },
  { id: 'sql',         label: 'Databases' },
  { id: 'dsa',         label: 'DSA' },
  { id: 'development', label: 'Web Development' },
  { id: 'devops',      label: 'Cloud & DevOps' },
  { id: 'ai',          label: 'Artificial Intelligence' },
  { id: 'ml',          label: 'Machine Learning' },
  { id: 'cb',          label: 'Cybersecurity' },
];

const levelOptions = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

const sortOptions = [
  { value: 'popular',       label: 'Most Popular' },
  { value: 'newest',        label: 'Newest' },
  { value: 'duration-asc',  label: 'Shortest' },
  { value: 'duration-desc', label: 'Longest' },
];

const categoryLabels = Object.fromEntries(categoryOptions.map((c) => [c.id, c.label]));

const TUTORIALS_PER_PAGE = 4;
const SEARCH_DEBOUNCE_MS = 150;

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICON_PATHS = {
  search:       <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></>,
  filter:       <><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></>,
  play:         null, // handled separately (filled)
  bookmark:     <><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.4L6 20V5a1 1 0 0 1 1-1Z" /></>,
  users:        <><path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" /><circle cx="12" cy="9" r="3" /><path d="M4 18c0-1.7 1.1-3.1 2.7-3.7" /><path d="M20 18c0-1.7-1.1-3.1-2.7-3.7" /><path d="M7 10a2.5 2.5 0 0 1-1-4.8" /><path d="M17 10a2.5 2.5 0 0 0 1-4.8" /></>,
  book:         <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" /><path d="M8 4v13a3 3 0 0 0 3 3" /><path d="M9 8h6" /></>,
  clock:        <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  chart:        <><path d="M5 19V9" /><path d="M12 19V5" /><path d="M19 19v-7" /></>,
  calendar:     <><path d="M7 3v4" /><path d="M17 3v4" /><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16" /></>,
  chevronLeft:  <><path d="m15 18-6-6 6-6" /></>,
  chevronRight: <><path d="m9 18 6-6-6-6" /></>,
  close:        <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  trophy:       <><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4a3 3 0 0 0 3 3" /><path d="M17 6h3a3 3 0 0 1-3 3" /></>,
  cap:          <><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 11v5c3 2 7 2 10 0v-5" /></>,
  arrowUp:      <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>,
};

const SVG_STROKE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.8',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

function Icon({ name, className = 'h-5 w-5' }) {
  // play icon uses fill, not stroke
  if (name === 'play') {
    return (
      <svg {...SVG_STROKE} fill="currentColor" stroke="none" className={className}>
        <path d="M8 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4a1.1 1.1 0 0 0 0-1.8l-10-6.4A1 1 0 0 0 8 5.6Z" />
      </svg>
    );
  }
  return (
    <svg {...SVG_STROKE} className={className}>
      {ICON_PATHS[name] ?? ICON_PATHS.book}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDuration(value = '') {
  const hours   = value.match(/(\d+)\s*h/i)?.[1];
  const minutes = value.match(/(\d+)\s*m/i)?.[1] || (/^\d+$/.test(value) ? value : null);
  return Number(hours || 0) * 60 + Number(minutes || 0);
}

function iconForCategory(category) {
  if (category === 'java')   return 'java';
  if (category === 'sql')    return 'sql';
  if (category === 'dsa')    return 'dsa';
  if (category === 'devops') return 'devops';
  return 'react';
}

function normalizeTutorial(item) {
  const category = String(item.category || 'development').toLowerCase();
  return {
    ...item,
    _id:        item._id || item.id || item.slug || item.title,
    category,
    status:     item.status ? `${item.status}`.replace(/^./, (l) => l.toUpperCase()) : 'Published',
    minutes:    item.minutes || parseDuration(item.duration),
    icon:       item.icon || iconForCategory(category),
    instructor: item.instructor || item.author || 'The Epoch Nova',
    lessons:    item.lessons || 0,
    imageName:  item.imageName || '',
    imageType:  item.imageType || '',
    imageData:  item.imageData || item.imageUrl || '',
    videoUrl:   item.videoUrl || '',
  };
}

// ─── Custom debounce hook ─────────────────────────────────────────────────────
function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[8px] border border-white/8 bg-[#0c1326]/88 shadow-2xl shadow-black/30">
      {/* thumbnail area */}
      <div className="h-40 bg-white/8" />
      <div className="flex min-h-[235px] flex-col gap-4 p-5">
        <div className="h-5 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/8" />
        <div className="h-3 w-5/6 rounded bg-white/8" />
        <div className="mt-auto flex gap-3">
          <div className="h-11 flex-1 rounded-[7px] bg-white/10" />
          <div className="h-11 w-[52px] rounded-[7px] bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// ─── TutorialVisual (unchanged, no props that change) ─────────────────────────
function TutorialVisual({ icon }) {
  if (icon === 'java') {
    return (
      <div className="tutorial-emblem text-[#ff8a2a]">
        <span className="text-7xl leading-none">Java</span>
      </div>
    );
  }
  if (icon === 'react') {
    return (
      <div className="relative grid h-28 w-28 place-items-center text-cyan-300">
        <span className="absolute h-12 w-28 rounded-[50%] border-4 border-current" />
        <span className="absolute h-12 w-28 rotate-60 rounded-[50%] border-4 border-current" />
        <span className="absolute h-12 w-28 -rotate-60 rounded-[50%] border-4 border-current" />
        <span className="h-4 w-4 rounded-full bg-current shadow-[0_0_28px_currentColor]" />
      </div>
    );
  }
  if (icon === 'sql') {
    return (
      <div className="grid place-items-center text-sky-300">
        <div className="h-20 w-28 rounded-[50%] border border-white/40 bg-gradient-to-b from-sky-300 to-blue-700 shadow-[0_18px_35px_rgba(37,99,235,0.45)]" />
        <div className="-mt-9 h-16 w-28 rounded-b-2xl border-x border-b border-white/20 bg-gradient-to-b from-blue-500 to-blue-900" />
        <strong className="-mt-12 text-3xl text-white/85">SQL</strong>
      </div>
    );
  }
  if (icon === 'dsa') {
    return (
      <div className="relative h-28 w-36 text-violet-200">
        {[[18, 28], [76, 18], [122, 45], [76, 72], [18, 86]].map(([left, top]) => (
          <span key={`${left}-${top}`} className="absolute h-6 w-6 rounded-full border border-white/80 bg-violet-500/50 shadow-[0_0_28px_rgba(139,92,246,0.7)]" style={{ left, top }} />
        ))}
        <span className="absolute left-7 top-10 h-px w-20 rotate-[-9deg] bg-white/70" />
        <span className="absolute left-8 top-20 h-px w-14 rotate-[-26deg] bg-white/70" />
        <span className="absolute left-20 top-9 h-px w-10 rotate-[24deg] bg-white/70" />
        <span className="absolute left-20 top-11 h-px w-10 rotate-[75deg] bg-white/70" />
        <span className="absolute left-8 top-16 h-px w-52 max-w-[86px] rotate-[27deg] bg-white/70" />
      </div>
    );
  }
  return (
    <div className="grid h-24 w-24 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 shadow-[0_0_42px_rgba(34,211,238,0.25)]">
      <Icon name="book" className="h-12 w-12" />
    </div>
  );
}

// ─── TutorialCard (memoized) ──────────────────────────────────────────────────
// memo() means only the card whose `saved` prop changed re-renders when a
// bookmark is toggled — all sibling cards remain frozen.
// Only ONE bookmark button now lives in the footer next to "Watch Now" —
// the old duplicate top-right bookmark overlay on the thumbnail was removed.
const TutorialCard = memo(function TutorialCard({ tutorial, saved, onToggleSave, onWatch }) {
  const levelColor =
    tutorial.level === 'Advanced'    ? 'text-orange-400' :
    tutorial.level === 'Intermediate' ? 'text-sky-400'    : 'text-emerald-400';
  const imageSrc = tutorial.imageData || tutorial.imageUrl || '';

  return (
    <article className="group overflow-hidden rounded-[8px] border border-white/10 bg-[#0c1326]/88 shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-violet-400/50 hover:shadow-violet-950/40">
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden bg-[#0a1024]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={tutorial.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,58,237,0.18),transparent_32%),radial-gradient(circle_at_74%_72%,rgba(14,165,233,0.16),transparent_40%),linear-gradient(135deg,rgba(59,7,100,0.45),rgba(2,6,23,0.9))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(2,6,23,0.10)_35%,rgba(2,6,23,0.72)_100%)]" />

        <span className="absolute left-4 top-4 rounded-[6px] bg-gradient-to-r from-sky-400 to-violet-600 px-3 py-2 text-xs font-bold uppercase text-white shadow-lg shadow-violet-950/40">
          {categoryLabels[tutorial.category] || tutorial.category}
        </span>

        {!imageSrc && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="rounded-[10px] border border-white/10 bg-black/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              No image uploaded
            </div>
          </div>
        )}

        <span className="absolute bottom-4 right-4 rounded-[6px] bg-black/75 px-3 py-1.5 text-xs font-bold text-white">
          {tutorial.duration}
        </span>
      </div>

      {/* Body */}
      <div className="flex min-h-[235px] flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-white">{tutorial.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{tutorial.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className={`inline-flex items-center gap-1.5 ${levelColor}`}>
            <Icon name="chart" className="h-4 w-4" />
            {tutorial.level}
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span className="inline-flex items-center gap-1.5">
            <Icon name="calendar" className="h-4 w-4" />
            {tutorial.status}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_52px] gap-3">
          <button
            type="button"
            onClick={() => onWatch(tutorial)}
            disabled={!tutorial.videoUrl}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-gradient-to-r from-sky-400 to-violet-600 px-4 text-sm font-bold text-white shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="play" className="h-4 w-4" />
            {tutorial.videoUrl ? 'Watch Now' : 'No Video'}
          </button>
          {/* Single bookmark button */}
          <button
            type="button"
            aria-label={saved ? 'Remove bookmark' : 'Save tutorial'}
            onClick={() => onToggleSave(tutorial._id)}
            className={`grid h-11 place-items-center rounded-[7px] border transition active:scale-90 ${saved ? 'border-violet-300 bg-violet-500/20 text-violet-100' : 'border-slate-500/50 bg-slate-950/35 text-slate-200 hover:bg-white/10'}`}
          >
            <Icon name="bookmark" className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
});

// ─── Pagination (memoized pages array) ───────────────────────────────────────
function Pagination({ page, totalPages, setPage }) {
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages],
  );
  return (
    <div className="mt-5 flex justify-center">
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

// ─── WatchModal ───────────────────────────────────────────────────────────────
function WatchModal({ tutorial, saved, onClose, onToggleSave }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${tutorial.title} preview`}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-[8px] border border-white/10 bg-[#0b1226] shadow-2xl shadow-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              {categoryLabels[tutorial.category] || tutorial.category}
            </p>
            <h2 className="mt-1 text-xl font-black text-white">{tutorial.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="grid h-10 w-10 place-items-center rounded-[8px] border border-white/10 text-slate-200 transition hover:bg-white/10"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Preview */}
        <div className="grid aspect-video place-items-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.22),rgba(2,6,23,0.96)_62%)]">
          {tutorial.imageData || tutorial.imageUrl ? (
            <img
              src={tutorial.imageData || tutorial.imageUrl}
              alt={tutorial.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <button
              type="button"
              className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-r from-sky-400 to-violet-600 text-white shadow-[0_0_70px_rgba(124,58,237,0.55)]"
            >
              <Icon name="play" className="h-9 w-9 translate-x-0.5" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm leading-6 text-slate-300">{tutorial.description}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
              <span>{tutorial.level}</span>
              <span>{tutorial.duration}</span>
              <span>{tutorial.lessons} lessons</span>
              <span>{tutorial.instructor}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <button
              type="button"
              onClick={() => {
                const url = String(tutorial.videoUrl || '').trim();
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
              }}
              disabled={!tutorial.videoUrl}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-sky-400 to-violet-600 px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon name="play" className="h-5 w-5" />
              {tutorial.videoUrl ? 'Open Video' : 'No Video'}
            </button>
            <button
              type="button"
              onClick={() => onToggleSave(tutorial._id)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border px-5 text-sm font-bold transition active:scale-95 ${saved ? 'border-violet-300 bg-violet-500/20 text-violet-100' : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/10'}`}
            >
              <Icon name="bookmark" className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Static decoration components ────────────────────────────────────────────
function HeroArt() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 hidden h-44 md:block">
      <div className="absolute left-5 top-10 h-28 w-36 -rotate-12 rounded-[8px] border border-violet-400/35 bg-violet-500/10 shadow-[0_28px_70px_rgba(79,70,229,0.45)]">
        <div className="flex gap-2 border-b border-white/10 p-3">
          <span className="h-2 w-2 rounded-full bg-violet-300" />
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          <span className="h-2 w-2 rounded-full bg-blue-400" />
        </div>
        <div className="grid h-20 place-items-center text-4xl font-black text-violet-400">&lt;/&gt;</div>
      </div>
      <div className="absolute right-4 top-3 h-32 w-44 rotate-12 rounded-[8px] border border-violet-400/35 bg-violet-600/20 p-6 shadow-[0_28px_80px_rgba(37,99,235,0.45)]">
        <div className="grid h-full place-items-center rounded-[8px] text-violet-100">
          <Icon name="play" className="h-12 w-12" />
        </div>
        <div className="absolute bottom-5 left-7 h-1.5 w-24 rounded-full bg-white/60">
          <span className="block h-3 w-3 -translate-y-1 rounded-full bg-white" />
        </div>
      </div>
      <span className="absolute left-[21%] top-1 h-5 w-5 rounded-full border border-blue-500/40 bg-blue-500/10" />
      <span className="absolute right-[28%] top-10 h-7 w-7 rounded-full border border-violet-500/40 bg-violet-500/10" />
      <span className="absolute right-[36%] top-0 text-4xl text-violet-400">*</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Tutorials() {
  const auth = useAuth();
  const { items, loading } = useApiCollection('tutorials');
  const { savedIds: serverSavedIds, toggleSaved } = useSavedContent(auth?.token);

  // ── Optimistic save state ──────────────────────────────────────────────────
  // Flips the bookmark icon instantly in the same frame (no waiting on the
  // network) and reverts only if the request actually fails. The override
  // for an id is cleared as soon as the server's own savedIds agrees with
  // it — not immediately after the request resolves — so there's no flicker
  // back to the old state while serverSavedIds is still catching up.
  const [optimisticOverrides, setOptimisticOverrides] = useState(new Map());
  const pendingRef = useRef(new Set()); // blocks double-tap per id

  const savedIds = useMemo(() => {
    if (optimisticOverrides.size === 0) return serverSavedIds;
    const merged = new Set(serverSavedIds);
    optimisticOverrides.forEach((add, id) => (add ? merged.add(id) : merged.delete(id)));
    return merged;
  }, [serverSavedIds, optimisticOverrides]);

  // Once serverSavedIds catches up with an optimistic override, drop the
  // override — this is what actually prevents any visible flicker, since we
  // only ever remove an override once the truth already matches it.
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
  const [rawQuery, setRawQuery]         = useState('');
  const query = useDebounced(rawQuery, SEARCH_DEBOUNCE_MS);
  const [category, setCategory]         = useState('all');
  const [level, setLevel]               = useState('All Levels');
  const [sort, setSort]                 = useState('popular');
  const [shortOnly, setShortOnly]       = useState(false);
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [page, setPage]                 = useState(1);
  const [activeTutorial, setActiveTutorial] = useState(null);

  // ── Normalize once per items reference ─────────────────────────────────────
  const tutorials = useMemo(() => items.map(normalizeTutorial), [items]);

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const result = tutorials.filter((t) => {
      if (category !== 'all' && t.category !== category) return false;
      if (level !== 'All Levels' && t.level !== level)   return false;
      if (shortOnly && t.minutes > 45)                    return false;
      if (search) {
        const haystack = `${t.title} ${t.description} ${t.category} ${t.level} ${t.instructor}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sort === 'duration-asc')  return a.minutes - b.minutes;
      if (sort === 'duration-desc') return b.minutes - a.minutes;
      if (sort === 'newest')        return b._id.localeCompare(a._id);
      return b.lessons - a.lessons;
    });
  }, [category, level, query, shortOnly, sort, tutorials]);

  // Reset to page 1 on any filter change
  useEffect(() => { setPage(1); }, [category, level, query, shortOnly, sort]);

  const totalPages       = Math.max(1, Math.ceil(filtered.length / TUTORIALS_PER_PAGE));
  const visibleTutorials = useMemo(
    () => filtered.slice((page - 1) * TUTORIALS_PER_PAGE, page * TUTORIALS_PER_PAGE),
    [filtered, page],
  );

  // ── Optimistic toggle save (fire-and-forget UI, fast path) ─────────────────
  const handleToggleSave = useCallback((id) => {
    if (!auth?.token) { navigate('/login'); return; }
    if (pendingRef.current.has(id)) return; // ignore rapid double-tap

    pendingRef.current.add(id);
    const willBeSaved = !savedIds.has(id);

    // Instant UI flip — happens synchronously, same frame as the click.
    setOptimisticOverrides((prev) => new Map(prev).set(id, willBeSaved));

    // Fire the request without blocking the UI thread on await; release the
    // double-tap guard and handle failure as soon as it settles.
    toggleSaved(id)
      .catch(() => {
        // Revert on failure — drop the optimistic flip so real state shows.
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

  const handleWatch = useCallback((tutorial) => {
    const url = String(tutorial?.videoUrl || '').trim();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    setActiveTutorial(tutorial);
  }, []);

  const handleCloseModal = useCallback(() => setActiveTutorial(null), []);

  const clearFilters = useCallback(() => {
    setRawQuery('');
    setCategory('all');
    setLevel('All Levels');
    setSort('popular');
    setShortOnly(false);
  }, []);

  const hasActiveFilters = level !== 'All Levels' || shortOnly || sort !== 'popular';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative overflow-hidden bg-[#050817] pt-[70px] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(73,70,229,0.22),transparent_25%),radial-gradient(circle_at_86%_18%,rgba(37,99,235,0.22),transparent_23%),linear-gradient(180deg,#050817_0%,#080b1d_52%,#050817_100%)]" />
      <div className="pointer-events-none absolute left-0 right-0 top-52 h-px bg-cyan-300/20 shadow-[0_0_65px_18px_rgba(37,99,235,0.45)]" />

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-7xl px-5 pb-3 pt-10 sm:px-6 lg:px-8">
        <HeroArt />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-black leading-tight sm:text-6xl">
            Master{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent">
              Tech Skills
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Master in-demand technology skills through expert-led tutorials, practical guides, and structured learning paths.
          </p>
        </div>
      </section>

      {/* Search + filters */}
      <section className="relative mx-auto w-full max-w-7xl px-5 py-5 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-white/10 bg-[#080d20]/88 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_auto_auto] lg:items-center">
            {/* Search */}
            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                <Icon name="search" />
              </span>
              <input
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder="Search tutorials..."
                className="h-12 w-full rounded-[8px] border border-white/10 bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
              />
            </label>

            {/* Category pills */}
            <div className="flex flex-wrap gap-3">
              {categoryOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCategory(option.id)}
                  className={`h-11 rounded-[8px] border px-5 text-sm font-bold transition ${category === option.id ? 'border-transparent bg-gradient-to-r from-sky-400 to-violet-600 text-white shadow-lg shadow-violet-950/40' : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Filters toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`relative inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border px-5 text-sm font-bold transition ${filtersOpen ? 'border-violet-300 bg-violet-500/20 text-white' : 'border-violet-300/50 bg-white/[0.03] text-white hover:bg-white/[0.08]'}`}
            >
              <Icon name="filter" className="h-4 w-4" /> Filters
              {hasActiveFilters && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-violet-400" />
              )}
            </button>
          </div>

          {/* Advanced filters panel */}
          {filtersOpen && (
            <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
              <label className="grid gap-2 text-sm text-slate-300">
                Level
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="h-11 rounded-[8px] border border-white/10 bg-[#10172d] px-3 text-white outline-none"
                >
                  {levelOptions.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Sort
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-11 rounded-[8px] border border-white/10 bg-[#10172d] px-3 text-white outline-none"
                >
                  {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="flex h-11 items-center gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={shortOnly}
                  onChange={(e) => setShortOnly(e.target.checked)}
                  className="h-4 w-4 accent-violet-500"
                />
                Under 45 min
              </label>
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-[8px] border border-white/10 px-4 text-sm font-bold text-slate-200 transition hover:bg-white/10"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Cards */}
      <section className="relative mx-auto w-full max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        {/* Skeleton shown only while the very first fetch is in progress */}
        {loading && items.length === 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: TUTORIALS_PER_PAGE }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : visibleTutorials.length > 0 ? (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {visibleTutorials.map((tutorial) => (
                <TutorialCard
                  key={tutorial._id}
                  tutorial={tutorial}
                  saved={savedIds.has(tutorial._id)}
                  onToggleSave={handleToggleSave}
                  onWatch={handleWatch}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </>
        ) : (
          <div className="rounded-[8px] border border-white/10 bg-[#0b1226]/82 p-10 text-center">
            <h2 className="text-2xl font-bold">No tutorials found</h2>
            <p className="mt-2 text-slate-400">Try a different search, category or filter combination.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-[8px] bg-gradient-to-r from-sky-400 to-violet-600 px-5 py-3 text-sm font-bold text-white"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Video / preview modal */}
      {activeTutorial && (
        <WatchModal
          tutorial={activeTutorial}
          saved={savedIds.has(activeTutorial._id)}
          onClose={handleCloseModal}
          onToggleSave={handleToggleSave}
        />
      )}
    </div>
  );
}