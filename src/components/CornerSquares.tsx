import { CSSProperties } from "react";

type Corner = "tl" | "tr" | "bl" | "br";

type Props = {
  corners?: Corner[];
  size?: number;
  offset?: number;
  color?: string;
};

const ALL: Corner[] = ["tl", "tr", "bl", "br"];

export default function CornerSquares({
  corners = ALL,
  size,
  offset,
  color,
}: Props) {
  const style: CSSProperties = {};
  if (size !== undefined) (style as Record<string, string>)["--corner-size"] = `${size}px`;
  if (offset !== undefined) (style as Record<string, string>)["--corner-offset"] = `${offset}px`;
  if (color !== undefined) (style as Record<string, string>)["--corner-color"] = color;

  return (
    <>
      {corners.map((c) => (
        <span
          key={c}
          aria-hidden
          className={`corner-square corner-square-${c}`}
          style={style}
        />
      ))}
    </>
  );
}
