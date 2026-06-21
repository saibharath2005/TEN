import { useEffect, useMemo, useState } from 'react';
import Link from '../components/ui/Link.jsx';
import { shell } from '../components/ui/classes.js';
import { navigate } from '../hooks/useRoute.js';
import { useAuth } from '../hooks/useAuth.js';
import { apiGet } from '../services/api.js';
import { useSavedContent } from '../hooks/useSavedContent.js';

const sidebarItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'tutorials', label: 'Saved Tutorials' },
  { id: 'notes', label: 'Saved Notes & PDFs' },
  { id: 'roadmaps', label: 'Saved Roadmaps' },
  { id: 'profile', label: 'Profile' },
];

const KIND_META = {
  tutorial: { label: 'Tutorial', icon: 'bookmark', tone: 'from-violet-500/30 to-fuchsia-500/10 text-violet-300', bar: 'from-violet-400 to-fuchsia-500' },
  roadmap: { label: 'Roadmap', icon: 'layout', tone: 'from-cyan-400/30 to-blue-500/10 text-cyan-300', bar: 'from-cyan-300 to-blue-500' },
  note: { label: 'PDF', icon: 'file', tone: 'from-emerald-400/30 to-teal-500/10 text-emerald-300', bar: 'from-emerald-300 to-teal-500' },
};

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
    layout: <svg {...common}><path d="M4 5h6v6H4z" /><path d="M14 5h6v4h-6z" /><path d="M14 11h6v8h-6z" /><path d="M4 14h6v5H4z" /></svg>,
    bookmark: <svg {...common}><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.4L6 20V5a1 1 0 0 1 1-1Z" /></svg>,
    file: <svg {...common}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v6h5" /></svg>,
    user: <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>,
    logout: <svg {...common}><path d="M10 17l-1 1a2 2 0 0 1-2 0l-3-3a2 2 0 0 1 0-2l3-3a2 2 0 0 1 2 0l1 1" /><path d="M13 12H3" /><path d="M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3" /></svg>,
    chevronRight: <svg {...common}><path d="m9 18 6-6-6-6" /></svg>,
  };

  return icons[name] || icons.layout;
}

function DotGrid({ opacity = 0.08 }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    />
  );
}

function TabNav({ active, onChange }) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {sidebarItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${
            active === item.id
              ? 'border-transparent bg-gradient-to-r from-cyan-300 to-violet-500 text-slate-950 shadow-[0_8px_20px_-8px_rgba(34,211,238,0.6)]'
              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function ListPanel({ title, subtitle, items, kind, onOpen, onViewAll }) {
  const meta = KIND_META[kind] || KIND_META.note;
  const emptyLabel = kind === 'tutorial' ? 'tutorials' : kind === 'roadmap' ? 'roadmaps' : 'notes';

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#070b12]/90 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-white">{title}</h2>
          {subtitle ? <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[11px] text-slate-500">{items.length} saved</span>
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="rounded font-mono text-[11px] uppercase tracking-[0.1em] text-violet-300 transition-colors duration-200 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
            >
              View all
            </button>
          ) : null}
        </div>
      </header>

      {items.length ? (
        <div className="divide-y divide-white/5">
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={onOpen}
              className="group flex w-full min-w-0 items-center gap-4 px-5 py-3.5 text-left transition-colors duration-200 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:bg-white/[0.04]"
            >
              <span className={`h-9 w-1 shrink-0 rounded-full bg-gradient-to-b ${meta.bar}`} />
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${meta.tone}`}>
                <Icon name={meta.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-semibold text-white">{item.title}</strong>
                <span className="mt-0.5 block truncate text-xs text-slate-400">{item.description || item.desc || 'Saved content'}</span>
              </span>
              <span className="hidden shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400 sm:inline-block">
                {meta.label}
              </span>
              <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-slate-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-cyan-300" />
            </button>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-slate-400">{`No saved ${emptyLabel} yet.`}</p>
        </div>
      )}
    </section>
  );
}

function ProfileDossier({ initial, profileName, roleLabel, profileEmail, memberSince, lastLogin, savedTutorialsCount, savedNotesCount, savedRoadmapCount, totalSavedCount }) {
  const rows = [
    { label: 'Full name', value: profileName },
    { label: 'Email address', value: profileEmail },
    { label: 'Role', value: roleLabel },
    { label: 'Member since', value: memberSince },
    { label: 'Last login', value: lastLogin },
    { label: 'Saved tutorials', value: savedTutorialsCount },
    { label: 'Saved notes', value: savedNotesCount },
    { label: 'Saved roadmaps', value: savedRoadmapCount },
    { label: 'Total saved items', value: totalSavedCount },
  ];

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#070b12]/90 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <header className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-2xl font-black text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-white">{profileName}</h2>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-cyan-300/80">{roleLabel}</p>
        </div>
      </header>
      <dl className="divide-y divide-white/5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-6 py-3.5">
            <dt className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">{row.label}</dt>
            <dd className="min-w-0 truncate break-words text-right text-sm font-semibold text-white">{row.value || '-'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AccessPrompt() {
  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-x-hidden bg-[#050b13] pt-[88px] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_26%),radial-gradient(circle_at_80%_15%,rgba(124,58,237,0.10),transparent_24%),linear-gradient(180deg,#050b13_0%,#04070d_100%)]" />
      <div className={`${shell} relative flex min-h-[calc(100vh-160px)] items-center justify-center px-4`}>
        <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#070b12]/95 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:p-8">
          <DotGrid opacity={0.06} />
          <div className="relative">
            <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-cyan-300/20 to-violet-500/20 text-cyan-300">
              <Icon name="user" className="h-6 w-6" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">Learning hub</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Dashboard Access</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
              Login to view your saved tutorials, notes, and roadmap overview.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-[9px] border border-cyan-300/60 px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-cyan-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-[9px] bg-gradient-to-r from-cyan-300 to-violet-500 px-5 text-sm font-medium text-slate-950 transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const auth = useAuth();
  const { savedByType, savedCount, savedIds, refresh } = useSavedContent(auth?.token);
  const [summary, setSummary] = useState(null);
  const [section, setSection] = useState('overview');

  useEffect(() => {
    if (!auth?.token) return;
    apiGet('/dashboard/summary', auth.token)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [auth?.token]);

  useEffect(() => {
    if (!auth?.token) return;
    refresh();
  }, [auth?.token, refresh]);

  const profileName = summary?.profile?.name || auth?.user?.name || 'User';
  const profileEmail = summary?.profile?.email || auth?.user?.email || 'user@example.com';
  const roleLabel = auth?.user?.role === 'admin' ? 'Administrator' : 'Learner';
  const memberSince = summary?.activity?.memberSince || summary?.profile?.createdAt || auth?.loggedInAt || '';
  const lastLogin = summary?.activity?.lastLogin || summary?.profile?.updatedAt || auth?.loggedInAt || '';
  const initial = (profileName || 'U').slice(0, 1).toUpperCase();

  const summarySaved = summary?.saved || {};
  const savedTutorials = useMemo(() => {
    const hookItems = Array.isArray(savedByType.tutorials) ? savedByType.tutorials : [];
    const summaryItems = Array.isArray(summarySaved.tutorials) ? summarySaved.tutorials : [];
    return hookItems.length ? hookItems : summaryItems;
  }, [savedByType.tutorials, summarySaved.tutorials]);
  const savedNotes = useMemo(() => {
    const hookItems = Array.isArray(savedByType.notes) ? savedByType.notes : [];
    const summaryItems = Array.isArray(summarySaved.notes) ? summarySaved.notes : [];
    return hookItems.length ? hookItems : summaryItems;
  }, [savedByType.notes, summarySaved.notes]);
  const savedRoadmaps = useMemo(() => {
    const hookItems = Array.isArray(savedByType.roadmaps) ? savedByType.roadmaps : [];
    const summaryItems = Array.isArray(summarySaved.roadmaps) ? summarySaved.roadmaps : [];
    return hookItems.length ? hookItems : summaryItems;
  }, [savedByType.roadmaps, summarySaved.roadmaps]);
  const totalSavedCount = savedCount || summarySaved?.ids?.length || savedIds.size;
  const savedRoadmapCount = savedRoadmaps.length;

  if (!auth?.token) {
    return <AccessPrompt />;
  }

  const stats = [
    { label: 'Available Tutorials', value: summary?.available?.tutorials ?? 0, tone: 'text-violet-300' },
    { label: 'Available Notes', value: summary?.available?.notes ?? 0, tone: 'text-emerald-300' },
    { label: 'Saved Roadmaps', value: savedRoadmapCount, tone: 'text-cyan-300' },
    { label: 'Saved Items', value: totalSavedCount, tone: 'text-amber-300' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050b13] pt-[88px] text-white selection:bg-cyan-300/20 selection:text-cyan-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.10),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(139,92,246,0.12),transparent_30%),linear-gradient(180deg,#050b13_0%,#04070d_100%)]" />

      <div className={`${shell} relative space-y-6 pb-14 pt-2`}>
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070b12]/90 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <DotGrid />
          <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-xl font-black text-white shadow-[0_8px_24px_-8px_rgba(34,211,238,0.6)] sm:h-16 sm:w-16 sm:text-2xl">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">Welcome back</p>
                <h1 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">{profileName}</h1>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-slate-300">
                    <Icon name="user" className="h-3 w-3" /> {roleLabel}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4 lg:w-auto lg:shrink-0">
              {stats.map((stat) => (
                <div key={stat.label} className="min-w-0 bg-[#070b12] px-4 py-3 sm:px-5">
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
                  <p className={`mt-1 truncate font-mono text-2xl font-bold tabular-nums ${stat.tone}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tab navigation */}
        <TabNav active={section} onChange={setSection} />

        {/* Content */}
        {section === 'overview' && (
          <div className="grid gap-6 xl:grid-cols-3">
            <ListPanel
              title="Recently Saved Tutorials"
              subtitle="From the tutorials page"
              items={savedTutorials}
              kind="tutorial"
              onOpen={() => navigate('/tutorials')}
              onViewAll={() => navigate('/tutorials')}
            />
            <ListPanel
              title="Recently Saved Notes & PDFs"
              subtitle="From the notes page"
              items={savedNotes}
              kind="note"
              onOpen={() => navigate('/notes')}
              onViewAll={() => navigate('/notes')}
            />
            <ListPanel
              title="Recently Saved Roadmaps"
              subtitle="From the roadmaps page"
              items={savedRoadmaps}
              kind="roadmap"
              onOpen={() => navigate('/roadmaps')}
              onViewAll={() => navigate('/roadmaps')}
            />
          </div>
        )}

        {section === 'tutorials' && (
          <ListPanel title="Saved Tutorials" items={savedTutorials} kind="tutorial" onOpen={() => navigate('/tutorials')} />
        )}
        {section === 'notes' && (
          <ListPanel title="Saved Notes & PDFs" items={savedNotes} kind="note" onOpen={() => navigate('/notes')} />
        )}
        {section === 'roadmaps' && (
          <ListPanel title="Saved Roadmaps" items={savedRoadmaps} kind="roadmap" onOpen={() => navigate('/roadmaps')} />
        )}

        {section === 'profile' && (
          <ProfileDossier
            initial={initial}
            profileName={profileName}
            roleLabel={roleLabel}
            profileEmail={profileEmail}
            memberSince={memberSince}
            lastLogin={lastLogin}
            savedTutorialsCount={savedTutorials.length}
            savedNotesCount={savedNotes.length}
            savedRoadmapCount={savedRoadmapCount}
            totalSavedCount={totalSavedCount}
          />
        )}
      </div>
    </div>
  );
}