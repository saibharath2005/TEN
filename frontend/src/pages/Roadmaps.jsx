import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { navigate } from '../hooks/useRoute.js';
import { useApiCollection } from '../hooks/useApiCollection.js';
import { useSavedContent } from '../hooks/useSavedContent.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const difficultyOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const ROADMAPS_PER_PAGE = 3;
const SEARCH_DEBOUNCE_MS = 200;

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICON_PATHS = {
  book:         <><path d="M5 5h6a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3V5Z" /><path d="M14 8a3 3 0 0 1 3-3h2v15h-5" /></>,
  target:       <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m15 9 4-4" /><path d="M19 5v4h-4" /></>,
  chart:        <><path d="M5 19V9" /><path d="M12 19V5" /><path d="M19 19v-7" /></>,
  check:        <><circle cx="12" cy="12" r="8" /><path d="m8.5 12.5 2.2 2.2 4.8-5.4" /></>,
  search:       <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></>,
  bookmark:     <><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.4L6 20V5a1 1 0 0 1 1-1Z" /></>,
  clock:        <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  modules:      <><path d="M5 5h6v6H5z" /><path d="M13 5h6v6h-6z" /><path d="M5 13h6v6H5z" /><path d="M13 13h6v6h-6z" /></>,
  arrow:        <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  close:        <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  code:         <><path d="m9 8-4 4 4 4" /><path d="m15 8 4 4-4 4" /><path d="m13 5-2 14" /></>,
  route:        <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h4a4 4 0 0 1 0 8h-1a4 4 0 0 0 0 8h5" /></>,
  chevronLeft:  <><path d="m14 6-6 6 6 6" /></>,
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
      {ICON_PATHS[name] ?? ICON_PATHS.book}
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeRoadmap(roadmap, index) {
  const steps = Array.isArray(roadmap.steps)
    ? roadmap.steps
    : String(roadmap.steps || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const outcomes = Array.isArray(roadmap.outcomes) ? roadmap.outcomes : [];
  const title = roadmap.title || 'Untitled Roadmap';
  const id = roadmap._id || roadmap.slug || title.toLowerCase().replace(/\W+/g, '-');

  return {
    ...roadmap,
    id,
    title,
    desc: roadmap.description || roadmap.desc || '',
    level: roadmap.level || 'Beginner to Advanced',
    duration: roadmap.duration || `${roadmap.modules || 0} Modules`,
    modules: roadmap.modules || 0,
    steps,
    outcomes,
    difficulty: roadmap.difficulty || roadmap.level || 'Beginner',
    tone: roadmap.tone || ['violet', 'cyan', 'blue', 'emerald'][index % 4],
    tag: roadmap.tag || roadmap.level || 'Beginner to Advanced',
    icon: roadmap.icon || (index % 2 === 0 ? 'code' : 'route'),
  };
}

function getRoadmapKey(roadmap) {
  return roadmap?._id || roadmap?.id || roadmap?.slug || roadmap?.title;
}

// ─── Tone palette (shared by card + modal) ────────────────────────────────────
const TONES = {
  violet: {
    card:  'border-violet-500/35 hover:border-violet-400/70',
    icon:  'bg-violet-600 text-white',
    glow:  'bg-violet-500',
    dot:   'bg-violet-500',
    label: 'text-violet-300',
    badge: 'bg-emerald-400/15 text-emerald-300',
  },
  cyan: {
    card:  'border-cyan-500/35 hover:border-cyan-300/70',
    icon:  'bg-cyan-500/35 text-cyan-100',
    glow:  'bg-cyan-400',
    dot:   'bg-cyan-500',
    label: 'text-cyan-300',
    badge: 'bg-cyan-400/15 text-cyan-300',
  },
  blue: {
    card:  'border-blue-500/35 hover:border-blue-300/70',
    icon:  'bg-blue-500/35 text-blue-100',
    glow:  'bg-blue-400',
    dot:   'bg-blue-500',
    label: 'text-blue-300',
    badge: 'bg-blue-400/15 text-blue-300',
  },
  emerald: {
    card:  'border-emerald-500/35 hover:border-emerald-300/70',
    icon:  'bg-emerald-500/25 text-emerald-100',
    glow:  'bg-emerald-400',
    dot:   'bg-emerald-500',
    label: 'text-emerald-300',
    badge: 'bg-emerald-400/15 text-emerald-300',
  },
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[10px] border border-white/8 bg-[#0b1226]/80 p-5 flex flex-col gap-4 h-80">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-[8px] bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/8" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-white/8" />
      <div className="h-3 w-5/6 rounded bg-white/8" />
      <div className="space-y-2 mt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 rounded bg-white/6" style={{ width: `${90 - i * 10}%` }} />
        ))}
      </div>
      <div className="mt-auto h-9 w-full rounded-[7px] bg-white/10" />
    </div>
  );
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

// ─── Sub-components ───────────────────────────────────────────────────────────
function HeaderArt() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 hidden h-24 md:block">
      <div className="absolute left-6 top-5 h-14 w-16 -rotate-12 rounded-[8px] border border-cyan-300/25 bg-cyan-300/8 text-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
        <div className="grid h-full place-items-center"><Icon name="code" className="h-8 w-8" /></div>
      </div>
      <div className="absolute right-6 top-5 h-14 w-16 rotate-12 rounded-[8px] border border-cyan-300/25 bg-cyan-300/8 text-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
        <div className="grid h-full place-items-center"><Icon name="route" className="h-8 w-8" /></div>
      </div>
      <div className="absolute left-20 right-20 top-10 border-t border-dashed border-blue-400/25" />
      <span className="absolute left-[8%] top-0 h-4 w-4 rounded-full bg-violet-500/70 shadow-[0_0_22px_rgba(139,92,246,0.7)]" />
      <span className="absolute right-[8%] top-0 h-4 w-4 rounded-full bg-blue-500/70 shadow-[0_0_22px_rgba(59,130,246,0.7)]" />
    </div>
  );
}

function Feature({ icon, title, text, tone }) {
  const colors = {
    violet: 'bg-violet-600/20 text-violet-200',
    cyan:   'bg-cyan-500/18 text-cyan-200',
    blue:   'bg-blue-500/20 text-blue-200',
  };
  return (
    <div className="flex items-center gap-4 border-b border-white/10 p-5 sm:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${colors[tone]}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-sm font-black text-white">{title}</h3>
        <p className="mt-1 text-xs text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone }) {
  const colors = {
    violet:  'text-violet-300',
    cyan:    'text-cyan-300',
    blue:    'text-blue-300',
    emerald: 'text-emerald-300',
  };
  return (
    <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
      <div className={`mb-2 flex items-center gap-2 text-xs font-bold ${colors[tone] || colors.violet}`}>
        <Icon name={icon} className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="truncate text-sm font-bold text-white" title={String(value)}>{value}</div>
    </div>
  );
}

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

// ─── RoadmapCard (memoized) ───────────────────────────────────────────────────
// memo() ensures only the card whose `saved` prop changed re-renders when a
// bookmark is toggled — siblings stay untouched.
const RoadmapCard = memo(function RoadmapCard({ roadmap, saved, onToggleSave, onOpen }) {
  const roadmapKey = getRoadmapKey(roadmap);
  const tone = TONES[roadmap.tone] || TONES.violet;

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-[10px] border bg-[#0b1226]/84 shadow-[0_14px_38px_-18px_rgba(0,0,0,0.65)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_-16px_rgba(0,0,0,0.75)] ${tone.card}`}
    >
      <div className="relative overflow-hidden border-b border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-4">
        <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${tone.glow} opacity-50 blur-3xl`} />

        {/* Bookmark button */}
        <button
          type="button"
          aria-label={saved ? 'Remove saved roadmap' : 'Save roadmap'}
          onClick={() => onToggleSave(roadmapKey)}
          className={`absolute right-4 top-4 z-10 grid h-8 w-8 shrink-0 place-items-center rounded-[7px] border transition ${saved ? 'border-violet-300 bg-violet-500/20 text-violet-100' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'}`}
        >
          <Icon name="bookmark" className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
        </button>

        <div className="relative flex items-start gap-3 pr-11">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[8px] ring-1 ring-white/10 ${tone.icon}`}>
            <Icon name={roadmap.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black text-white" title={roadmap.title}>{roadmap.title}</h2>
            <span className={`mt-1 inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.badge}`}>
              {roadmap.tag}
            </span>
          </div>
        </div>
        <p className="relative mt-3 line-clamp-2 text-xs leading-5 text-slate-300">{roadmap.desc}</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" className={`h-3.5 w-3.5 ${tone.label}`} />
            {roadmap.duration}
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span className="inline-flex items-center gap-1.5">
            <Icon name="modules" className={`h-3.5 w-3.5 ${tone.label}`} />
            {roadmap.modules} Modules
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className={`mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide ${tone.label}`}>
            <Icon name="check" className="h-3.5 w-3.5" /> Overview
          </div>
          <div className="relative max-h-[148px] space-y-3 overflow-y-auto pl-7 pr-1 scroll-smooth scrollbar-hide">
            {roadmap.steps.map((step, index) => (
              <div key={step} className="relative min-w-0">
                <span className={`absolute -left-[27px] top-0 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-black text-white ${tone.dot}`}>
                  {index + 1}
                </span>
                <h3 className="text-xs font-bold text-white">Phase {index + 1}</h3>
                <p className="mt-0.5 break-words text-[11px] leading-4 text-slate-400">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(roadmap)}
          className="mt-auto inline-flex h-9 w-full items-center justify-center gap-2 rounded-[7px] bg-gradient-to-r from-sky-400 to-violet-600 px-4 text-xs font-black text-white shadow-lg shadow-violet-950/35 transition duration-300 hover:-translate-y-0.5 hover:shadow-violet-900/50"
        >
          View Full Roadmap <Icon name="arrow" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
});

// ─── RoadmapModal ─────────────────────────────────────────────────────────────
function RoadmapModal({ roadmap, saved, onClose, onToggleSave }) {
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
      aria-label={`${roadmap.title} details`}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto scrollbar-hide rounded-[8px] border border-white/10 bg-[#0b1226] shadow-2xl shadow-black">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#0b1226]/95 p-5 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{roadmap.tag}</p>
            <h2 className="mt-1 text-2xl font-black text-white">{roadmap.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close roadmap details"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-white/10 text-slate-200 transition hover:bg-white/10"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm leading-6 text-slate-300">{roadmap.desc}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Metric icon="clock"   label="Duration"   value={roadmap.duration}   tone={roadmap.tone} />
            <Metric icon="modules" label="Modules"    value={roadmap.modules}    tone={roadmap.tone} />
            <Metric icon="target"  label="Difficulty" value={roadmap.difficulty} tone={roadmap.tone} />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-black uppercase text-white">Complete Learning Path</h3>
            <div className="mt-4 space-y-3">
              {roadmap.steps.map((step, index) => (
                <div key={step} className="rounded-[8px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-bold text-white">Phase {index + 1}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {roadmap.outcomes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-black uppercase text-white">Skills You Build</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {roadmap.outcomes.map((outcome) => (
                  <span key={outcome} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-200">
                    {outcome}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => onToggleSave(getRoadmapKey(roadmap))}
            className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border px-5 text-sm font-bold transition ${saved ? 'border-violet-300 bg-violet-500/20 text-violet-100' : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/10'}`}
          >
            <Icon name="bookmark" className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
            {saved ? 'Saved Roadmap' : 'Save Roadmap'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Roadmaps() {
  const auth = useAuth();
  const { items: remoteRoadmaps, loading } = useApiCollection('roadmaps');
  const { savedIds: serverSavedIds, toggleSaved } = useSavedContent(auth?.token);

  // ── Optimistic save state ──────────────────────────────────────────────────
  // Local Map of { id → boolean } overrides server truth instantly so the UI
  // reacts in the same frame the user taps, then clears once the API confirms.
  const [optimisticOverrides, setOptimisticOverrides] = useState(new Map());
  const pendingRef = useRef(new Set()); // guards against duplicate requests

  const savedIds = useMemo(() => {
    if (optimisticOverrides.size === 0) return serverSavedIds;
    const merged = new Set(serverSavedIds);
    optimisticOverrides.forEach((add, id) => (add ? merged.add(id) : merged.delete(id)));
    return merged;
  }, [serverSavedIds, optimisticOverrides]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [difficulty, setDifficulty] = useState('All');
  const [rawQuery, setRawQuery]     = useState('');
  const query = useDebounced(rawQuery, SEARCH_DEBOUNCE_MS);
  const [selected, setSelected]     = useState(null);
  const [page, setPage]             = useState(1);

  // ── Normalize once when remote data arrives ────────────────────────────────
  const roadmaps = useMemo(
    () => remoteRoadmaps.map((r, i) => normalizeRoadmap(r, i)),
    [remoteRoadmaps],
  );

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return roadmaps.filter((r) => {
      if (difficulty !== 'All' && r.difficulty !== difficulty) return false;
      if (search) {
        const haystack = `${r.title} ${r.desc} ${r.level} ${r.steps.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [difficulty, query, roadmaps]);

  useEffect(() => { setPage(1); }, [difficulty, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROADMAPS_PER_PAGE));
  const paginated  = useMemo(
    () => filtered.slice((page - 1) * ROADMAPS_PER_PAGE, page * ROADMAPS_PER_PAGE),
    [filtered, page],
  );

  // ── Optimistic toggle ──────────────────────────────────────────────────────
  const handleToggleSave = useCallback(async (id) => {
    if (!auth?.token) { navigate('/login'); return; }
    if (pendingRef.current.has(id)) return; // block double-tap

    pendingRef.current.add(id);
    const willBeSaved = !savedIds.has(id);

    // Instant UI flip
    setOptimisticOverrides((prev) => new Map(prev).set(id, willBeSaved));

    try {
      await toggleSaved(id);
    } catch {
      // Revert if the request failed
      setOptimisticOverrides((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      navigate('/login');
    } finally {
      pendingRef.current.delete(id);
      // Clear override now that server state has been updated
      setOptimisticOverrides((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  }, [auth?.token, savedIds, toggleSaved]);

  const handleOpen   = useCallback((roadmap) => setSelected(roadmap), []);
  const handleClose  = useCallback(() => setSelected(null), []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative overflow-hidden bg-[#050817] pt-[70px] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_11%_7%,rgba(124,58,237,0.28),transparent_18%),radial-gradient(circle_at_88%_10%,rgba(37,99,235,0.28),transparent_18%),linear-gradient(180deg,#050817_0%,#071023_48%,#050817_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-16 h-40 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.12),transparent)] blur-2xl" />

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-6xl px-5 pb-4 pt-7 sm:px-6 lg:px-8">
        <HeaderArt />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">
            Developer{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent">
              Roadmaps
            </span>
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            Roadmaps for tomorrow's innovators, built to accelerate growth and mastery.
          </p>
        </div>
      </section>

      {/* Feature strip */}
      <section className="relative mx-auto w-full max-w-6xl px-5 py-3 sm:px-6 lg:px-8">
        <div className="grid rounded-[8px] border border-white/10 bg-[#0b1226]/80 shadow-2xl shadow-black/30 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon="book"   title="Curated Paths"  text="Expert designed roadmaps"    tone="violet" />
          <Feature icon="target" title="Career Focused" text="Achieve your goals faster"   tone="violet" />
          <Feature icon="chart"  title="Step by Step"   text="Learn in a structured way"   tone="cyan"   />
          <Feature icon="check"  title="Always Updated" text="Content updated regularly"   tone="blue"   />
        </div>
      </section>

      {/* Filters */}
      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-white/10 bg-[#0b1226]/72 p-2">
          <span className="px-2 text-xs font-bold text-slate-300">Difficulty Level</span>
          {difficultyOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDifficulty(option)}
              className={`h-9 rounded-[7px] px-4 text-xs font-bold transition ${difficulty === option ? 'bg-gradient-to-r from-sky-400 to-violet-600 text-white shadow-lg shadow-violet-950/40' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
            >
              {option}
            </button>
          ))}
        </div>

        <label className="relative w-full md:max-w-xs">
          <input
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Search roadmaps..."
            className="h-11 w-full rounded-[8px] border border-white/10 bg-[#0b1226]/78 pl-4 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" className="h-4 w-4" />
          </span>
        </label>
      </section>

      {/* Cards */}
      <section className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-2 sm:px-6 lg:px-8">
        {/* Skeleton shown during initial fetch */}
        {loading && remoteRoadmaps.length === 0 ? (
          <div className="-mx-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="flex items-stretch gap-5 lg:grid lg:grid-cols-3">
              {Array.from({ length: ROADMAPS_PER_PAGE }).map((_, i) => (
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
                {paginated.map((roadmap) => (
                  <div key={roadmap.id} className="w-[85vw] max-w-sm flex-none sm:w-[380px] lg:w-auto lg:max-w-none">
                    <RoadmapCard
                      roadmap={roadmap}
                      saved={savedIds.has(getRoadmapKey(roadmap))}
                      onToggleSave={handleToggleSave}
                      onOpen={handleOpen}
                    />
                  </div>
                ))}
              </div>
            </div>
            {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
          </>
        ) : (
          <div className="rounded-[8px] border border-white/10 bg-[#0b1226]/82 p-10 text-center">
            <h2 className="text-2xl font-bold">No roadmaps found</h2>
            <p className="mt-2 text-slate-400">Try changing the difficulty level or search term.</p>
          </div>
        )}
      </section>

      {/* Detail modal */}
      {selected && (
        <RoadmapModal
          roadmap={selected}
          saved={savedIds.has(getRoadmapKey(selected))}
          onClose={handleClose}
          onToggleSave={handleToggleSave}
        />
      )}
    </div>
  );
}