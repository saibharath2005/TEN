import { glass, input } from './classes.js';

export default function FilterBar({ type, query, setQuery, filter, setFilter, options = [] }) {
  const values = ['all', ...options.filter(Boolean)];

  return (
    <div className={`${glass} flex flex-col gap-5 md:flex-row md:items-center md:justify-between`}>
      <div className="relative w-full md:max-w-sm">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">Search</span>
        <input
          className={`${input} pl-20`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${type}...`}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((option) => (
          <button
            key={option}
            type="button"
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${filter === option ? 'border-transparent bg-gradient-to-r from-cyan-300 to-violet-500 text-black' : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/10'}`}
            onClick={() => setFilter(option)}
          >
            {option === 'all' ? 'All' : option}
          </button>
        ))}
      </div>
    </div>
  );
}
