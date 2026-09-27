// Site-wide background grid: dots every 48px joined by straight and diagonal lines. A repeating CSS
// tile rather than a canvas sized from window measurements, so it always covers the whole screen
// (mobile browser bars, rotation and zoom used to leave parts of it empty).
export default function DotCanvas({ opacity = 0.04, dotColor = "#ffffff" }) {
  const line = opacity * 0.7;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><g stroke='${dotColor}' stroke-opacity='${line}' stroke-width='0.75'><path d='M0 24H48M24 0V48M0 0L48 48M48 0L0 48'/></g><circle cx='24' cy='24' r='1.2' fill='${dotColor}' fill-opacity='${opacity}'/></svg>`;
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, backgroundPosition: "-24px -24px" }}
    />
  );
}
