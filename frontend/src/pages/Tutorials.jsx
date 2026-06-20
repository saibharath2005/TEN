import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { navigate } from '../hooks/useRoute.js';
import { useApiCollection } from '../hooks/useApiCollection.js';
import { useSavedContent } from '../hooks/useSavedContent.js';

const fallbackTutorials = [];

const categoryOptions = [
  { id: 'all', label: 'All' },
  { id: 'java', label: 'Java' },
  { id: 'sql', label: 'SQL' },
  { id: 'dsa', label: 'DSA' },
  { id: 'development', label: 'Development' },
  { id: 'devops', label: 'DevOps' },
];

const levelOptions = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'duration-asc', label: 'Shortest' },
  { value: 'duration-desc', label: 'Longest' },
];

const categoryLabels = Object.fromEntries(categoryOptions.map((category) => [category.id, category.label]));

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
    search: <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></svg>,
    filter: <svg {...common}><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></svg>,
    play: <svg {...common} fill="currentColor" stroke="none"><path d="M8 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4a1.1 1.1 0 0 0 0-1.8l-10-6.4A1 1 0 0 0 8 5.6Z" /></svg>,
    bookmark: <svg {...common}><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.4L6 20V5a1 1 0 0 1 1-1Z" /></svg>,
    users: <svg {...common}><path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" /><circle cx="12" cy="9" r="3" /><path d="M4 18c0-1.7 1.1-3.1 2.7-3.7" /><path d="M20 18c0-1.7-1.1-3.1-2.7-3.7" /><path d="M7 10a2.5 2.5 0 0 1-1-4.8" /><path d="M17 10a2.5 2.5 0 0 0 1-4.8" /></svg>,
    book: <svg {...common}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" /><path d="M8 4v13a3 3 0 0 0 3 3" /><path d="M9 8h6" /></svg>,
    clock: <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>,
    chart: <svg {...common}><path d="M5 19V9" /><path d="M12 19V5" /><path d="M19 19v-7" /></svg>,
    calendar: <svg {...common}><path d="M7 3v4" /><path d="M17 3v4" /><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16" /></svg>,
    chevronLeft: <svg {...common}><path d="m15 18-6-6 6-6" /></svg>,
    chevronRight: <svg {...common}><path d="m9 18 6-6-6-6" /></svg>,
    close: <svg {...common}><path d="m6 6 12 12" /><path d="m18 6-12 12" /></svg>,
    trophy: <svg {...common}><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4a3 3 0 0 0 3 3" /><path d="M17 6h3a3 3 0 0 1-3 3" /></svg>,
    cap: <svg {...common}><path d="m3 9 9-5 9 5-9 5-9-5Z" /><path d="M7 11v5c3 2 7 2 10 0v-5" /></svg>,
    arrowUp: <svg {...common}><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></svg>,
  };

  return icons[name] || icons.book;
}

function normalizeTutorial(item) {
  const category = String(item.category || 'development').toLowerCase();
  return {
    ...item,
    _id: item._id || item.id || item.slug || item.title,
    category,
    status: item.status ? `${item.status}`.replace(/^./, (letter) => letter.toUpperCase()) : 'Published',
    minutes: item.minutes || parseDuration(item.duration),
    icon: item.icon || iconForCategory(category),
    instructor: item.instructor || item.author || 'The Epoch Nova',
    lessons: item.lessons || 0,
  };
}

function iconForCategory(category) {
  if (['java'].includes(category)) return 'java';
  if (['sql'].includes(category)) return 'sql';
  if (['dsa'].includes(category)) return 'dsa';
  if (['devops'].includes(category)) return 'devops';
  return 'react';
}

function parseDuration(value = '') {
  const hours = value.match(/(\d+)\s*h/i)?.[1];
  const minutes = value.match(/(\d+)\s*m/i)?.[1] || (/^\d+$/.test(value) ? value : null);
  return Number(hours || 0) * 60 + Number(minutes || 0);
}

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
        {[[18, 28], [76, 18], [122, 45], [76, 72], [18, 86]].map(([left, top], index) => (
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

function TutorialCard({ tutorial, saved, onToggleSave, onWatch }) {
  const levelColor = tutorial.level === 'Advanced' ? 'text-orange-400' : tutorial.level === 'Intermediate' ? 'text-sky-400' : 'text-emerald-400';

  return (
    <article className="group overflow-hidden rounded-[8px] border border-white/10 bg-[#0c1326]/88 shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-violet-400/50 hover:shadow-violet-950/40">
      <div className="relative h-40 overflow-hidden bg-[#0a1024]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,58,237,0.28),transparent_32%),radial-gradient(circle_at_74%_72%,rgba(14,165,233,0.22),transparent_40%),linear-gradient(135deg,rgba(59,7,100,0.55),rgba(2,6,23,0.86))]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0_48%,rgba(255,255,255,0.05)_49%,transparent_50%)] bg-[length:34px_34px] opacity-20" />
        <span className="absolute left-4 top-4 rounded-[6px] bg-gradient-to-r from-sky-400 to-violet-600 px-3 py-2 text-xs font-bold uppercase text-white shadow-lg shadow-violet-950/40">
          {categoryLabels[tutorial.category] || tutorial.category}
        </span>
        <button
          type="button"
          aria-label={saved ? 'Remove bookmark' : 'Save tutorial'}
          onClick={() => onToggleSave(tutorial._id)}
          className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border transition ${saved ? 'border-violet-300 bg-violet-500/25 text-violet-100' : 'border-white/10 bg-black/35 text-white hover:bg-white/10'}`}
        >
          <Icon name="bookmark" className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
        </button>
        <div className="absolute inset-0 grid place-items-center">
          <TutorialVisual icon={tutorial.icon} />
        </div>
        <span className="absolute bottom-4 right-4 rounded-[6px] bg-black/75 px-3 py-1.5 text-xs font-bold text-white">
          {tutorial.duration}
        </span>
      </div>

      <div className="flex min-h-[235px] flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-white">{tutorial.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{tutorial.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className={`inline-flex items-center gap-1.5 ${levelColor}`}><Icon name="chart" className="h-4 w-4" />{tutorial.level}</span>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span className="inline-flex items-center gap-1.5"><Icon name="calendar" className="h-4 w-4" />{tutorial.status}</span>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_52px] gap-3">
          <button
            type="button"
            onClick={() => onWatch(tutorial)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-gradient-to-r from-sky-400 to-violet-600 px-4 text-sm font-bold text-white shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5"
          >
            <Icon name="play" className="h-4 w-4" /> Watch Now
          </button>
          <button
            type="button"
            aria-label={saved ? 'Remove bookmark' : 'Save tutorial'}
            onClick={() => onToggleSave(tutorial._id)}
            className={`grid h-11 place-items-center rounded-[7px] border transition ${saved ? 'border-violet-300 bg-violet-500/20 text-violet-100' : 'border-slate-500/50 bg-slate-950/35 text-slate-200 hover:bg-white/10'}`}
          >
            <Icon name="bookmark" className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Tutorials() {
  const auth = useAuth();
  const { items, loading } = useApiCollection('tutorials');
  const { savedIds, toggleSaved } = useSavedContent(auth?.token);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('All Levels');
  const [sort, setSort] = useState('popular');
  const [shortOnly, setShortOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTutorial, setActiveTutorial] = useState(null);

  const tutorials = useMemo(() => items.map((item) => normalizeTutorial(item)), [items]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = tutorials.filter((tutorial) => {
      const matchesCategory = category === 'all' || tutorial.category === category;
      const matchesLevel = level === 'All Levels' || tutorial.level === level;
      const matchesShort = !shortOnly || tutorial.minutes <= 45;
      const haystack = `${tutorial.title} ${tutorial.description} ${tutorial.category} ${tutorial.level} ${tutorial.instructor}`.toLowerCase();
      return matchesCategory && matchesLevel && matchesShort && haystack.includes(normalizedQuery);
    });

    return result.sort((a, b) => {
      if (sort === 'duration-asc') return a.minutes - b.minutes;
      if (sort === 'duration-desc') return b.minutes - a.minutes;
      if (sort === 'newest') return b._id.localeCompare(a._id);
      return b.lessons - a.lessons;
    });
  }, [category, level, query, shortOnly, sort, tutorials]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 4));
  const visibleTutorials = filtered.slice((page - 1) * 4, page * 4);

  useEffect(() => {
    setPage(1);
  }, [category, level, query, shortOnly, sort]);

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

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setLevel('All Levels');
    setSort('popular');
    setShortOnly(false);
  };

  return (
    <div className="relative overflow-hidden bg-[#050817] pt-[70px] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(73,70,229,0.22),transparent_25%),radial-gradient(circle_at_86%_18%,rgba(37,99,235,0.22),transparent_23%),linear-gradient(180deg,#050817_0%,#080b1d_52%,#050817_100%)]" />
      <div className="pointer-events-none absolute left-0 right-0 top-52 h-px bg-cyan-300/20 shadow-[0_0_65px_18px_rgba(37,99,235,0.45)]" />

      <section className="relative mx-auto w-full max-w-7xl px-5 pb-3 pt-10 sm:px-6 lg:px-8">
        <HeroArt />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-black leading-tight sm:text-6xl">
            Our <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent">Tutorials</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Comprehensive video tutorials and articles to help you master technology skills.
          </p>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-5 py-5 sm:px-6 lg:px-8">
        <div className="rounded-[8px] border border-white/10 bg-[#080d20]/88 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_auto_auto] lg:items-center">
            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Icon name="search" /></span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tutorials..."
                className="h-12 w-full rounded-[8px] border border-white/10 bg-white/[0.04] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
              />
            </label>

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

            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              className={`relative inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border px-5 text-sm font-bold transition ${filtersOpen ? 'border-violet-300 bg-violet-500/20 text-white' : 'border-violet-300/50 bg-white/[0.03] text-white hover:bg-white/[0.08]'}`}
            >
              <Icon name="filter" className="h-4 w-4" /> Filters
              {(level !== 'All Levels' || shortOnly || sort !== 'popular') && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-violet-400" />}
            </button>
          </div>

          {filtersOpen && (
            <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
              <label className="grid gap-2 text-sm text-slate-300">
                Level
                <select value={level} onChange={(event) => setLevel(event.target.value)} className="h-11 rounded-[8px] border border-white/10 bg-[#10172d] px-3 text-white outline-none">
                  {levelOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Sort
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 rounded-[8px] border border-white/10 bg-[#10172d] px-3 text-white outline-none">
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="flex h-11 items-center gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] px-4 text-sm text-slate-200">
                <input type="checkbox" checked={shortOnly} onChange={(event) => setShortOnly(event.target.checked)} className="h-4 w-4 accent-violet-500" />
                Under 45 min
              </label>
              <button type="button" onClick={clearFilters} className="h-11 rounded-[8px] border border-white/10 px-4 text-sm font-bold text-slate-200 transition hover:bg-white/10">
                Clear
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-5 py-3 sm:px-6 lg:px-8">
        <div className="grid rounded-[8px] border border-white/10 bg-[#0b1226]/82 shadow-2xl shadow-black/25 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon="play" value="500+" label="Video Tutorials" tone="violet" />
          <Stat icon="book" value="250+" label="Articles" tone="sky" />
          <Stat icon="users" value="120K+" label="Happy Learners" tone="emerald" />
          <Stat icon="clock" value="10K+" label="Hours of Content" tone="amber" />
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        {loading && <p className="mb-4 text-sm text-slate-400">Refreshing tutorials...</p>}
        {visibleTutorials.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleTutorials.map((tutorial) => (
              <TutorialCard
                key={tutorial._id}
                tutorial={tutorial}
                saved={savedIds.has(tutorial._id)}
                onToggleSave={toggleSave}
                onWatch={setActiveTutorial}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-white/10 bg-[#0b1226]/82 p-10 text-center">
            <h2 className="text-2xl font-bold">No tutorials found</h2>
            <p className="mt-2 text-slate-400">Try a different search, category or filter combination.</p>
            <button type="button" onClick={clearFilters} className="mt-5 rounded-[8px] bg-gradient-to-r from-sky-400 to-violet-600 px-5 py-3 text-sm font-bold text-white">Reset Filters</button>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-5 pb-8 pt-2 sm:px-6 lg:px-8">
        <div className="grid rounded-[8px] border border-white/10 bg-[#0b1226]/86 shadow-2xl shadow-black/25 md:grid-cols-2 lg:grid-cols-4">
          <Benefit icon="cap" title="Expert Instructors" text="Learn from industry professionals" tone="violet" />
          <Benefit icon="play" title="Practical Content" text="Real-world projects and examples" tone="sky" />
          <Benefit icon="trophy" title="Learn at Your Pace" text="Study anytime, anywhere" tone="violet" />
          <Benefit icon="users" title="Active Community" text="Join thousands of learners" tone="emerald" />
        </div>
      </section>

      {activeTutorial && (
        <WatchModal
          tutorial={activeTutorial}
          saved={savedIds.has(activeTutorial._id)}
          onClose={() => setActiveTutorial(null)}
          onToggleSave={toggleSave}
        />
      )}
    </div>
  );
}

function HeroArt() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 hidden h-44 md:block">
      <div className="absolute left-5 top-10 h-28 w-36 -rotate-12 rounded-[8px] border border-violet-400/35 bg-violet-500/10 shadow-[0_28px_70px_rgba(79,70,229,0.45)]">
        <div className="flex gap-2 border-b border-white/10 p-3"><span className="h-2 w-2 rounded-full bg-violet-300" /><span className="h-2 w-2 rounded-full bg-violet-400" /><span className="h-2 w-2 rounded-full bg-blue-400" /></div>
        <div className="grid h-20 place-items-center text-4xl font-black text-violet-400">&lt;/&gt;</div>
      </div>
      <div className="absolute right-4 top-3 h-32 w-44 rotate-12 rounded-[8px] border border-violet-400/35 bg-violet-600/20 p-6 shadow-[0_28px_80px_rgba(37,99,235,0.45)]">
        <div className="grid h-full place-items-center rounded-[8px] text-violet-100"><Icon name="play" className="h-12 w-12" /></div>
        <div className="absolute bottom-5 left-7 h-1.5 w-24 rounded-full bg-white/60"><span className="block h-3 w-3 -translate-y-1 rounded-full bg-white" /></div>
      </div>
      <span className="absolute left-[21%] top-1 h-5 w-5 rounded-full border border-blue-500/40 bg-blue-500/10" />
      <span className="absolute right-[28%] top-10 h-7 w-7 rounded-full border border-violet-500/40 bg-violet-500/10" />
      <span className="absolute right-[36%] top-0 text-4xl text-violet-400">*</span>
    </div>
  );
}

function Stat({ icon, value, label, tone }) {
  const tones = {
    violet: 'bg-violet-600/25 text-violet-200 shadow-violet-950/50',
    sky: 'bg-sky-500/20 text-sky-200 shadow-sky-950/50',
    emerald: 'bg-emerald-500/20 text-emerald-200 shadow-emerald-950/50',
    amber: 'bg-amber-500/20 text-amber-200 shadow-amber-950/50',
  };

  return (
    <div className="flex items-center gap-4 border-b border-white/10 p-6 sm:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-[8px] shadow-xl ${tones[tone]}`}>
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <div>
        <strong className="block text-xl font-black text-white">{value}</strong>
        <span className="text-sm text-slate-300">{label}</span>
      </div>
    </div>
  );
}

function Benefit({ icon, title, text, tone }) {
  const tones = {
    violet: 'bg-violet-600/25 text-violet-200',
    sky: 'bg-sky-500/20 text-sky-200',
    emerald: 'bg-emerald-500/20 text-emerald-200',
  };

  return (
    <div className="flex items-center gap-4 border-b border-white/10 p-6 md:odd:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${tones[tone]}`}>
        <Icon name={icon} className="h-8 w-8" />
      </span>
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, setPage }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-5 flex justify-center">
      <div className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-[#0b1226]/86 p-1.5">
        <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="grid h-10 w-10 place-items-center rounded-[7px] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">
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
        <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="grid h-10 w-10 place-items-center rounded-[7px] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">
          <Icon name="chevronRight" />
        </button>
      </div>
    </div>
  );
}

function WatchModal({ tutorial, saved, onClose, onToggleSave }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${tutorial.title} preview`}>
      <div className="w-full max-w-3xl overflow-hidden rounded-[8px] border border-white/10 bg-[#0b1226] shadow-2xl shadow-black">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{categoryLabels[tutorial.category] || tutorial.category}</p>
            <h2 className="mt-1 text-xl font-black text-white">{tutorial.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close preview" className="grid h-10 w-10 place-items-center rounded-[8px] border border-white/10 text-slate-200 transition hover:bg-white/10">
            <Icon name="close" />
          </button>
        </div>
        <div className="grid aspect-video place-items-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.22),rgba(2,6,23,0.96)_62%)]">
          <button type="button" className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-r from-sky-400 to-violet-600 text-white shadow-[0_0_70px_rgba(124,58,237,0.55)]">
            <Icon name="play" className="h-9 w-9 translate-x-0.5" />
          </button>
        </div>
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
          <button
            type="button"
            onClick={() => onToggleSave(tutorial._id)}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border px-5 text-sm font-bold transition ${saved ? 'border-violet-300 bg-violet-500/20 text-violet-100' : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/10'}`}
          >
            <Icon name="bookmark" className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}





