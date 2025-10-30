"use client";
"use client";
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Item = { title: string; body: string };

// Simple, robust carousel: render ONE slide at a time. No transform math.
export function Carousel({ items, intervalMs = 0 }: { items: Item[]; intervalMs?: number }) {
  const [idx, setIdx] = useState(0);
  const count = items.length || 1;

  // Clamp index if items change
  useEffect(() => {
    if (idx >= count) setIdx(0);
  }, [count, idx]);

  // Optional auto-advance only if intervalMs > 0
  useEffect(() => {
    if (!intervalMs) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs]);

  const current = items[idx] ?? { title: '', body: '' };

  return (
    <div className="relative rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="p-6 min-h-[120px]">
        <h3 className="font-semibold text-lg">{current.title}</h3>
        <p className="text-gray-700 mt-2">{current.body}</p>
      </div>
      <button
        aria-label="Previous"
        onClick={() => setIdx((idx - 1 + count) % count)}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        aria-label="Next"
        onClick={() => setIdx((idx + 1) % count)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-1.5 w-6 rounded-full ${i === idx ? 'bg-gray-900' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
}

