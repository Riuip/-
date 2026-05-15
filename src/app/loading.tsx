// Global loading skeleton shown while a route's server component is rendering.
// Matches the home/feed layout so the user sees structure immediately.
export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5 animate-pulse">
      <div className="space-y-3">
        <div className="card p-4 h-20 bg-gray-100 dark:bg-gray-800/40" />
        <div className="card p-1 h-12 bg-gray-100 dark:bg-gray-800/40" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card flex">
            <div className="w-12 bg-gray-100 dark:bg-gray-800/40 rounded-l-xl" />
            <div className="flex-1 p-4 space-y-2">
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-700/60 rounded" />
              <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-700/60 rounded" />
            </div>
          </div>
        ))}
      </div>
      <aside className="space-y-3 hidden md:block">
        <div className="card p-4 h-48 bg-gray-100 dark:bg-gray-800/40" />
        <div className="card p-4 h-32 bg-gray-100 dark:bg-gray-800/40" />
      </aside>
    </div>
  );
}
