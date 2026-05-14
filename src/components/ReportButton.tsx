"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REASONS = [
  "垃圾广告 / 引流",
  "辱骂 / 人身攻击",
  "色情 / 低俗",
  "违法违规内容",
  "虚假信息 / 误导",
  "其他",
];

export default function ReportButton({
  postId,
  commentId,
  isLoggedIn,
  className = "",
}: {
  postId?: string;
  commentId?: string;
  isLoggedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      router.push("/login");
      return;
    }

    const fullReason = extra.trim()
      ? `${reason}: ${extra.trim()}`
      : reason;

    const payload: {
      reporter_id: string;
      reason: string;
      post_id?: string;
      comment_id?: string;
    } = {
      reporter_id: user.id,
      reason: fullReason.slice(0, 500),
    };
    if (postId) payload.post_id = postId;
    if (commentId) payload.comment_id = commentId;

    const { error } = await supabase.from("reports").insert(payload);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      setExtra("");
    }, 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!isLoggedIn) {
            router.push("/login");
            return;
          }
          setOpen(true);
        }}
        className={`text-ink-mute hover:text-brand ${className}`}
      >
        举报
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="card w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-3">举报内容</h3>

            {done ? (
              <div className="py-6 text-center text-sm text-green-700">
                ✓ 已收到你的举报,管理员会尽快处理。
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    原因
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-paper-dark rounded px-3 py-2 text-sm bg-white"
                  >
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    补充说明 <span className="text-ink-mute">(可选)</span>
                  </label>
                  <textarea
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    rows={3}
                    maxLength={400}
                    placeholder="请简要说明..."
                    className="w-full border border-paper-dark rounded px-3 py-2 text-sm"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="text-sm text-ink-mute hover:text-ink px-3 py-1.5"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-1.5 rounded-full"
                  >
                    {loading ? "提交中..." : "提交举报"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
