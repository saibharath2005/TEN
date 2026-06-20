import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { navigate } from '../hooks/useRoute.js';
import { useApiCollection } from '../hooks/useApiCollection.js';
import { useSavedContent } from '../hooks/useSavedContent.js';

const difficultyOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'];

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
    book: <svg {...common}><path d="M5 5h6a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3V5Z" /><path d="M14 8a3 3 0 0 1 3-3h2v15h-5" /></svg>,
    target: <svg {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m15 9 4-4" /><path d="M19 5v4h-4" /></svg>,
    chart: <svg {...common}><path d="M5 19V9" /><path d="M12 19V5" /><path d="M19 19v-7" /></svg>,
    check: <svg {...common}><circle cx="12" cy="12" r="8" /><path d="m8.5 12.5 2.2 2.2 4.8-5.4" /></svg>,
    search: <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></svg>,
    bookmark: <svg {...common}><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.4L6 20V5a1 1 0 0 1 1-1Z" /></svg>,
    clock: <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>,
    modules: <svg {...common}><path d="M5 5h6v6H5z" /><path d="M13 5h6v6h-6z" /><path d="M5 13h6v6H5z" /><path d="M13 13h6v6h-6z" /></svg>,
    arrow: <svg {...common}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>,
    close: <svg {...common}><path d="m6 6 12 12" /><path d="m18 6-12 12" /></svg>,
    code: <svg {...common}><path d="m9 8-4 4 4 4" /><path d="m15 8 4 4-4 4" /><path d="m13 5-2 14" /></svg>,
    route: <svg {...common}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h4a4 4 0 0 1 0 8h-1a4 4 0 0 0 0 8h5" /></svg>,
  };

  return icons[name] || icons.book;
}

function normalizeRoadmap(roadmap, index) {
  const steps = Array.isArray(roadmap.steps) ? roadmap.steps : String(roadmap.steps || '').split('\n').map((line) => line.trim()).filter(Boolean);
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

export default function Roadmaps() {
  const auth = useAuth();
  const [difficulty, setDifficulty] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const { items: remoteRoadmaps } = useApiCollection('roadmaps');
  const { savedIds, toggleSaved } = useSavedContent(auth?.token);

  const roadmaps = useMemo(() => remoteRoadmaps.map((roadmap, index) => normalizeRoadmap(roadmap, index)), [remoteRoadmaps]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return roadmaps.filter((roadmap) => {
      const matchesDifficulty = difficulty === 'All' || roadmap.difficulty === difficulty;
      const searchable = `${roadmap.title} ${roadmap.desc} ${roadmap.level} ${roadmap.steps.join(' ')}`.toLowerCase();
      return matchesDifficulty && searchable.includes(search);
    });
  }, [difficulty, query, roadmaps]);

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

  return (
    <div className="relative overflow-hidden bg-[#050817] pt-[70px] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_11%_7%,rgba(124,58,237,0.28),transparent_18%),radial-gradient(circle_at_88%_10%,rgba(37,99,235,0.28),transparent_18%),linear-gradient(180deg,#050817_0%,#071023_48%,#050817_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-16 h-40 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.12),transparent)] blur-2xl" />

      <section className="relative mx-auto w-full max-w-6xl px-5 pb-4 pt-7 sm:px-6 lg:px-8">
        <HeaderArt />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">
            Developer <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent">Roadmaps</span>
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            Roadmaps for tomorrow's innovators, built to accelerate growth and mastery.
          </p>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-5 py-3 sm:px-6 lg:px-8">
        <div className="grid rounded-[8px] border border-white/10 bg-[#0b1226]/80 shadow-2xl shadow-black/30 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon="book" title="Curated Paths" text="Expert designed roadmaps" tone="violet" />
          <Feature icon="target" title="Career Focused" text="Achieve your goals faster" tone="violet" />
          <Feature icon="chart" title="Step by Step" text="Learn in a structured way" tone="cyan" />
          <Feature icon="check" title="Always Updated" text="Content updated regularly" tone="blue" />
        </div>
      </section>

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
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search roadmaps..."
            className="h-11 w-full rounded-[8px] border border-white/10 bg-[#0b1226]/78 pl-4 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" className="h-4 w-4" /></span>
        </label>
      </section>

      <section className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-2 sm:px-6 lg:px-8">
        {filtered.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {filtered.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                saved={savedIds.has(getRoadmapKey(roadmap))}
                onToggleSave={toggleSave}
                onOpen={setSelected}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-white/10 bg-[#0b1226]/82 p-10 text-center">
            <h2 className="text-2xl font-bold">No roadmaps found</h2>
            <p className="mt-2 text-slate-400">Try changing the difficulty level or search term.</p>
          </div>
        )}
      </section>

      {selected && (
        <RoadmapModal
          roadmap={selected}
          saved={savedIds.has(getRoadmapKey(selected))}
          onClose={() => setSelected(null)}
          onToggleSave={toggleSave}
        />
      )}
    </div>
  );
}

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
  const tones = {
    violet: 'bg-violet-600/20 text-violet-200',
    cyan: 'bg-cyan-500/18 text-cyan-200',
    blue: 'bg-blue-500/20 text-blue-200',
  };

  return (
    <div className="flex items-center gap-4 border-b border-white/10 p-5 sm:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tones[tone]}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-sm font-black text-white">{title}</h3>
        <p className="mt-1 text-xs text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function RoadmapCard({ roadmap, saved, onToggleSave, onOpen }) {
  const roadmapKey = getRoadmapKey(roadmap);
  const tones = {
    violet: {
      card: 'border-violet-500/35 hover:border-violet-400/70',
      icon: 'bg-violet-600 text-white',
      line: 'border-violet-500/45',
      dot: 'bg-violet-500',
      label: 'text-violet-300',
      badge: 'bg-emerald-400/15 text-emerald-300',
    },
    cyan: {
      card: 'border-cyan-500/35 hover:border-cyan-300/70',
      icon: 'bg-cyan-500/35 text-cyan-100',
      line: 'border-cyan-500/45',
      dot: 'bg-cyan-500',
      label: 'text-cyan-300',
      badge: 'bg-cyan-400/15 text-cyan-300',
    },
    blue: {
      card: 'border-blue-500/35 hover:border-blue-300/70',
      icon: 'bg-blue-500/35 text-blue-100',
      line: 'border-blue-500/45',
      dot: 'bg-blue-500',
      label: 'text-blue-300',
      badge: 'bg-blue-400/15 text-blue-300',
    },
    emerald: {
      card: 'border-emerald-500/35 hover:border-emerald-300/70',
      icon: 'bg-emerald-500/25 text-emerald-100',
      line: 'border-emerald-500/45',
      dot: 'bg-emerald-500',
      label: 'text-emerald-300',
      badge: 'bg-emerald-400/15 text-emerald-300',
    },
  };
  const tone = tones[roadmap.tone] || tones.violet;

  return (
    <article className={`overflow-hidden rounded-[8px] border bg-[#0b1226]/84 shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 ${tone.card}`}>
      <div className="relative border-b border-white/8 bg-white/[0.015] p-5">
        <button
          type="button"
          aria-label={saved ? 'Remove saved roadmap' : 'Save roadmap'}
          onClick={() => onToggleSave(roadmapKey)}
          className={`absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-[7px] border transition ${saved ? 'border-violet-300 bg-violet-500/20 text-violet-100' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'}`}
        >
          <Icon name="bookmark" className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
        </button>
        <div className="flex items-start gap-4 pr-12">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[8px] text-lg font-black ${tone.icon}`}>{roadmap.icon}</span>
          <div>
            <h2 className="text-lg font-black text-white">{roadmap.title}</h2>
            <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${tone.badge}`}>{roadmap.tag}</span>
            <p className="mt-3 text-sm leading-6 text-slate-300">{roadmap.desc}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[1fr_145px]">
        <div>
          <div className={`mb-4 flex items-center gap-2 text-xs font-black uppercase ${tone.label}`}>
            <Icon name="check" className="h-4 w-4" /> Roadmap Overview
          </div>
          <div className={`relative space-y-3 border-l pl-5 ${tone.line}`}>
            {roadmap.steps.map((step, index) => (
              <div key={step} className="relative">
                <span className={`absolute -left-[29px] top-0 grid h-5 w-5 place-items-center rounded-full text-[10px] font-black text-white ${tone.dot}`}>{index + 1}</span>
                <h3 className="text-sm font-bold text-white">Phase {index + 1}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid content-start gap-4">
          <Metric icon="clock" label="Duration" value={roadmap.duration} tone={roadmap.tone} />
          <Metric icon="modules" label="Modules" value={roadmap.modules} tone={roadmap.tone} />
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={() => onOpen(roadmap)}
          className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-[7px] bg-gradient-to-r from-sky-400 to-violet-600 px-4 text-sm font-black text-white shadow-lg shadow-violet-950/35 transition hover:-translate-y-0.5"
        >
          View Full Roadmap <Icon name="arrow" className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function Metric({ icon, label, value, tone }) {
  const colors = {
    violet: 'text-violet-300',
    cyan: 'text-cyan-300',
    blue: 'text-blue-300',
    emerald: 'text-emerald-300',
  };

  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
      <div className={`mb-2 flex items-center gap-2 text-xs font-bold ${colors[tone] || colors.violet}`}>
        <Icon name={icon} className="h-4 w-4" /> {label}
      </div>
      <div className="text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function RoadmapModal({ roadmap, saved, onClose, onToggleSave }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${roadmap.title} details`}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[8px] border border-white/10 bg-[#0b1226] shadow-2xl shadow-black">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#0b1226]/95 p-5 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{roadmap.tag}</p>
            <h2 className="mt-1 text-2xl font-black text-white">{roadmap.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close roadmap details" className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-white/10 text-slate-200 transition hover:bg-white/10">
            <Icon name="close" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm leading-6 text-slate-300">{roadmap.desc}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Metric icon="clock" label="Duration" value={roadmap.duration} tone={roadmap.tone} />
            <Metric icon="modules" label="Modules" value={roadmap.modules} tone={roadmap.tone} />
            <Metric icon="target" label="Difficulty" value={roadmap.difficulty} tone={roadmap.tone} />
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

          <div className="mt-6">
            <h3 className="text-sm font-black uppercase text-white">Skills You Build</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {roadmap.outcomes.map((outcome) => (
                <span key={outcome} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-200">{outcome}</span>
              ))}
            </div>
          </div>

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






