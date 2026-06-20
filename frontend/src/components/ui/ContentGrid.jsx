import NoteCard from '../cards/NoteCard.jsx';
import TutorialCard from '../cards/TutorialCard.jsx';
import EmptyState from './EmptyState.jsx';

export default function ContentGrid({ type, items, emptyTitle }) {
  const gridClass = type === 'tutorials'
    ? 'grid gap-7 md:grid-cols-2 lg:grid-cols-3'
    : 'grid gap-7 md:grid-cols-2 lg:grid-cols-3';

  if (!items.length) {
    return (
      <div className={gridClass}>
        <EmptyState title={emptyTitle} desc="New content will appear here once it is published." />
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {items.map((item) => {
        if (type === 'tutorials') return <TutorialCard key={item._id} item={item} />;
        return <NoteCard key={item._id} item={item} />;
      })}
    </div>
  );
}
