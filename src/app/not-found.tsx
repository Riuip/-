import Link from "next/link";

export const metadata = {
  title: "404 · 没找到",
};

export default function NotFound() {
  return (
    <div className="card p-8 max-w-md mx-auto text-center">
      <div className="text-5xl font-bold text-brand mb-2">404</div>
      <h1 className="text-lg font-semibold mb-2">页面没找到</h1>
      <p className="text-sm text-gray-600 mb-4">
        你访问的页面不存在,或者已经被删除了。
      </p>
      <div className="flex gap-2 justify-center">
        <Link
          href="/"
          className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-1.5 rounded-full"
        >
          回首页
        </Link>
        <Link
          href="/c"
          className="border border-gray-300 hover:bg-gray-100 text-gray-800 text-sm font-medium px-4 py-1.5 rounded-full"
        >
          逛社区
        </Link>
      </div>
    </div>
  );
}
