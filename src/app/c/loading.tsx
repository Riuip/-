export default function Loading() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card h-20 bg-gray-100 dark:bg-gray-800/40" />
      ))}
    </div>
  );
}
