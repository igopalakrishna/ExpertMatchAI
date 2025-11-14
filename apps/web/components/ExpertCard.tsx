import Link from 'next/link';
import { MatchBadge } from './MatchBadge';
import { ContactPanel } from './ContactPanel';

type Props = {
  expert: {
    id: string;
    name: string;
    company?: string | null;
    city?: string | null;
    state?: string | null;
    specialties: string[];
    rating?: number | null;
    thumbnailUrl?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    match: { score: number; explain: string[] };
  };
};

export function ExpertCard({ expert }: Props) {
  return (
    <Link href={`/experts/${expert.id}`} className="block rounded-2xl border bg-white shadow-sm hover:shadow-md transition">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={expert.thumbnailUrl || 'https://ui-avatars.com/api/?name=E&background=0D8ABC&color=fff&rounded=true'}
          alt={`${expert.name} thumbnail`}
          className="w-full h-40 object-cover rounded-t-2xl"
        />
        <div className="absolute bottom-2 right-2">
          <MatchBadge score={expert.match.score} />
        </div>
      </div>
      <div className="p-4 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{expert.name}</h3>
          <span className="text-sm text-gray-600">⭐ {expert.rating?.toFixed(1) ?? '—'}</span>
        </div>
        {expert.company && <p className="text-sm text-gray-700">{expert.company}</p>}
        <p className="text-sm text-gray-600">{[expert.city, expert.state].filter(Boolean).join(', ')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {expert.specialties.slice(0, 3).map((s) => (
            <span key={s} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-lg">{s}</span>
          ))}
        </div>
        <div className="mt-4">
          <ContactPanel
            expertId={expert.id}
            email={expert.email}
            phone={expert.phone}
            website={expert.website}
            source="search_results"
            compact
          />
        </div>
      </div>
    </Link>
  );
}

