"use client";

// Note: client component, so static metadata is set on layout/title only.
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username.trim() || undefined },
          emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(translateAuthError(error.message));
      } else {
        setInfo("注册成功!请去邮箱点击确认链接,然后回这里登录。");
        setMode("sign-in");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(translateAuthError(error.message));
      } else {
        router.refresh();
        router.push(next);
      }
    }

    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto card p-6 mt-8">
      <h1 className="text-xl font-semibold mb-4">
        {mode === "sign-in" ? "登录" : "创建账号"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "sign-up" && (
          <input
            type="text"
            placeholder="用户名(3-24 位,小写字母/数字/下划线)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="[a-z0-9_]{3,24}"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        )}
        <input
          type="email"
          placeholder="邮箱地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="密码(至少 6 位)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium rounded-full py-2 text-sm"
        >
          {loading ? "处理中..." : mode === "sign-in" ? "登录" : "注册"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
          setInfo(null);
        }}
        className="mt-4 text-sm text-gray-600 hover:underline"
      >
        {mode === "sign-in" ? "还没有账号?去注册" : "已有账号?去登录"}
      </button>
    </div>
  );
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "邮箱或密码错误";
  if (m.includes("email not confirmed")) return "邮箱还未验证,请检查你的收件箱";
  if (m.includes("user already registered")) return "该邮箱已注册";
  if (m.includes("password should be at least")) return "密码长度至少 6 位";
  if (m.includes("rate limit")) return "操作太频繁,请稍后再试";
  return msg;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
