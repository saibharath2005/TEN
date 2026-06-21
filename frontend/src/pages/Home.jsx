import { useMemo, useState } from 'react';
import ContentGrid from '../components/ui/ContentGrid.jsx';
import Link from '../components/ui/Link.jsx';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import { buttonPrimary, buttonSecondary, glass, gradientText, shell } from '../components/ui/classes.js';
import { useApiCollection } from '../hooks/useApiCollection.js';
import { useAuth } from '../hooks/useAuth.js';
import { navigate } from '../hooks/useRoute.js';
import { useSavedContent } from '../hooks/useSavedContent.js';

// ─── Shared Icon component (same as Roadmaps.jsx) ──────────────────────────
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
    book:     <svg {...common}><path d="M5 5h6a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3V5Z" /><path d="M14 8a3 3 0 0 1 3-3h2v15h-5" /></svg>,
    target:   <svg {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m15 9 4-4" /><path d="M19 5v4h-4" /></svg>,
    chart:    <svg {...common}><path d="M5 19V9" /><path d="M12 19V5" /><path d="M19 19v-7" /></svg>,
    check:    <svg {...common}><circle cx="12" cy="12" r="8" /><path d="m8.5 12.5 2.2 2.2 4.8-5.4" /></svg>,
    search:   <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></svg>,
    bookmark: <svg {...common}><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.4L6 20V5a1 1 0 0 1 1-1Z" /></svg>,
    clock:    <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>,
    modules:  <svg {...common}><path d="M5 5h6v6H5z" /><path d="M13 5h6v6h-6z" /><path d="M5 13h6v6H5z" /><path d="M13 13h6v6h-6z" /></svg>,
    arrow:    <svg {...common}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>,
    close:    <svg {...common}><path d="m6 6 12 12" /><path d="m18 6-12 12" /></svg>,
    code:     <svg {...common}><path d="m9 8-4 4 4 4" /><path d="m15 8 4 4-4 4" /><path d="m13 5-2 14" /></svg>,
    route:    <svg {...common}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h4a4 4 0 0 1 0 8h-1a4 4 0 0 0 0 8h5" /></svg>,
    lock:     <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
  };

  return icons[name] || icons.book;
}

// ─── Normalizer (same as Roadmaps.jsx) ────────────────────────────────────
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

// ─── Stat card ─────────────────────────────────────────────────────────────
function Stat({ value, label }) {
  return (
    <div className="rounded-[10px] border border-white/10 bg-white/[0.03] p-5 text-center">
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

// ─── Auth-gate overlay (shown on top of locked cards) ──────────────────────
function AuthGateOverlay({ message = 'Sign in to access roadmaps' }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[10px] bg-[#050817]/80 backdrop-blur-[2px]">
      <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300">
        <Icon name="lock" className="h-6 w-6" />
      </span>
      <p className="text-xs font-bold text-slate-300">{message}</p>
      <div className="flex gap-2">
        <a
          href="/login"
          className="inline-flex h-8 items-center rounded-[7px] bg-gradient-to-r from-sky-400 to-violet-600 px-4 text-xs font-black text-white shadow-lg"
        >
          Log In
        </a>
        <a
          href="/signup"
          className="inline-flex h-8 items-center rounded-[7px] border border-white/10 bg-white/[0.04] px-4 text-xs font-bold text-white hover:bg-white/10"
        >
          Sign Up
        </a>
      </div>
    </div>
  );
}

// ─── Metric (used inside modal) ────────────────────────────────────────────
function Metric({ icon, label, value, tone }) {
  const colors = {
    violet: 'text-violet-300',
    cyan: 'text-cyan-300',
    blue: 'text-blue-300',
    emerald: 'text-emerald-300',
  };

  return (
    <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
      <div className={`mb-2 flex items-center gap-2 text-xs font-bold ${colors[tone] || colors.violet}`}>
        <Icon name={icon} className="h-4 w-4 shrink-0" /> <span className="truncate">{label}</span>
      </div>
      <div className="truncate text-sm font-bold text-white" title={String(value)}>{value}</div>
    </div>
  );
}

// ─── Full RoadmapCard (identical to Roadmaps.jsx) ──────────────────────────
function RoadmapCard({ roadmap, saved, onToggleSave, onOpen, isLocked }) {
  const roadmapKey = getRoadmapKey(roadmap);
  const tones = {
    violet: {
      card:  'border-violet-500/35 hover:border-violet-400/70',
      icon:  'bg-violet-600 text-white',
      glow:  'bg-violet-500',
      line:  'border-violet-500/45',
      dot:   'bg-violet-500',
      label: 'text-violet-300',
      badge: 'bg-emerald-400/15 text-emerald-300',
    },
    cyan: {
      card:  'border-cyan-500/35 hover:border-cyan-300/70',
      icon:  'bg-cyan-500/35 text-cyan-100',
      glow:  'bg-cyan-400',
      line:  'border-cyan-500/45',
      dot:   'bg-cyan-500',
      label: 'text-cyan-300',
      badge: 'bg-cyan-400/15 text-cyan-300',
    },
    blue: {
      card:  'border-blue-500/35 hover:border-blue-300/70',
      icon:  'bg-blue-500/35 text-blue-100',
      glow:  'bg-blue-400',
      line:  'border-blue-500/45',
      dot:   'bg-blue-500',
      label: 'text-blue-300',
      badge: 'bg-blue-400/15 text-blue-300',
    },
    emerald: {
      card:  'border-emerald-500/35 hover:border-emerald-300/70',
      icon:  'bg-emerald-500/25 text-emerald-100',
      glow:  'bg-emerald-400',
      line:  'border-emerald-500/45',
      dot:   'bg-emerald-500',
      label: 'text-emerald-300',
      badge: 'bg-emerald-400/15 text-emerald-300',
    },
  };
  const tone = tones[roadmap.tone] || tones.violet;

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-[10px] border bg-[#0b1226]/84 shadow-[0_14px_38px_-18px_rgba(0,0,0,0.65)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_-16px_rgba(0,0,0,0.75)] ${tone.card}`}>
      {/* Auth-gate overlay */}
      {isLocked && <AuthGateOverlay message="Sign in to access roadmaps" />}

      <div className="relative overflow-hidden border-b border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-4">
        <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${tone.glow} opacity-50 blur-3xl`} />

        {/* Bookmark button — disabled when locked */}
        <button
          type="button"
          aria-label={saved ? 'Remove saved roadmap' : 'Save roadmap'}
          onClick={() => !isLocked && onToggleSave(roadmapKey)}
          disabled={isLocked}
          className={`absolute right-4 top-4 z-10 grid h-8 w-8 shrink-0 place-items-center rounded-[7px] border transition ${saved ? 'border-violet-300 bg-violet-500/20 text-violet-100' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'} ${isLocked ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          <Icon name="bookmark" className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
        </button>

        <div className="relative flex items-start gap-3 pr-11">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[8px] ring-1 ring-white/10 ${tone.icon}`}>
            <Icon name={roadmap.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-black text-white" title={roadmap.title}>{roadmap.title}</h2>
            <span className={`mt-1 inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.badge}`}>{roadmap.tag}</span>
          </div>
        </div>
        <p className="relative mt-3 line-clamp-2 text-xs leading-5 text-slate-300">{roadmap.desc}</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-300">
          <span className="inline-flex items-center gap-1.5"><Icon name="clock" className={`h-3.5 w-3.5 ${tone.label}`} />{roadmap.duration}</span>
          <span className="h-3 w-px bg-white/10" />
          <span className="inline-flex items-center gap-1.5"><Icon name="modules" className={`h-3.5 w-3.5 ${tone.label}`} />{roadmap.modules} Modules</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className={`mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide ${tone.label}`}>
            <Icon name="check" className="h-3.5 w-3.5" /> Overview
          </div>
          <div className={`relative max-h-[148px] space-y-3 overflow-y-auto border-0 pl-7 pr-1 scroll-smooth scrollbar-hide ${tone.line}`}>
            {roadmap.steps.map((step, index) => (
              <div key={step} className="relative min-w-0">
                <span className={`absolute -left-[27px] top-0 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-black text-white ${tone.dot}`}>{index + 1}</span>
                <h3 className="text-xs font-bold text-white">Phase {index + 1}</h3>
                <p className="mt-0.5 break-words text-[11px] leading-4 text-slate-400">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => !isLocked && onOpen(roadmap)}
          disabled={isLocked}
          className={`mt-auto inline-flex h-9 w-full items-center justify-center gap-2 rounded-[7px] bg-gradient-to-r from-sky-400 to-violet-600 px-4 text-xs font-black text-white shadow-lg shadow-violet-950/35 transition duration-300 hover:-translate-y-0.5 hover:shadow-violet-900/50 ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          View Full Roadmap <Icon name="arrow" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

// ─── Roadmap detail modal (same as Roadmaps.jsx) ──────────────────────────
function RoadmapModal({ roadmap, saved, onClose, onToggleSave }) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${roadmap.title} details`}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto scrollbar-hide rounded-[8px] border border-white/10 bg-[#0b1226] shadow-2xl shadow-black">
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

          {roadmap.outcomes?.length > 0 && (
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

// ─── Locked wrapper for non-roadmap content (tutorials / notes) ───────────
// Wraps the existing ContentGrid items in the same card shell footprint
// WITHOUT changing ContentGrid/card UI — it overlays a lock screen on top
// of the grid area so visitors see the same layout shape, gated.
function LockedContentSection({ type, items, emptyTitle, message }) {
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[2px] opacity-60">
        <ContentGrid type={type} items={items} emptyTitle={emptyTitle} />
      </div>
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[10px] bg-[#050817]/70 backdrop-blur-[2px]">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300">
          <Icon name="lock" className="h-6 w-6" />
        </span>
        <p className="text-xs font-bold text-slate-300">{message}</p>
        <div className="flex gap-2">
          <a
            href="/login"
            className="inline-flex h-8 items-center rounded-[7px] bg-gradient-to-r from-sky-400 to-violet-600 px-4 text-xs font-black text-white shadow-lg"
          >
            Log In
          </a>
          <a
            href="/signup"
            className="inline-flex h-8 items-center rounded-[7px] border border-white/10 bg-white/[0.04] px-4 text-xs font-bold text-white hover:bg-white/10"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── GatedLink ──────────────────────────────────────────────────────────────
// Renders the real `Link` (real href, real client-side navigation) when the
// user is logged in. When logged out, it renders a plain button that ONLY
// navigates to /login — it never points at the real destination, so there's
// no dependency on the Link component honoring preventDefault internally.
function GatedLink({ isLoggedIn, href, className, children }) {
  if (isLoggedIn) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/login')}
      className={className}
    >
      {children}
    </button>
  );
}

// ─── Home page ─────────────────────────────────────────────────────────────
export default function Home() {
  const auth = useAuth();
  const isLoggedIn = Boolean(auth?.token);

  const tutorials = useApiCollection('tutorials');
  const notes     = useApiCollection('notes');
  const roadmaps  = useApiCollection('roadmaps');

  const { savedIds, toggleSaved } = useSavedContent(auth?.token);
  const [selected, setSelected] = useState(null);

  const stats = useMemo(() => ([
    { value: tutorials.items.length, label: 'Tutorials' },
    { value: notes.items.length,     label: 'Resources' },
    { value: roadmaps.items.length,  label: 'Roadmaps'  },
  ]), [notes.items.length, roadmaps.items.length, tutorials.items.length]);

  const featuredTutorials = tutorials.items.slice(0, 3);
  const featuredNotes     = notes.items.slice(0, 3);

  // Latest 3 roadmaps, normalized
  const featuredRoadmaps = useMemo(
    () => roadmaps.items.slice(0, 3).map((r, i) => normalizeRoadmap(r, i)),
    [roadmaps.items],
  );

  const handleToggleSave = async (id) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    try {
      await toggleSaved(id);
    } catch {
      navigate('/login');
    }
  };

  const handleOpen = (roadmap) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setSelected(roadmap);
  };

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(124,58,237,0.10),transparent_24%),linear-gradient(180deg,#050b13_0%,#04070d_100%)]" />
        <div className={`${shell} relative py-16 text-center`}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              The Epoch Nova
            </div>
            <h1 className="text-5xl font-black leading-tight text-white md:text-6xl">
              Code the Future.{' '}
              <span className={gradientText}>Scale with the Cloud. Innovate with AI.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              The platform where developers learn, build, and launch next-generation applications powered by AI and cloud technologies.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <GatedLink isLoggedIn={isLoggedIn} href="/tutorials" className={buttonPrimary}>Get Started</GatedLink>
              <GatedLink isLoggedIn={isLoggedIn} href="/notes" className={buttonSecondary}>Open Library</GatedLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-8">
        <div className={shell}>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => <Stat key={stat.label} value={stat.value} label={stat.label} />)}
          </div>
        </div>
      </section>

      {/* ── Tutorials ── */}
      <section className="py-16">
        <div className={shell}>
          <SectionHeader title="Featured" accent="Tutorials" subtitle="Latest tutorials curated to help you master modern technologies." />
          <ContentGrid type="tutorials" items={featuredTutorials} emptyTitle="No tutorials published yet" />
        </div>
      </section>

      {/* ── Notes / Resources (auth-gated like roadmaps when logged out) ── */}
      <section className="py-16">
        <div className={shell}>
          <SectionHeader title="Latest" accent="Resources" subtitle="Explore expert-curated notes, PDFs, and learning materials in one place." />

          {isLoggedIn ? (
            <ContentGrid type="notes" items={featuredNotes} emptyTitle="No notes published yet" />
          ) : (
            <LockedContentSection
              type="notes"
              items={featuredNotes}
              emptyTitle="No notes published yet"
              message="Sign in to access resources"
            />
          )}

          {featuredNotes.length > 0 && (
            <div className="mt-8 text-center">
              <GatedLink
                isLoggedIn={isLoggedIn}
                href="/notes"
                className="inline-flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.04] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                View All Resources <Icon name="arrow" className="h-4 w-4" />
              </GatedLink>
            </div>
          )}
        </div>
      </section>

      {/* ── Roadmaps (latest 3, same RoadmapCard, auth-gated) ── */}
      <section className="py-16">
        <div className={shell}>
          <SectionHeader
            title="Top"
            accent="Roadmaps"
            subtitle="Roadmaps for tomorrow's innovators, built for success."
          />

          {featuredRoadmaps.length ? (
            <div className="grid items-stretch gap-5 lg:grid-cols-3">
              {featuredRoadmaps.map((roadmap) => (
                <RoadmapCard
                  key={roadmap.id}
                  roadmap={roadmap}
                  saved={savedIds.has(getRoadmapKey(roadmap))}
                  onToggleSave={handleToggleSave}
                  onOpen={handleOpen}
                  isLocked={!isLoggedIn}
                />
              ))}
            </div>
          ) : (
            <div className={`${glass} py-14 text-center text-slate-400`}>No roadmaps published yet.</div>
          )}

          {/* "View all" link — gated to login/signup when logged out */}
          {featuredRoadmaps.length > 0 && (
            <div className="mt-8 text-center">
              <GatedLink
                isLoggedIn={isLoggedIn}
                href="/roadmaps"
                className="inline-flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.04] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                View All Roadmaps <Icon name="arrow" className="h-4 w-4" />
              </GatedLink>
            </div>
          )}
        </div>
      </section>

      {/* ── Roadmap detail modal (only reachable when logged in) ── */}
      {selected && (
        <RoadmapModal
          roadmap={selected}
          saved={savedIds.has(getRoadmapKey(selected))}
          onClose={() => setSelected(null)}
          onToggleSave={handleToggleSave}
        />
      )}
    </>
  );
}