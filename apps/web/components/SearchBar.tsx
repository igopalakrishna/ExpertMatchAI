"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export function SearchBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');

  useEffect(() => {
    setQ(sp.get('q') || '');
  }, [sp]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const url = new URL(window.location.href);
        url.searchParams.set('q', q);
        router.push(`/search?${url.searchParams.toString()}`);
      }}
      className="flex gap-2"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Looking for architect that specializes in sandstone in Wilmington, NC"
        className="w-full rounded-xl border px-4 py-3"
      />
      <button type="submit" className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">Search</button>
    </form>
  );
}

