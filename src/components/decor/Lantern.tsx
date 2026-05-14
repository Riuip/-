// 红灯笼装饰 (纯 SVG, 无外部依赖)
export default function Lantern({
  size = 120,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 130"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="lantern-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ff5b5e" />
          <stop offset="60%" stopColor="#c8161d" />
          <stop offset="100%" stopColor="#7d0e12" />
        </radialGradient>
      </defs>
      {/* 提绳 */}
      <line x1="50" y1="0" x2="50" y2="14" stroke="#3a3735" strokeWidth="1.5" />
      {/* 顶盖 */}
      <rect x="32" y="13" width="36" height="6" rx="1.5" fill="#b8893d" />
      <rect x="36" y="19" width="28" height="3" fill="#8c6427" />
      {/* 灯笼主体 */}
      <ellipse cx="50" cy="60" rx="36" ry="40" fill="url(#lantern-grad)" />
      {/* 竖线条纹 */}
      {[20, 32, 50, 68, 80].map((x, i) => (
        <path
          key={i}
          d={`M ${x} 25 Q ${50} ${i % 2 === 0 ? 60 : 60} ${x} 95`}
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="0.6"
          fill="none"
        />
      ))}
      {/* 中央 "福" */}
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontSize="22"
        fontWeight="bold"
        fontFamily='"Songti SC", "STSong", serif'
        fill="#fbe384"
      >
        福
      </text>
      {/* 底盖 */}
      <rect x="36" y="98" width="28" height="3" fill="#8c6427" />
      <rect x="32" y="101" width="36" height="6" rx="1.5" fill="#b8893d" />
      {/* 流苏 */}
      <line
        x1="50"
        y1="107"
        x2="50"
        y2="118"
        stroke="#fbe384"
        strokeWidth="1.5"
      />
      <path
        d="M 42 118 L 58 118 L 50 130 Z"
        fill="#fbe384"
      />
    </svg>
  );
}
