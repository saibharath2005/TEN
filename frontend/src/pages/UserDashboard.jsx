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

function InfoLine({ label, value }) {
  return (
    <div className="rounded-[10px] border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <strong className="mt-1 block text-sm font-semibold text-white">{value || '-'}</strong>
    </div>
  );
}

function SavedRow({ kind, item, onOpen, savedOn }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-[10px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-cyan-300/30 hover:bg-white/[0.06]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-violet-500/20 to-cyan-500/10 text-violet-300">
        <Icon name={kind === 'tutorial' ? 'bookmark' : 'file'} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-violet-300">
          {kind === 'tutorial' ? 'Tutorial' : kind === 'roadmap' ? 'Roadmap' : 'PDF'}
        </span>
        <strong className="block truncate text-sm text-white">{item.title}</strong>
        <p className="mt-1 truncate text-xs leading-5 text-slate-400">{item.description || item.desc || 'Saved content'}</p>
      </div>
      <div className="shrink-0 text-right text-[11px] text-slate-400">
        <span className="block">Saved on</span>
        <span className="block text-slate-300">{savedOn}</span>
      </div>
      <Icon name="chevronRight" className="h-4 w-4 text-slate-500" />
    </button>
  );
}

function AccessPrompt() {
  return (
    <div className="relative min-h-[calc(100vh-72px)] bg-[#050b13] pt-[88px] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_26%),radial-gradient(circle_at_80%_15%,rgba(124,58,237,0.10),transparent_24%),linear-gradient(180deg,#050b13_0%,#04070d_100%)]" />
      <div className={`${shell} relative flex min-h-[calc(100vh-160px)] items-center justify-center`}>
        <div className="w-full max-w-xl rounded-[12px] border border-white/10 bg-[#070b12]/95 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <h1 className="text-3xl font-black text-white">Dashboard Access</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
            Login to view your saved tutorials, notes, and roadmap overview.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-[9px] border border-cyan-300/60 px-5 text-sm font-medium text-white">
              Login
            </Link>
            <Link href="/signup" className="inline-flex h-11 items-center justify-center rounded-[9px] bg-gradient-to-r from-cyan-300 to-violet-500 px-5 text-sm font-medium text-slate-950">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const auth = useAuth();
  const { savedItems, savedIds } = useSavedContent(auth?.token);
  const [summary, setSummary] = useState(null);
  const [section, setSection] = useState('overview');

  useEffect(() => {
    if (!auth?.token) return;
    apiGet('/dashboard/summary', auth.token)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [auth?.token]);

  const profileName = summary?.profile?.name || auth?.user?.name || 'User';
  const profileEmail = summary?.profile?.email || auth?.user?.email || 'user@example.com';
  const roleLabel = auth?.user?.role === 'admin' ? 'Administrator' : 'Learner';
  const memberSince = summary?.activity?.memberSince || summary?.profile?.createdAt || auth?.loggedInAt || '';
  const lastLogin = summary?.activity?.lastLogin || summary?.profile?.updatedAt || auth?.loggedInAt || '';
  const initial = (profileName || 'U').slice(0, 1).toUpperCase();

  const summarySaved = summary?.saved || {};
  const savedTutorials = useMemo(() => {
    const summaryItems = Array.isArray(summarySaved.tutorials) ? summarySaved.tutorials : [];
    return summaryItems.length ? summaryItems : savedItems.filter((item) => item.type === 'tutorials');
  }, [savedItems, summarySaved.tutorials]);
  const savedNotes = useMemo(() => {
    const summaryItems = Array.isArray(summarySaved.notes) ? summarySaved.notes : [];
    return summaryItems.length ? summaryItems : savedItems.filter((item) => item.type === 'notes');
  }, [savedItems, summarySaved.notes]);
  const savedRoadmaps = useMemo(() => {
    const summaryItems = Array.isArray(summarySaved.roadmaps) ? summarySaved.roadmaps : [];
    return summaryItems.length ? summaryItems : savedItems.filter((item) => item.type === 'roadmaps');
  }, [savedItems, summarySaved.roadmaps]);
  const savedCount = savedItems.length || summarySaved?.ids?.length || savedIds.size;
  const savedRoadmapCount = savedRoadmaps.length;

  if (!auth?.token) {
    return <AccessPrompt />;
  }

  const stats = [
    { label: 'Available Tutorials', value: summary?.available?.tutorials ?? 0 },
    { label: 'Available Notes', value: summary?.available?.notes ?? 0 },
    { label: 'Saved Roadmaps', value: savedRoadmapCount },
    { label: 'Saved Items', value: savedCount },
  ];

  return (
    <div className="relative min-h-screen bg-[#050b13] pt-[88px] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.10),transparent_26%),linear-gradient(180deg,#050b13_0%,#04070d_100%)]" />
      <div className={`${shell} relative grid gap-6 pb-8 xl:grid-cols-[220px_minmax(0,1fr)_280px]`}>
        <aside className="rounded-[10px] border border-white/10 bg-[#070b12]/90 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[12px] bg-cyan-300/10 text-cyan-300">
              <Icon name="layout" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Dashboard</p>
              <h2 className="text-base font-black text-white">Learning Hub</h2>
            </div>
          </div>

          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`flex w-full items-center gap-3 rounded-[10px] border px-4 py-3 text-left text-sm font-semibold transition ${section === item.id ? 'border-cyan-300/20 bg-white/10 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white'}`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <section className="rounded-[10px] border border-white/10 bg-[#070b12]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Welcome Back, {profileName}</h1>
                <p className="mt-1 text-sm text-slate-400">Continue learning and grow your skills.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[10px] border border-white/10 bg-white/[0.03] p-4">
                  <strong className="block text-2xl font-black text-white">{stat.value}</strong>
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>

          {section === 'overview' && (
            <section className="grid gap-6 xl:grid-cols-3">
              <article className="rounded-[10px] border border-white/10 bg-[#070b12]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-white">Recently Saved Tutorials</h2>
                    <p className="mt-1 text-xs text-slate-400">Items saved from the tutorials page</p>
                  </div>
                  <button type="button" onClick={() => navigate('/tutorials')} className="text-sm font-medium text-violet-300 transition hover:text-cyan-300">
                    View All
                  </button>
                </div>
                <div className="grid gap-3">
                  {savedTutorials.length ? savedTutorials.map((item) => <SavedRow key={item._id} kind="tutorial" item={item} savedOn="Recently" onOpen={() => navigate('/tutorials')} />) : <EmptyState label="No saved tutorials yet." />}
                </div>
              </article>

              <article className="rounded-[10px] border border-white/10 bg-[#070b12]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-white">Recently Saved Notes &amp; PDFs</h2>
                    <p className="mt-1 text-xs text-slate-400">Items saved from the notes page</p>
                  </div>
                  <button type="button" onClick={() => navigate('/notes')} className="text-sm font-medium text-violet-300 transition hover:text-cyan-300">
                    View All
                  </button>
                </div>
                <div className="grid gap-3">
                  {savedNotes.length ? savedNotes.map((item) => <SavedRow key={item._id} kind="note" item={item} savedOn="Recently" onOpen={() => navigate('/notes')} />) : <EmptyState label="No saved notes yet." />}
                </div>
              </article>

              <article className="rounded-[10px] border border-white/10 bg-[#070b12]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-white">Recently Saved Roadmaps</h2>
                    <p className="mt-1 text-xs text-slate-400">Items saved from the roadmaps page</p>
                  </div>
                  <button type="button" onClick={() => navigate('/roadmaps')} className="text-sm font-medium text-violet-300 transition hover:text-cyan-300">
                    View All
                  </button>
                </div>
                <div className="grid gap-3">
                  {savedRoadmaps.length ? savedRoadmaps.map((item) => <SavedRow key={item._id} kind="roadmap" item={item} savedOn="Recently" onOpen={() => navigate('/roadmaps')} />) : <EmptyState label="No saved roadmaps yet." />}
                </div>
              </article>
            </section>
          )}

          {section === 'tutorials' && <SavedSection title="Saved Tutorials" items={savedTutorials} onOpen={() => navigate('/tutorials')} kind="tutorial" />}
          {section === 'notes' && <SavedSection title="Saved Notes &amp; PDFs" items={savedNotes} onOpen={() => navigate('/notes')} kind="note" />}
          {section === 'roadmaps' && <SavedSection title="Saved Roadmaps" items={savedRoadmaps} onOpen={() => navigate('/roadmaps')} kind="roadmap" />}

          {section === 'profile' && (
            <section className="rounded-[10px] border border-white/10 bg-[#070b12]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
              <h2 className="mb-4 text-lg font-black text-white">Profile Overview</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoLine label="Full Name" value={profileName} />
                <InfoLine label="Email Address" value={profileEmail} />
                <InfoLine label="Member Since" value={memberSince} />
                <InfoLine label="Last Login" value={lastLogin} />
                <InfoLine label="Role" value={roleLabel} />
                <InfoLine label="Saved Items" value={savedCount} />
                <InfoLine label="Saved Roadmaps" value={savedRoadmapCount} />
              </div>
            </section>
          )}
        </main>

        <aside className="rounded-[10px] border border-white/10 bg-[#070b12]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-4xl font-black text-white">
              {initial}
            </div>
            <h2 className="mt-4 text-xl font-black text-white">{profileName}</h2>
            <p className="mt-1 text-sm text-cyan-300">{roleLabel}</p>
          </div>

          <div className="mt-6 space-y-4">
            <InfoLine label="Email Address" value={profileEmail} />
            <InfoLine label="Member Since" value={memberSince} />
            <InfoLine label="Last Login" value={lastLogin} />
            <InfoLine label="Saved Tutorials" value={savedTutorials.length} />
            <InfoLine label="Saved Notes" value={savedNotes.length} />
            <InfoLine label="Saved Roadmaps" value={savedRoadmapCount} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-[10px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}

function SavedSection({ title, items, kind, onOpen }) {
  return (
    <section className="rounded-[10px] border border-white/10 bg-[#070b12]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-white">{title}</h2>
        <span className="text-sm text-slate-400">{items.length} saved</span>
      </div>
      <div className="grid gap-3">
        {items.length ? items.map((item) => <SavedRow key={item._id} kind={kind} item={item} savedOn="Recently" onOpen={onOpen} />) : <EmptyState label={`No saved ${kind === 'tutorial' ? 'tutorials' : kind === 'roadmap' ? 'roadmaps' : 'notes'} yet.`} />}
      </div>
    </section>
  );
}
