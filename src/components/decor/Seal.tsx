// 印章 (红色方印) - 顶角小装饰
export default function Seal({
  size = 56,
  text = "论坛",
  className = "",
}: {
  size?: number;
  text?: string;
  className?: string;
}) {
  // 把文字按 2x2 排,优先竖排
  const chars = Array.from(text).slice(0, 4);
  while (chars.length < 4) chars.push("");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="6"
        fill="#c8161d"
        stroke="#7d0e12"
        strokeWidth="3"
      />
      {/* 内框 */}
      <rect
        x="14"
        y="14"
        width="72"
        height="72"
        rx="3"
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.5"
      />
      {/* 4 字 */}
      {[
        [chars[0], 33, 42],
        [chars[1], 67, 42],
        [chars[2], 33, 78],
        [chars[3], 67, 78],
      ].map(([t, x, y], i) => (
        <text
          key={i}
          x={x as number}
          y={y as number}
          textAnchor="middle"
          fontSize="22"
          fontWeight="900"
          fontFamily='"Songti SC", "STSong", serif'
          fill="#fff"
        >
          {t}
        </text>
      ))}
    </svg>
  );
}
