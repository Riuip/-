// 祥云纹样 (作为侧边装饰条)
export default function CloudPattern({
  width = 280,
  height = 80,
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
      viewBox="0 0 280 80"
      className={className}
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke="#b8893d"
        strokeWidth="1.2"
        opacity="0.55"
        strokeLinecap="round"
      >
        {/* 祥云一 */}
        <path d="M 30 40 Q 30 25 45 25 Q 55 25 55 35 Q 65 30 70 40 Q 70 50 60 50 Q 55 55 45 50 Q 35 55 30 40 Z" />
        {/* 祥云二 (镜像偏移) */}
        <path d="M 110 50 Q 110 35 125 35 Q 135 35 135 45 Q 145 40 150 50 Q 150 60 140 60 Q 135 65 125 60 Q 115 65 110 50 Z" />
        {/* 祥云三 */}
        <path d="M 195 35 Q 195 20 210 20 Q 220 20 220 30 Q 230 25 235 35 Q 235 45 225 45 Q 220 50 210 45 Q 200 50 195 35 Z" />
      </g>
    </svg>
  );
}
