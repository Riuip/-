// 竹叶装饰 (左侧栏顶部用)
export default function Bamboo({
  width = 120,
  height = 200,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 200"
      className={className}
      aria-hidden="true"
    >
      {/* 竹竿 */}
      <line
        x1="40"
        y1="0"
        x2="40"
        y2="200"
        stroke="#5d7849"
        strokeWidth="3"
      />
      {/* 竹节 */}
      {[35, 75, 115, 155, 195].map((y) => (
        <line
          key={y}
          x1="35"
          y1={y}
          x2="45"
          y2={y}
          stroke="#3d4f30"
          strokeWidth="2"
        />
      ))}
      {/* 竹叶 */}
      <g fill="#5d7849" opacity="0.85">
        <path d="M 40 30 Q 60 20 85 25 Q 70 30 50 38 Z" />
        <path d="M 40 30 Q 25 18 5 22 Q 18 28 35 38 Z" />
        <path d="M 40 80 Q 65 70 90 82 Q 70 80 50 88 Z" />
        <path d="M 40 130 Q 18 118 0 130 Q 20 130 38 138 Z" />
        <path d="M 40 130 Q 65 122 95 138 Q 72 132 50 140 Z" />
      </g>
    </svg>
  );
}
