// 主页左右两侧的固定装饰栏 (大屏才显示, < lg 隐藏)
import Lantern from "./Lantern";
import Bamboo from "./Bamboo";
import CloudPattern from "./CloudPattern";
import Mountains from "./Mountains";
import Coin from "./Coin";
import Seal from "./Seal";

export function LeftDecorPanel() {
  return (
    <aside
      className="hidden xl:flex fixed left-4 top-20 bottom-4 w-44 flex-col items-center pointer-events-none select-none"
      aria-hidden="true"
    >
      <Lantern size={130} className="drop-shadow-md" />
      <div className="mt-4 -ml-3">
        <Bamboo width={130} height={260} />
      </div>
      <div className="mt-auto">
        <div className="rotate-[-8deg]">
          <Seal size={56} text="论坛" />
        </div>
      </div>
    </aside>
  );
}

export function RightDecorPanel() {
  return (
    <aside
      className="hidden xl:flex fixed right-4 top-20 bottom-4 w-44 flex-col items-center pointer-events-none select-none"
      aria-hidden="true"
    >
      <CloudPattern width={170} height={70} />
      <div className="mt-2">
        <Coin size={120} className="drop-shadow-md" />
      </div>
      <div className="mt-6 text-center">
        <div className="font-serif text-gold text-lg leading-tight">
          以文会友
          <br />
          以道相交
        </div>
      </div>
      <div className="mt-auto">
        <Mountains width={170} height={90} />
      </div>
    </aside>
  );
}
