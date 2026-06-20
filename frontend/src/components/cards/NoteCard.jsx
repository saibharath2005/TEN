import { buttonPrimary, buttonSecondary, glass } from '../ui/classes.js';

export default function NoteCard({ item }) {
  const hasFile = Boolean(item.fileData || item.fileUrl);

  function downloadFile() {
    if (item.fileData) {
      const anchor = document.createElement('a');
      anchor.href = item.fileData;
      anchor.download = item.fileName || `${String(item.title || 'resource').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
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
    const source = item.fileData || item.fileUrl;
    if (source) {
      window.open(source, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <article className={`${glass} flex min-h-72 flex-col`}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-cyan-300/10 text-sm font-bold text-cyan-300">PDF</div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-300">{item.resourceType || item.type || item.category}</span>
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{item.title}</h3>
      <p className="mb-5 flex-1 text-sm leading-6 text-neutral-400">{item.description}</p>
      <div className="mb-5 flex flex-wrap gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-xs text-neutral-400">
        <span>{item.pages || 10} pages</span>
        <span>{item.category}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={downloadFile} className={`${buttonPrimary} px-3 py-2 text-sm`}>
          {hasFile ? 'Download PDF' : 'Download'}
        </button>
        <button type="button" onClick={previewFile} className={`${buttonSecondary} px-3 py-2 text-sm`} disabled={!hasFile}>
          Preview
        </button>
      </div>
    </article>
  );
}
