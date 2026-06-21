import { useEffect, useMemo, useState } from 'react';
import Link from '../components/ui/Link.jsx';
import { shell } from '../components/ui/classes.js';
import { navigate } from '../hooks/useRoute.js';
import { useAuth } from '../hooks/useAuth.js';
import { apiGet } from '../services/api.js';
import { useSavedContent } from '../hooks/useSavedContent.js';

const sidebarItems = [
  { id: 'overview',  label: 'Overview' },
  { id: 'tutorials', label: 'Saved Tutorials' },
  { id: 'notes',     label: 'Saved Notes & PDFs' },
  { id: 'roadmaps',  label: 'Saved Roadmaps' },
  { id: 'profile',   label: 'Profile' },
];

const KIND_META = {
  tutorial: { label: 'Tutorial', icon: 'bookmark', tone: 'from-violet-500/30 to-fuchsia-500/10 text-violet-300', bar: 'from-violet-400 to-fuchsia-500' },
  roadmap:  { label: 'Roadmap',  icon: 'layout',   tone: 'from-cyan-400/30 to-blue-500/10 text-cyan-300',       bar: 'from-cyan-300 to-blue-500' },
  note:     { label: 'PDF',      icon: 'file',      tone: 'from-emerald-400/30 to-teal-500/10 text-emerald-300', bar: 'from-emerald-300 to-teal-500' },
};

const categoryLabels = {
  java: 'Java', sql: 'Databases', dsa: 'DSA', development: 'Web Development',
  devops: 'Cloud & DevOps', ai: 'Artificial Intelligence', ml: 'Machine Learning',
  cb: 'Cybersecurity', cs: 'Core CSE',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Open a tutorial's videoUrl directly in a new tab.
 * Tries multiple possible field names to be robust against different API shapes.
 */
function openTutorialLink(tutorial) {
  // Try all possible field names where the video URL might live
  const url = String(
    tutorial?.videoUrl ||
    tutorial?.video_url ||
    tutorial?.url ||
    tutorial?.link ||
    ''
  ).trim();

  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    console.warn('[Dashboard] Tutorial has no video URL:', tutorial);
    alert('No video link available for this tutorial.');
  }
}

/**
 * Open a note/PDF directly in a new tab.
 * Tries multiple possible field names.
 */
function openNoteLink(note) {
  // 1. Prefer a plain remote URL — fastest path
  const url = String(
    note?.fileUrl ||
    note?.file_url ||
    note?.pdfUrl ||
    note?.pdf_url ||
    note?.url ||
    note?.link ||
    ''
  ).trim();

  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // 2. Fall back to base64 fileData → Blob URL
  const b64 = String(note?.fileData || note?.file_data || note?.pdfData || '').trim();
  if (b64) {
    try {
      const raw = b64.includes(',') ? b64.split(',')[1] : b64;
      const mime = note?.mimeType || note?.fileType || note?.mime_type || 'application/pdf';
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (win) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
      }
    } catch (err) {
      console.error('[Dashboard] Could not open PDF from base64:', err);
      alert('Could not open PDF. The file data may be corrupted.');
    }
    return;
  }

  console.warn('[Dashboard] Note has no file URL or data:', note);
  alert('No PDF or file link available for this resource.');
}

// ─── Icon ─────────────────────────────────────────────────────────────────────
function Icon({ name, className = 'h-5 w-5' }) {
  const common = {
    className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
  };
  const icons = {
    layout:       <svg {...common}><path d="M4 5h6v6H4z" /><path d="M14 5h6v4h-6z" /><path d="M14 11h6v8h-6z" /><path d="M4 14h6v5H4z" /></svg>,
    bookmark:     <svg {...common}><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.4L6 20V5a1 1 0 0 1 1-1Z" /></svg>,
    file:         <svg {...common}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v6h5" /></svg>,
    user:         <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>,
    logout:       <svg {...common}><path d="M10 17l-1 1a2 2 0 0 1-2 0l-3-3a2 2 0 0 1 0-2l3-3a2 2 0 0 1 2 0l1 1" /><path d="M13 12H3" /><path d="M16 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3" /></svg>,
    chevronRight: <svg {...common}><path d="m9 18 6-6-6-6" /></svg>,
    play:         <svg {...common} fill="currentColor" stroke="none"><path d="M8 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4a1.1 1.1 0 0 0 0-1.8l-10-6.4A1 1 0 0 0 8 5.6Z" /></svg>,
    close:        <svg {...common}><path d="m6 6 12 12" /><path d="m18 6-12 12" /></svg>,
    clock:        <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>,
    modules:      <svg {...common}><path d="M5 5h6v6H5z" /><path d="M13 5h6v6h-6z" /><path d="M5 13h6v6H5z" /><path d="M13 13h6v6h-6z" /></svg>,
    target:       <svg {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m15 9 4-4" /><path d="M19 5v4h-4" /></svg>,
    check:        <svg {...common}><circle cx="12" cy="12" r="8" /><path d="m8.5 12.5 2.2 2.2 4.8-5.4" /></svg>,
    download:     <svg {...common}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>,
    eye:          <svg {...common}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>,
    arrowLeft:    <svg {...common}><path d="m15 18-6-6 6-6" /></svg>,
    externalLink: <svg {...common}><path d="M18 13v6H5V6h6" /><path d="m11 13 8-8" /><path d="M15 5h4v4" /></svg>,
  };
  return icons[name] || icons.layout;
}

// ─── DotGrid ──────────────────────────────────────────────────────────────────
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

// ─── TabNav ───────────────────────────────────────────────────────────────────
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

// ─── ListPanel (Overview rows) ────────────────────────────────────────────────
function ListPanel({ title, subtitle, items, kind, onOpenItem, onViewAll }) {
  const meta       = KIND_META[kind] || KIND_META.note;
  const emptyLabel = kind === 'tutorial' ? 'tutorials' : kind === 'roadmap' ? 'roadmaps' : 'notes';

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#070b12]/90 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[11px] text-slate-500">{items.length} saved</span>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="rounded font-mono text-[11px] uppercase tracking-[0.1em] text-violet-300 transition-colors duration-200 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
            >
              View all
            </button>
          )}
        </div>
      </header>

      {items.length ? (
        <div className="divide-y divide-white/5">
          {items.map((item) => (
            <button
              key={item._id || item.id}
              type="button"
              onClick={() => onOpenItem(item)}
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

// ─── Saved Tutorials Full Page ────────────────────────────────────────────────
function SavedTutorialsPage({ items, onOpenItem }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-white">Saved Tutorials</h2>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
          {items.length} tutorial{items.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((tutorial) => {
            // Check all possible URL fields
            const videoUrl = String(
              tutorial.videoUrl || tutorial.video_url || tutorial.url || tutorial.link || ''
            ).trim();
            const hasVideo = Boolean(videoUrl);
            const imageSrc = tutorial.imageData || tutorial.imageUrl || tutorial.image_data || tutorial.image_url || '';

            return (
              <button
                key={tutorial._id || tutorial.id}
                type="button"
                onClick={() => onOpenItem(tutorial)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#070b12]/90 text-left shadow-[0_24px_70px_rgba(0,0,0,0.35)] transition-all duration-200 hover:border-violet-400/30 hover:shadow-[0_24px_70px_rgba(124,58,237,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.22),rgba(2,6,23,0.96)_62%)]">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={tutorial.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-sky-400 to-violet-600 text-white shadow-[0_0_40px_rgba(124,58,237,0.45)]">
                        <Icon name="play" className="h-6 w-6 translate-x-0.5" />
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-transparent to-transparent opacity-60" />

                  {/* Play overlay on hover */}
                  {hasVideo && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-sky-400 to-violet-600 text-white shadow-[0_0_40px_rgba(124,58,237,0.6)]">
                        <Icon name="play" className="h-6 w-6 translate-x-0.5" />
                      </span>
                    </div>
                  )}

                  <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm ${hasVideo ? 'bg-red-600/80 text-white' : 'bg-black/60 text-slate-400'}`}>
                    {hasVideo ? 'YouTube' : 'No Video'}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">
                    {categoryLabels[tutorial.category] || tutorial.category || 'Tutorial'}
                  </p>
                  <h3 className="line-clamp-2 text-sm font-bold text-white">{tutorial.title}</h3>
                  <p className="line-clamp-2 text-xs leading-5 text-slate-400">{tutorial.description || 'Saved tutorial'}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2 text-[11px] text-slate-500">
                    {tutorial.level    && <span>{tutorial.level}</span>}
                    {tutorial.duration && <span>· {tutorial.duration}</span>}
                    {tutorial.lessons  ? <span>· {tutorial.lessons} lessons</span> : null}
                    {tutorial.instructor && <span>· {tutorial.instructor}</span>}
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className={`flex items-center justify-between border-t border-white/5 px-4 py-3 ${hasVideo ? 'text-violet-300' : 'text-slate-600'}`}>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest">
                    {hasVideo ? (
                      <>
                        <Icon name="externalLink" className="h-3.5 w-3.5" />
                        Open on YouTube
                      </>
                    ) : (
                      'No video link'
                    )}
                  </span>
                  <Icon name="chevronRight" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#070b12]/90 px-5 py-16 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
            <Icon name="bookmark" className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-400">No saved tutorials yet.</p>
          <p className="mt-1 text-xs text-slate-600">Head to the Tutorials page and bookmark ones you like.</p>
        </div>
      )}
    </div>
  );
}

// ─── Saved Notes Full Page ────────────────────────────────────────────────────
function SavedNotesPage({ items, onOpenItem }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-white">Saved Notes & PDFs</h2>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
          {items.length} resource{items.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((note) => {
            // Check all possible file URL fields
            const fileUrl = String(
              note.fileUrl || note.file_url || note.pdfUrl || note.pdf_url || note.url || note.link || ''
            ).trim();
            const hasFile = Boolean(fileUrl) || Boolean(note.fileData || note.file_data || note.pdfData || '');
            const coverSrc = note.coverImageData || note.coverImageUrl || note.imageData || note.imageUrl || note.cover_image || '';

            // Badge label
            const badgeLabel = hasFile
              ? String(note.fileType || note.mimeType || note.file_type || 'PDF')
                  .replace('application/', '')
                  .toUpperCase()
              : 'No File';

            return (
              <button
                key={note._id || note.id}
                type="button"
                onClick={() => onOpenItem(note)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#070b12]/90 text-left shadow-[0_24px_70px_rgba(0,0,0,0.35)] transition-all duration-200 hover:border-emerald-400/30 hover:shadow-[0_24px_70px_rgba(16,185,129,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              >
                {/* Cover */}
                <div className="relative aspect-video w-full overflow-hidden bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),rgba(2,6,23,0.96)_62%)]">
                  {coverSrc ? (
                    <img
                      src={coverSrc}
                      alt={note.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                        <Icon name="file" className="h-6 w-6" />
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-transparent to-transparent opacity-60" />

                  {/* Open overlay on hover */}
                  {hasFile && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                        <Icon name="externalLink" className="h-6 w-6" />
                      </span>
                    </div>
                  )}

                  <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm ${hasFile ? 'bg-emerald-600/80 text-white' : 'bg-black/60 text-slate-400'}`}>
                    {badgeLabel}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                    {note.type || note.resourceType || note.language || 'Resource'}
                  </p>
                  <h3 className="line-clamp-2 text-sm font-bold text-white">{note.title}</h3>
                  <p className="line-clamp-2 text-xs leading-5 text-slate-400">{note.description || note.desc || 'Saved resource'}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2 text-[11px] text-slate-500">
                    {note.pages    ? <span>{note.pages} pages</span>  : null}
                    {note.author   && <span>· {note.author}</span>}
                    {note.readTime && <span>· {note.readTime}</span>}
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className={`flex items-center justify-between border-t border-white/5 px-4 py-3 ${hasFile ? 'text-emerald-300' : 'text-slate-600'}`}>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest">
                    {hasFile ? (
                      <>
                        <Icon name="externalLink" className="h-3.5 w-3.5" />
                        Open PDF
                      </>
                    ) : (
                      'No file link'
                    )}
                  </span>
                  <Icon name="chevronRight" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#070b12]/90 px-5 py-16 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300">
            <Icon name="file" className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-400">No saved notes or PDFs yet.</p>
          <p className="mt-1 text-xs text-slate-600">Browse the Notes page and save resources you want to revisit.</p>
        </div>
      )}
    </div>
  );
}

// ─── Saved Roadmaps Full Page ─────────────────────────────────────────────────
function SavedRoadmapsPage({ items, onOpenItem }) {
  const toneMap = {
    violet:  { bar: 'from-violet-400 to-fuchsia-500',  badge: 'border-violet-300/20 bg-violet-300/10 text-violet-200',   glow: 'hover:shadow-[0_24px_70px_rgba(124,58,237,0.15)] hover:border-violet-400/30' },
    cyan:    { bar: 'from-cyan-300 to-blue-500',        badge: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200',         glow: 'hover:shadow-[0_24px_70px_rgba(34,211,238,0.12)] hover:border-cyan-400/30' },
    blue:    { bar: 'from-blue-400 to-indigo-500',      badge: 'border-blue-300/20 bg-blue-300/10 text-blue-200',         glow: 'hover:shadow-[0_24px_70px_rgba(59,130,246,0.12)] hover:border-blue-400/30' },
    emerald: { bar: 'from-emerald-300 to-teal-500',     badge: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',glow: 'hover:shadow-[0_24px_70px_rgba(16,185,129,0.12)] hover:border-emerald-400/30' },
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-white">Saved Roadmaps</h2>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
          {items.length} roadmap{items.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((roadmap) => {
            const tone       = roadmap.tone || 'violet';
            const colors     = toneMap[tone] || toneMap.violet;
            const tag        = roadmap.tag || roadmap.level || 'Beginner to Advanced';
            const modules    = roadmap.modules || 0;
            const duration   = roadmap.duration || (modules ? `${modules} Modules` : '—');
            const difficulty = roadmap.difficulty || roadmap.level || 'Beginner';
            const outcomes   = Array.isArray(roadmap.outcomes) ? roadmap.outcomes.slice(0, 3) : [];

            return (
              <button
                key={roadmap._id || roadmap.id || roadmap.slug || roadmap.title}
                type="button"
                onClick={() => onOpenItem(roadmap)}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#070b12]/90 text-left shadow-[0_24px_70px_rgba(0,0,0,0.35)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${colors.glow}`}
              >
                <div className={`h-1 w-full bg-gradient-to-r ${colors.bar}`} />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">{tag}</p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold text-white">{roadmap.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-400">{roadmap.description || roadmap.desc || 'Saved roadmap'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: 'clock',   val: duration },
                      { icon: 'modules', val: modules ? `${modules} mod.` : '—' },
                      { icon: 'target',  val: difficulty },
                    ].map(({ icon, val }) => (
                      <div key={icon} className="flex flex-col items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.025] px-1 py-2">
                        <Icon name={icon} className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate text-center font-mono text-[9px] text-slate-400">{val}</span>
                      </div>
                    ))}
                  </div>
                  {outcomes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {outcomes.map((o) => (
                        <span key={o} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${colors.badge}`}>{o}</span>
                      ))}
                      {roadmap.outcomes?.length > 3 && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">+{roadmap.outcomes.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">View roadmap</span>
                  <Icon name="chevronRight" className="h-4 w-4 text-slate-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#070b12]/90 px-5 py-16 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-cyan-500/10 text-cyan-300">
            <Icon name="layout" className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-400">No saved roadmaps yet.</p>
          <p className="mt-1 text-xs text-slate-600">Browse the Roadmaps page and save the paths you want to follow.</p>
        </div>
      )}
    </div>
  );
}

// ─── ProfileDossier ───────────────────────────────────────────────────────────
function ProfileDossier({ initial, profileName, roleLabel, profileEmail, memberSince, lastLogin, savedTutorialsCount, savedNotesCount, savedRoadmapCount, totalSavedCount }) {
  const rows = [
    { label: 'Full name',         value: profileName },
    { label: 'Email address',     value: profileEmail },
    { label: 'Role',              value: roleLabel },
    { label: 'Member since',      value: memberSince },
    { label: 'Last login',        value: lastLogin },
    { label: 'Saved tutorials',   value: savedTutorialsCount },
    { label: 'Saved notes',       value: savedNotesCount },
    { label: 'Saved roadmaps',    value: savedRoadmapCount },
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

// ─── AccessPrompt ─────────────────────────────────────────────────────────────
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
              <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-[9px] border border-cyan-300/60 px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-cyan-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50">
                Login
              </Link>
              <Link href="/signup" className="inline-flex h-11 items-center justify-center rounded-[9px] bg-gradient-to-r from-cyan-300 to-violet-500 px-5 text-sm font-medium text-slate-950 transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Roadmap Metric ───────────────────────────────────────────────────────────
function Metric({ icon, label, value, tone }) {
  const colors = { violet: 'text-violet-300', cyan: 'text-cyan-300', blue: 'text-blue-300', emerald: 'text-emerald-300' };
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

// ─── Roadmap Detail Modal ─────────────────────────────────────────────────────
function RoadmapDetailModal({ roadmap, saved, onClose, onToggleSave }) {
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const steps      = Array.isArray(roadmap.steps) ? roadmap.steps : String(roadmap.steps || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const outcomes   = Array.isArray(roadmap.outcomes) ? roadmap.outcomes : [];
  const duration   = roadmap.duration || `${roadmap.modules || 0} Modules`;
  const modules    = roadmap.modules || 0;
  const difficulty = roadmap.difficulty || roadmap.level || 'Beginner';
  const tag        = roadmap.tag || roadmap.level || 'Beginner to Advanced';
  const tone       = roadmap.tone || 'violet';
  const desc       = roadmap.description || roadmap.desc || '';

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${roadmap.title} details`}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto scrollbar-hide rounded-[8px] border border-white/10 bg-[#0b1226] shadow-2xl shadow-black">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#0b1226]/95 p-5 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{tag}</p>
            <h2 className="mt-1 text-2xl font-black text-white">{roadmap.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-white/10 text-slate-200 transition hover:bg-white/10">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm leading-6 text-slate-300">{desc}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Metric icon="clock"   label="Duration"   value={duration}   tone={tone} />
            <Metric icon="modules" label="Modules"    value={modules}    tone={tone} />
            <Metric icon="target"  label="Difficulty" value={difficulty} tone={tone} />
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-black uppercase text-white">Complete Learning Path</h3>
            <div className="mt-4 space-y-3">
              {steps.map((step, i) => (
                <div key={step} className="rounded-[8px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-bold text-white">Phase {i + 1}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
          {outcomes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-black uppercase text-white">Skills You Build</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {outcomes.map((o) => (
                  <span key={o} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-200">{o}</span>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => onToggleSave(roadmap._id || roadmap.id || roadmap.slug || roadmap.title)}
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function UserDashboard() {
  const auth = useAuth();
  const { savedByType, savedCount, savedIds, toggleSaved, refresh } = useSavedContent(auth?.token);
  const [summary, setSummary]             = useState(null);
  const [section, setSection]             = useState('overview');
  const [activeRoadmap, setActiveRoadmap] = useState(null);

  useEffect(() => {
    if (!auth?.token) return;
    apiGet('/dashboard/summary', auth.token).then(setSummary).catch(() => setSummary(null));
  }, [auth?.token]);

  useEffect(() => {
    if (!auth?.token) return;
    refresh();
  }, [auth?.token, refresh]);

  const profileName  = summary?.profile?.name  || auth?.user?.name  || 'User';
  const profileEmail = summary?.profile?.email || auth?.user?.email || 'user@example.com';
  const roleLabel    = auth?.user?.role === 'admin' ? 'Administrator' : 'Learner';
  const memberSince  = summary?.activity?.memberSince || summary?.profile?.createdAt || auth?.loggedInAt || '';
  const lastLogin    = summary?.activity?.lastLogin   || summary?.profile?.updatedAt || auth?.loggedInAt || '';
  const initial      = (profileName || 'U').slice(0, 1).toUpperCase();

  const summarySaved = summary?.saved || {};

  const savedTutorials = useMemo(() => {
    const h = Array.isArray(savedByType.tutorials) ? savedByType.tutorials : [];
    const s = Array.isArray(summarySaved.tutorials) ? summarySaved.tutorials : [];
    return h.length ? h : s;
  }, [savedByType.tutorials, summarySaved.tutorials]);

  const savedNotes = useMemo(() => {
    const h = Array.isArray(savedByType.notes) ? savedByType.notes : [];
    const s = Array.isArray(summarySaved.notes) ? summarySaved.notes : [];
    return h.length ? h : s;
  }, [savedByType.notes, summarySaved.notes]);

  const savedRoadmaps = useMemo(() => {
    const h = Array.isArray(savedByType.roadmaps) ? savedByType.roadmaps : [];
    const s = Array.isArray(summarySaved.roadmaps) ? summarySaved.roadmaps : [];
    return h.length ? h : s;
  }, [savedByType.roadmaps, summarySaved.roadmaps]);

  const totalSavedCount   = savedCount || summarySaved?.ids?.length || savedIds.size;
  const savedRoadmapCount = savedRoadmaps.length;

  const toggleSave = async (id) => {
    if (!auth?.token) { navigate('/login'); return; }
    try { await toggleSaved(id); } catch { navigate('/login'); }
  };

  // ── Open handlers ────────────────────────────────────────────────────────────

  // Tutorial → open videoUrl in new tab
  const handleOpenTutorial = (tutorial) => openTutorialLink(tutorial);

  // Note/PDF → open fileUrl or render base64 blob in new tab
  const handleOpenNote = (note) => openNoteLink(note);

  // Roadmap → open detail modal
  const handleOpenRoadmap = (roadmap) => setActiveRoadmap(roadmap);

  if (!auth?.token) return <AccessPrompt />;

  const stats = [
    { label: 'Available Tutorials', value: summary?.available?.tutorials ?? 0, tone: 'text-violet-300' },
    { label: 'Available Notes',     value: summary?.available?.notes     ?? 0, tone: 'text-emerald-300' },
    { label: 'Saved Roadmaps',      value: savedRoadmapCount,                  tone: 'text-cyan-300' },
    { label: 'Saved Items',         value: totalSavedCount,                    tone: 'text-amber-300' },
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

        {/* Tab Navigation */}
        <TabNav active={section} onChange={setSection} />

        {/* Overview */}
        {section === 'overview' && (
          <div className="grid gap-6 xl:grid-cols-3">
            <ListPanel
              title="Recently Saved Tutorials"
              subtitle="Click any item to open on YouTube"
              items={savedTutorials.slice(0, 5)}
              kind="tutorial"
              onOpenItem={handleOpenTutorial}
              onViewAll={() => setSection('tutorials')}
            />
            <ListPanel
              title="Recently Saved Notes & PDFs"
              subtitle="Click any item to open the PDF"
              items={savedNotes.slice(0, 5)}
              kind="note"
              onOpenItem={handleOpenNote}
              onViewAll={() => setSection('notes')}
            />
            <ListPanel
              title="Recently Saved Roadmaps"
              subtitle="Click any item to view details"
              items={savedRoadmaps.slice(0, 5)}
              kind="roadmap"
              onOpenItem={handleOpenRoadmap}
              onViewAll={() => setSection('roadmaps')}
            />
          </div>
        )}

        {/* Full Saved Tutorials */}
        {section === 'tutorials' && (
          <SavedTutorialsPage items={savedTutorials} onOpenItem={handleOpenTutorial} />
        )}

        {/* Full Saved Notes */}
        {section === 'notes' && (
          <SavedNotesPage items={savedNotes} onOpenItem={handleOpenNote} />
        )}

        {/* Full Saved Roadmaps */}
        {section === 'roadmaps' && (
          <SavedRoadmapsPage items={savedRoadmaps} onOpenItem={handleOpenRoadmap} />
        )}

        {/* Profile */}
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

      {/* Roadmap detail modal */}
      {activeRoadmap && (
        <RoadmapDetailModal
          roadmap={activeRoadmap}
          saved={savedIds.has(activeRoadmap._id || activeRoadmap.id || activeRoadmap.slug || activeRoadmap.title)}
          onClose={() => setActiveRoadmap(null)}
          onToggleSave={toggleSave}
        />
      )}
    </div>
  );
}