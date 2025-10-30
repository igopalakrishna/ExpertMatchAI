import { DonutScore } from '@/components/DonutScore';
import { KeywordChips } from '@/components/KeywordChips';
import { WhyThisMatch } from '@/components/WhyThisMatch';

async function getExpert(id: string, q?: string) {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = new URL(`${base}/api/experts/${id}`);
  if (q) url.searchParams.set('q', q);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch expert');
  return res.json();
}

export default async function ExpertPage({ params, searchParams }: { params: { id: string }; searchParams: { q?: string } }) {
  const data = await getExpert(params.id, searchParams.q);
  return (
    <main className="space-y-8">
      <section className="flex gap-6 items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.thumbnailUrl || 'https://ui-avatars.com/api/?name=E&background=0D8ABC&color=fff&rounded=true'} alt={`${data.name} avatar`} className="w-28 h-28 rounded-2xl object-cover" />
        <div>
          <h1 className="text-3xl font-extrabold">{data.name}</h1>
          <p className="text-gray-600">{[data.city, data.state].filter(Boolean).join(', ')}</p>
          <div className="mt-2 flex gap-2">
            {['Lead certified', 'More sustainable'].map((b) => (
              <span key={b} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-200">{b}</span>
            ))}
          </div>
        </div>
        {data.match && (
          <div className="ml-auto">
            <DonutScore score={data.match.score} />
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-2">Qualifications</h3>
            <KeywordChips terms={data.specialties || []} />
            <div className="text-sm text-gray-700 mt-3 whitespace-pre-line">{data.description}</div>
          </div>

          <div className="rounded-2xl border p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-2">Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Current</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {(data.projectsCurrent || []).map((p: string) => <li key={p}>{p}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Completed</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {(data.projectsCompleted || []).map((p: string) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-2">Ratings & Reviews</h3>
            <p className="text-sm text-gray-700">⭐ {data.rating?.toFixed(1) ?? '—'} • {data.yearsExperience ?? '—'} years</p>
          </div>
          {data.match && (
            <div className="rounded-2xl border p-6 bg-white shadow-sm">
              <WhyThisMatch lines={data.match.explain || []} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

