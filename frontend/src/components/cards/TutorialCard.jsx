function Icon({ name, className = 'h-4 w-4' }) {
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
    bookmark: <svg {...common}><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.4L6 20V5a1 1 0 0 1 1-1Z" /></svg>,
    chart: <svg {...common}><path d="M4 19V10" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19H2" /></svg>,
    calendar: <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 10h18" /></svg>,
    play: <svg {...common} fill="currentColor" stroke="none"><path d="M8 5v14l11-7Z" /></svg>,
  };

  return icons[name] || null;
}

export default function TutorialCard({ item }) {
  const imageSrc = item.imageData || item.imageUrl || '';
  const level = item.level || 'Beginner';
  const levelColor = level === 'Advanced' ? 'text-orange-400' : level === 'Intermediate' ? 'text-sky-400' : 'text-emerald-400';

  const openVideo = () => {
    const url = String(item.videoUrl || '').trim();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <article className="group overflow-hidden rounded-[8px] border border-white/10 bg-[#0c1326]/88 shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-violet-400/50 hover:shadow-violet-950/40">
      <div className="relative h-40 overflow-hidden bg-[#0a1024]">
        {imageSrc ? (
          <img src={imageSrc} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,58,237,0.18),transparent_32%),radial-gradient(circle_at_74%_72%,rgba(14,165,233,0.16),transparent_40%),linear-gradient(135deg,rgba(59,7,100,0.45),rgba(2,6,23,0.9))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(2,6,23,0.10)_35%,rgba(2,6,23,0.72)_100%)]" />
        <span className="absolute left-4 top-4 rounded-[6px] bg-gradient-to-r from-sky-400 to-violet-600 px-3 py-2 text-xs font-bold uppercase text-white shadow-lg shadow-violet-950/40">
          {item.category}
        </span>
        {!imageSrc && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="rounded-[10px] border border-white/10 bg-black/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              No image uploaded
            </div>
          </div>
        )}
        <span className="absolute bottom-4 right-4 rounded-[6px] bg-black/75 px-3 py-1.5 text-xs font-bold text-white">
          {item.duration || '30 min'}
        </span>
      </div>

      <div className="flex min-h-[235px] flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-white">{item.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{item.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className={`inline-flex items-center gap-1.5 ${levelColor}`}>
            <Icon name="chart" className="h-4 w-4" />
            {level}
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span className="inline-flex items-center gap-1.5">
            <Icon name="calendar" className="h-4 w-4" />
            {item.status || 'published'}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_52px] gap-3">
          <button
            type="button"
            onClick={openVideo}
            disabled={!item.videoUrl}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-gradient-to-r from-sky-400 to-violet-600 px-4 text-sm font-bold text-white shadow-lg shadow-sky-950/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="play" className="h-4 w-4" /> {item.videoUrl ? 'Watch Now' : 'No Video'}
          </button>
          <button
            type="button"
            aria-label="Save tutorial"
            className="grid h-11 place-items-center rounded-[7px] border border-slate-500/50 bg-slate-950/35 text-slate-200 transition hover:bg-white/10"
          >
            <Icon name="bookmark" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}