/**
 * A chevron that stretches into an arrow while the link around it is pointed at or focused
 * (global.css, .morph-arrow). Drawn, not typed, so its head and shaft can move apart.
 */
export function MorphArrow({ back = false }: { back?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`morph-arrow ${back ? '-scale-x-100' : ''}`}
    >
      <path className="morph-arrow-shaft" d="M3 8H13" />
      <path className="morph-arrow-head" d="M9 4L13 8L9 12" />
    </svg>
  );
}
