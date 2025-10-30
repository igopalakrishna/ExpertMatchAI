export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="flex gap-6 items-center">
        <div className="w-28 h-28 rounded-2xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="flex gap-2 mt-2">
            <span className="h-5 w-20 bg-gray-200 rounded" />
            <span className="h-5 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="ml-auto w-24 h-24 rounded-full bg-gray-200" />
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border p-6 bg-white shadow-sm h-40" />
          <div className="rounded-2xl border p-6 bg-white shadow-sm h-40" />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border p-6 bg-white shadow-sm h-24" />
          <div className="rounded-2xl border p-6 bg-white shadow-sm h-32" />
        </div>
      </section>
    </div>
  );
}

