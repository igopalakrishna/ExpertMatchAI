"use client";

import { useState } from 'react';
import Image from 'next/image';

type Item = {
  title: string;
  body: string;
  img: string;
  alt: string;
};

export function StackedCards({ items }: { items: Item[] }) {
  const [idx, setIdx] = useState(0);
  const count = items.length;
  const prev = (idx - 1 + count) % count;
  const next = (idx + 1) % count;

  return (
    <div className="relative flex items-center justify-center min-h-[420px] w-full px-16">
      {/* Cards */}
      <div className="relative w-full flex items-center justify-center max-w-5xl mx-auto">
        {items.map((it, i) => {
          let positionClasses = 'opacity-0 pointer-events-none scale-90';
          let z = 'z-0';
          if (i === idx) {
            positionClasses = 'translate-x-0 rotate-0 scale-100 opacity-100';
            z = 'z-30';
          } else if (i === prev) {
            positionClasses = '-translate-x-20 rotate-[-2deg] scale-95 opacity-100 hidden md:block';
            z = 'z-20';
          } else if (i === next) {
            positionClasses = 'translate-x-20 rotate-[2deg] scale-95 opacity-100 hidden md:block';
            z = 'z-20';
          }

          return (
            <article
              key={it.title}
              className={`absolute w-80 sm:w-96 rounded-3xl border bg-white shadow-2xl overflow-hidden transition-all duration-500 ease-out ${positionClasses} ${z}`}
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={it.img}
                  alt={it.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 384px"
                  unoptimized
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold">{it.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{it.body}</p>
                <div className="mt-5">
                  <button className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white hover:bg-black">
                    Read More <span>➝</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Controls - positioned outside the card container */}
      <button
        aria-label="Previous"
        onClick={() => setIdx(prev)}
        className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white shadow-lg hover:bg-gray-50 grid place-items-center text-gray-800 text-xl z-40 transition-colors"
      >
        ‹
      </button>
      <button
        aria-label="Next"
        onClick={() => setIdx(next)}
        className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white shadow-lg hover:bg-gray-50 grid place-items-center text-gray-800 text-xl z-40 transition-colors"
      >
        ›
      </button>
    </div>
  );
}


