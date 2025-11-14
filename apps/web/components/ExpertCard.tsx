'use client';

import { useState, MouseEvent } from 'react';
import Link from 'next/link';
import { MatchBadge } from './MatchBadge';

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
  const [showContact, setShowContact] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);

  const handleContactClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const nextState = !showContact;
    setShowContact(nextState);
    if (!hasTracked && nextState) {
      setIsLogging(true);
      try {
        await fetch('/api/analytics/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expertId: expert.id, source: 'search_results' })
        });
        setHasTracked(true);
      } catch {
        // silent failure; analytics are best-effort
      } finally {
        setIsLogging(false);
      }
    }
  };

  const hasContactInfo = Boolean(expert.email || expert.phone || expert.website);

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
          <button
            type="button"
            onClick={handleContactClick}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 focus:outline-none"
          >
            {showContact ? 'Hide contact' : 'Contact expert'}
            <span className="ml-1">{isLogging && !hasTracked ? '…' : '›'}</span>
          </button>
          {showContact && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-gray-700 space-y-1">
              {hasContactInfo ? (
                <>
                  {expert.email && (
                    <div>
                      <span className="font-medium">Email:</span>{' '}
                      <a href={`mailto:${expert.email}`} className="text-indigo-700 underline">{expert.email}</a>
                    </div>
                  )}
                  {expert.phone && (
                    <div>
                      <span className="font-medium">Phone:</span>{' '}
                      <a href={`tel:${expert.phone}`} className="text-indigo-700 underline">{expert.phone}</a>
                    </div>
                  )}
                  {expert.website && (
                    <div>
                      <span className="font-medium">Website:</span>{' '}
                      <a href={expert.website} target="_blank" rel="noreferrer" className="text-indigo-700 underline">
                        {expert.website}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Contact details will be available soon.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

