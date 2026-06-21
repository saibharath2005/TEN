export default function BrandMark({
  className = '',
  compact = false,
}) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap ${
        compact ? 'scale-90' : ''
      } ${className}`}
    >
      <span className="text-4xl font-black tracking-tight text-white">
        Ten
      </span>
      <span className="ml-1 text-4xl font-black text-orange-500">
        .
      </span>
    </span>
  );
}