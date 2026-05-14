// 古钱币 (圆形方孔铜钱), 用作右侧栏装饰
export default function Coin({
  size = 80,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      {/* 外圆 */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="#b8893d"
        stroke="#8c6427"
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
      {/* 中央方孔 */}
      <rect
        x="40"
        y="40"
        width="20"
        height="20"
        fill="#fbf7f2"
        stroke="#8c6427"
        strokeWidth="1.5"
      />
      {/* 四个汉字 (上下左右) */}
      <text
        x="50"
        y="22"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fontFamily='"Songti SC", "STSong", serif'
        fill="#3a3735"
      >
        论
      </text>
      <text
        x="50"
        y="86"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fontFamily='"Songti SC", "STSong", serif'
        fill="#3a3735"
      >
        坛
      </text>
      <text
        x="20"
        y="55"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fontFamily='"Songti SC", "STSong", serif'
        fill="#3a3735"
      >
        和
      </text>
      <text
        x="80"
        y="55"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fontFamily='"Songti SC", "STSong", serif'
        fill="#3a3735"
      >
        合
      </text>
    </svg>
  );
}
