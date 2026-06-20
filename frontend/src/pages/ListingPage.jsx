import { useMemo, useState } from 'react';
import ContentGrid from '../components/ui/ContentGrid.jsx';
import FilterBar from '../components/ui/FilterBar.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { shell } from '../components/ui/classes.js';
import { useApiCollection } from '../hooks/useApiCollection.js';

export default function ListingPage({ title, accent, subtitle, type }) {
  const { items, loading } = useApiCollection(type);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filterOptions = useMemo(() => {
    return Array.from(new Set(items.map((item) => String(item.category || '').toLowerCase()).filter(Boolean))).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesFilter = filter === 'all' || String(item.category || '').toLowerCase() === filter;
      const matchesQuery = JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, items, query]);

  return (
    <>
      <PageHeader title={title} accent={accent} subtitle={subtitle} />
      <section className="py-5">
        <div className={shell}>
          <FilterBar type={type} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} options={filterOptions} />
        </div>
      </section>
      <section className="py-10">
        <div className={shell}>
          {loading ? (
            <ContentGrid type={type} items={[]} emptyTitle="Loading..." />
          ) : (
            <ContentGrid type={type} items={filtered} emptyTitle={`No ${type} Available Yet`} />
          )}
        </div>
      </section>
    </>
  );
}
