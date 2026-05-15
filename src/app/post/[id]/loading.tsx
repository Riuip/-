export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="card flex">
        <div className="w-12 bg-gray-100 dark:bg-gray-800/40 rounded-l-xl" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-7 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-full bg-gray-100 dark:bg-gray-700/60 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-700/60 rounded" />
        </div>
      </div>
      <div className="card p-4 space-y-3">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-20 w-full bg-gray-100 dark:bg-gray-700/40 rounded" />
      </div>
    </div>
  );
}
