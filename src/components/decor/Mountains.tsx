// 山水画风格远山 (用作侧栏底部装饰)
export default function Mountains({
  width = 280,
  height = 120,
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
      viewBox="0 0 280 120"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mountain-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fbf7f2" stopOpacity="0" />
          <stop offset="100%" stopColor="#fbf7f2" />
        </linearGradient>
      </defs>

      {/* 远山 (浅墨) */}
      <path
        d="M 0 90 L 30 60 L 55 78 L 85 50 L 115 75 L 150 55 L 185 80 L 220 60 L 250 82 L 280 70 L 280 120 L 0 120 Z"
        fill="#c4cdd3"
        opacity="0.55"
      />
      {/* 中山 (中墨) */}
      <path
        d="M 0 100 L 25 80 L 50 95 L 80 75 L 110 90 L 145 78 L 180 96 L 215 82 L 250 98 L 280 88 L 280 120 L 0 120 Z"
        fill="#8a96a0"
        opacity="0.55"
      />
      {/* 近山 (浓墨) */}
      <path
        d="M 0 112 L 40 96 L 80 108 L 120 95 L 160 110 L 200 100 L 240 112 L 280 105 L 280 120 L 0 120 Z"
        fill="#3a4854"
        opacity="0.7"
      />

      {/* 飞鸟 (≈、≈) */}
      <g
        stroke="#3a3735"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
        strokeLinecap="round"
      >
        <path d="M 60 25 Q 65 20 70 25 Q 75 20 80 25" />
        <path d="M 100 18 Q 104 14 108 18 Q 112 14 116 18" />
        <path d="M 175 30 Q 179 26 183 30 Q 187 26 191 30" />
      </g>

      {/* 雾气渐变覆盖底部 */}
      <rect width="280" height="120" fill="url(#mountain-bg)" opacity="0.3" />
    </svg>
  );
}
