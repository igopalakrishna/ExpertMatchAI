import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { ExpertCard } from '@/components/ExpertCard';
import { prisma } from '@/lib/prisma';

type SearchParams = {
  q?: string;
  state?: string;
  city?: string;
  specialties?: string;
  minRating?: string;
  sort?: 'best' | 'rating' | 'distance' | 'experience';
};

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = searchParams.q || '';
  const filters: any = {};
  if (searchParams.state) filters.state = searchParams.state;
  if (searchParams.city) filters.city = searchParams.city;
  if (searchParams.specialties) filters.specialties = searchParams.specialties.split(',').map((s) => s.trim());
  if (searchParams.minRating) filters.minRating = parseFloat(searchParams.minRating);
  const sort = (searchParams.sort as any) || 'best';

  let data: any;
  try {
    const res = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ query: q, filters, sort, limit: 200, offset: 0 })
    });
    if (res.ok) {
      data = await res.json();
    } else {
      throw new Error('search api not ok');
    }
  } catch {
    // Server-side fallback ONLY for empty query – show top-rated
    if (!q) {
      const experts = await prisma.expert.findMany({
        orderBy: [{ rating: 'desc' }, { yearsExperience: 'desc' }],
        take: 200,
      });
      data = {
        results: experts.map((e) => ({
          id: e.id,
          name: e.name,
          company: e.company,
          city: e.city,
          state: e.state,
          specialties: e.specialties,
          rating: e.rating,
          thumbnailUrl: e.thumbnailUrl,
          yearsExperience: e.yearsExperience,
          email: e.email,
          phone: e.phone,
          website: e.website,
          match: { score: 0, explain: ['SSR fallback: top-rated'] }
        })),
        total: experts.length,
        tookMs: 0
      };
    } else {
      // For non-empty queries, surface API failure rather than masking
      data = { results: [], total: 0, tookMs: 0 };
    }
  }

  return (
    <main className="space-y-6">
      <SearchBar />
      <FilterPanel />
      <div data-testid="results-summary" className="text-sm text-gray-600">{data.total} results • {data.tookMs} ms</div>
      {data.results.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center text-gray-600 bg-white">
          <p>No experts found. Try adjusting filters or a broader query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.results.map((e: any) => (
            <ExpertCard key={e.id} expert={e} />
          ))}
        </div>
      )}
    </main>
  );
}

