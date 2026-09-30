type PixelSpriteProps = {
  /** One string per row; each character is a pixel looked up in `palette`. */
  rows: readonly string[];
  /** Character → color. Characters without an entry are transparent. */
  palette: Record<string, string>;
  /** Rendered width in CSS pixels. Height follows the sprite's aspect ratio. */
  size?: number;
  /** Accessible label. Omit for purely decorative sprites. */
  title?: string;
  className?: string;
};

/**
 * Renders ASCII pixel art as a crisp SVG. Horizontal runs of the same color
 * are merged into a single rect to keep the DOM small.
 */
export function PixelSprite({ rows, palette, size, title, className }: PixelSpriteProps) {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const rects: React.ReactNode[] = [];

  rows.forEach((row, y) => {
    let x = 0;
    while (x < width) {
      const ch = row[x];
      const fill = palette[ch];
      let end = x + 1;
      while (end < width && row[end] === ch) end++;
      if (fill) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={fill} />);
      }
      x = end;
    }
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={size ? (size * height) / width : undefined}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      {title && <title>{title}</title>}
      {rects}
    </svg>
  );
}
