/**
 * Simple SVG sparkline component for visualizing a trend of numbers.
 * Used in staff overview to show 6-month class count trends.
 */

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 60,
  height = 24,
  color = "currentColor",
  className,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  
  // Use a smarter range: if all values are the same, add padding; otherwise use 20% padding above max
  let range = max - min;
  if (range === 0) {
    range = Math.max(max * 0.2, 1); // 20% of max or 1, whichever is larger
  } else {
    range = range * 1.1; // Add 10% padding to the range for better visual separation
  }

  // Padding for the SVG
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate points
  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const normalizedValue = (value - min) / range;
      const y = padding + chartHeight - normalizedValue * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: "inline-block" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
