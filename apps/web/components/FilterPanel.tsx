"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function FilterPanel() {
  const router = useRouter();
  const sp = useSearchParams();
  const [state, setState] = useState(sp.get('state') || '');
  const [city, setCity] = useState(sp.get('city') || '');
  const [minRating, setMinRating] = useState(sp.get('minRating') || '');
  const [specialties, setSpecialties] = useState(sp.get('specialties') || '');
  const [sort, setSort] = useState(sp.get('sort') || 'best');

  useEffect(() => {
    setState(sp.get('state') || '');
    setCity(sp.get('city') || '');
    setMinRating(sp.get('minRating') || '');
    setSpecialties(sp.get('specialties') || '');
    setSort(sp.get('sort') || 'best');
  }, [sp]);

  function apply() {
    const url = new URL(window.location.href);
    if (state) url.searchParams.set('state', state); else url.searchParams.delete('state');
    if (city) url.searchParams.set('city', city); else url.searchParams.delete('city');
    if (minRating) url.searchParams.set('minRating', minRating); else url.searchParams.delete('minRating');
    if (specialties) url.searchParams.set('specialties', specialties); else url.searchParams.delete('specialties');
    if (sort) url.searchParams.set('sort', sort);
    router.push(`/search?${url.searchParams.toString()}`);
  }

  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-white grid grid-cols-1 md:grid-cols-5 gap-3">
      <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="rounded-xl border px-3 py-2" />
      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-xl border px-3 py-2" />
      <input value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Specialties (comma-separated)" className="rounded-xl border px-3 py-2" />
      <input value={minRating} onChange={(e) => setMinRating(e.target.value)} placeholder="Min rating" className="rounded-xl border px-3 py-2" />
      <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border px-3 py-2">
        <option value="best">Best match</option>
        <option value="rating">Rating</option>
        <option value="experience">Experience</option>
      </select>
      <div className="md:col-span-5 flex justify-end">
        <button onClick={apply} className="rounded-xl bg-gray-900 text-white px-4 py-2">Apply</button>
      </div>
    </div>
  );
}

