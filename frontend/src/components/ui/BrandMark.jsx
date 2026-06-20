export default function BrandMark({ className = '', compact = false }) {
  return (
    <span className={`inline-flex items-end justify-center leading-none whitespace-nowrap ${className} ${compact ? 'scale-90' : ''}`}>
      <span className="text-4xl font-black tracking-tight text-white">Ten</span>
      <span className="translate-y-2 text-4xl font-black leading-none text-orange-500">.</span>
    </span>
  );
}
