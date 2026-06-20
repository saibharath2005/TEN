import { useMemo } from 'react';
import ContentGrid from '../components/ui/ContentGrid.jsx';
import Link from '../components/ui/Link.jsx';
import SectionHeader from '../components/ui/SectionHeader.jsx';
import { buttonPrimary, buttonSecondary, glass, gradientText, shell } from '../components/ui/classes.js';
import { useApiCollection } from '../hooks/useApiCollection.js';

function Stat({ value, label }) {
  return (
    <div className="rounded-[10px] border border-white/10 bg-white/[0.03] p-5 text-center">
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

function RoadmapPreviewCard({ roadmap }) {
  const steps = Array.isArray(roadmap.steps) ? roadmap.steps : [];
  return (
    <article className="rounded-[8px] border border-white/10 bg-[#0b1226]/86 p-5 shadow-2xl shadow-black/25">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">{roadmap.level || 'Roadmap'}</p>
          <h3 className="mt-1 text-lg font-black text-white">{roadmap.title}</h3>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[11px] font-bold text-cyan-200">
          {roadmap.modules || 0} modules
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{roadmap.description || roadmap.desc}</p>
      <div className="mt-4 space-y-2">
        {steps.slice(0, 3).map((step, index) => (
          <div key={`${roadmap._id}-${index}`} className="rounded-[8px] border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
            {step}
          </div>
        ))}
      </div>
    </article>
  );
}

export default function Home() {
  const tutorials = useApiCollection('tutorials');
  const notes = useApiCollection('notes');
  const roadmaps = useApiCollection('roadmaps');

  const stats = useMemo(() => ([
    { value: tutorials.items.length, label: 'Tutorials' },
    { value: notes.items.length, label: 'Notes & PDFs' },
    { value: roadmaps.items.length, label: 'Roadmaps' },
  ]), [notes.items.length, roadmaps.items.length, tutorials.items.length]);

  const featuredTutorials = tutorials.items.slice(0, 3);
  const featuredNotes = notes.items.slice(0, 3);
  const featuredRoadmaps = roadmaps.items.slice(0, 2);

  return (
    <>
      <section className="relative overflow-hidden pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(124,58,237,0.10),transparent_24%),linear-gradient(180deg,#050b13_0%,#04070d_100%)]" />
        <div className={`${shell} relative py-16 text-center`}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Live content from the admin dashboard
            </div>
            <h1 className="text-5xl font-black leading-tight text-white md:text-6xl">
              Learn with <span className={gradientText}>dynamic tutorials, notes, and roadmaps</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              Every card on this site is loaded from the database, so the homepage always reflects the latest content the admin has published.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/tutorials" className={buttonPrimary}>Browse Tutorials</Link>
              <Link href="/notes" className={buttonSecondary}>Open Notes Library</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className={shell}>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => <Stat key={stat.label} value={stat.value} label={stat.label} />)}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className={shell}>
          <SectionHeader title="Latest" accent="Tutorials" subtitle="Fresh tutorial cards pulled directly from the backend." />
          <ContentGrid type="tutorials" items={featuredTutorials} emptyTitle="No tutorials published yet" />
        </div>
      </section>

      <section className="py-16">
        <div className={shell}>
          <SectionHeader title="Latest" accent="Notes & PDFs" subtitle="Downloadable notes and PDFs managed by the admin." />
          <ContentGrid type="notes" items={featuredNotes} emptyTitle="No notes published yet" />
        </div>
      </section>

      <section className="py-16">
        <div className={shell}>
          <SectionHeader title="Latest" accent="Roadmaps" subtitle="Structured learning paths from the live content collection." />
          {featuredRoadmaps.length ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {featuredRoadmaps.map((roadmap) => <RoadmapPreviewCard key={roadmap._id} roadmap={roadmap} />)}
            </div>
          ) : (
            <div className={`${glass} py-14 text-center text-slate-400`}>No roadmaps published yet.</div>
          )}
        </div>
      </section>
    </>
  );
}
