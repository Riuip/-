export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-xl overflow-hidden border border-surface-border dark:border-surface-dark-border">
        <div className="h-20 bg-gray-100 dark:bg-gray-800/40" />
        <div className="bg-white dark:bg-gray-800 p-4 h-20 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 -mt-8" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-48 bg-gray-100 dark:bg-gray-700/60 rounded" />
          </div>
        </div>
      </div>
      <div className="card p-1 h-12 bg-gray-100 dark:bg-gray-800/40" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="card h-24 bg-gray-100 dark:bg-gray-800/40" />
      ))}
    </div>
  );
}
