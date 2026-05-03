/**
 * Tiny dependency-free SVG sparkline for the admin analytics page.
 * Pass an array of numbers; renders a stroke + soft area fill.
 */

type Props = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
};

export default function Sparkline({
  values,
  width = 800,
  height = 160,
  stroke = "#87FF38",
  fill = "rgba(135, 255, 56, 0.12)",
}: Props) {
  if (!values.length) {
    return <div className="sparkline-empty">No data yet</div>;
  }

  const max = Math.max(...values, 1);
  const min = 0;
  const span = max - min;
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * height;
    return [x, y] as const;
  });

  const pathStroke = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");

  const pathFill = `${pathStroke} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      role="img"
      aria-label="Page views over time"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="sparkline"
    >
      <path d={pathFill} fill={fill} stroke="none" />
      <path d={pathStroke} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
