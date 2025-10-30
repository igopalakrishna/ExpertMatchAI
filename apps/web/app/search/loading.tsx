export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border bg-white shadow-sm">
          <div className="h-40 w-full rounded-t-2xl bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-3 w-1/3 bg-gray-200 rounded" />
            <div className="flex gap-2 mt-2">
              <span className="h-5 w-16 bg-gray-200 rounded" />
              <span className="h-5 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

