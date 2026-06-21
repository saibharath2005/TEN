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
    file: <svg {...common}><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v6h5" /></svg>,
    download: <svg {...common}><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></svg>,
    eye: <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
  };

  return icons[name] || null;
}

// Converts a base64 data URL (e.g. "data:application/pdf;base64,...") into a
// Blob URL. Browsers frequently refuse to open large/base64 data: URLs in a
// new tab (silent no-op, or a blocked-popup style failure), which was why
// Preview previously did nothing. Blob URLs do not have this restriction.
function dataUrlToBlobUrl(dataUrl) {
  try {
    const [header, base64] = dataUrl.split(',');
    if (!base64) return null;

    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to convert file data for preview:', error);
    return null;
  }
}

export default function NoteCard({ item }) {
  const hasFile = Boolean(item.fileData || item.fileUrl);
  const imageSrc = item.coverImageData || item.imageData || item.imageUrl || '';

  function downloadFile() {
    if (item.fileData) {
      const anchor = document.createElement('a');
      anchor.href = item.fileData;
      anchor.download = item.fileName || `${String(item.title || 'resource').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
      anchor.click();
      return;
    }

    if (item.fileUrl) {
      const anchor = document.createElement('a');
      anchor.href = item.fileUrl;
      anchor.download = item.fileName || `${String(item.title || 'resource').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
      return;
    }

    const content = [
      item.title,
      '',
      item.description || '',
      '',
      `Type: ${item.resourceType || item.type || 'PDF'}`,
      `Category: ${item.category || 'general'}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${String(item.title || 'resource').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function previewFile() {
    // Plain remote URLs can be opened directly.
    if (item.fileUrl) {
      window.open(item.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (item.fileData) {
      // Base64 data URLs are converted to a Blob URL first — opening a
      // data: URL directly in a new tab is blocked or silently ignored by
      // most modern browsers, especially for larger files like PDFs.
      const blobUrl = dataUrlToBlobUrl(item.fileData);
      if (blobUrl) {
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
        // Release the blob URL once the new tab has had time to load it.
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      }
    }
  }

  return (
    <article className="group overflow-hidden rounded-[8px] border border-white/10 bg-[#0c1326]/88 shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-cyan-950/40">
      <div className="relative h-32 overflow-hidden bg-[#0a1024]">
        {imageSrc ? (
          <img src={imageSrc} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_60%),linear-gradient(135deg,rgba(8,16,31,0.6),rgba(2,6,23,0.94))]">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-cyan-300/10 text-xs font-bold text-cyan-300">
              PDF
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(2,6,23,0.10)_35%,rgba(2,6,23,0.72)_100%)]" />
        <span className="absolute left-3 top-3 rounded-[6px] bg-gradient-to-r from-cyan-300 to-blue-500 px-2.5 py-1.5 text-[11px] font-bold uppercase text-white shadow-lg shadow-cyan-950/40">
          {item.resourceType || item.type || item.category}
        </span>
      </div>

      <div className="flex flex-col p-4">
        <h3 className="truncate text-base font-bold leading-snug text-white">{item.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-300">{item.description}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Icon name="file" className="h-3.5 w-3.5 text-cyan-300" />
          {hasFile ? 'File attached' : 'Text summary only'}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={downloadFile}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[7px] bg-gradient-to-r from-cyan-300 to-blue-500 px-3 text-xs font-bold text-white shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5"
          >
            <Icon name="download" className="h-3.5 w-3.5" /> {hasFile ? 'Download PDF' : 'Download'}
          </button>
          <button
            type="button"
            onClick={previewFile}
            disabled={!hasFile}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[7px] border border-slate-500/50 bg-slate-950/35 px-3 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="eye" className="h-3.5 w-3.5" /> Preview
          </button>
        </div>
      </div>
    </article>
  );
}