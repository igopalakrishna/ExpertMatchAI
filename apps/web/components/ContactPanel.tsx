'use client';

import { useState, MouseEvent } from 'react';

type Props = {
  expertId: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  source?: string;
  align?: 'left' | 'center';
  compact?: boolean;
};

export function ContactPanel({
  expertId,
  email,
  phone,
  website,
  source = 'expert_profile',
  align = 'left',
  compact = false
}: Props) {
  const [visible, setVisible] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  const handleToggle = async (event?: MouseEvent<HTMLElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const next = !visible;
    setVisible(next);
    if (next && !logged) {
      setIsLogging(true);
      try {
        await fetch('/api/analytics/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expertId, source })
        });
        setLogged(true);
      } catch {
        // Analytics is best-effort
      } finally {
        setIsLogging(false);
      }
    }
  };

  const hasInfo = Boolean(email || phone || website);
  const alignmentClass = align === 'center' ? 'text-center' : 'text-left';
  const btnClasses = compact
    ? 'text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1'
    : 'inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 focus:outline-none';

  return (
    <div className={`space-y-3 text-sm text-gray-700 ${alignmentClass}`}>
      <button type="button" onClick={handleToggle} className={btnClasses}>
        {visible ? 'Hide contact info' : 'Contact expert'}
        <span>{isLogging && !logged ? '…' : '›'}</span>
      </button>
      {visible && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
          {hasInfo ? (
            <>
              {email && (
                <div>
                  <span className="font-medium">Email:</span>{' '}
                  <a href={`mailto:${email}`} className="text-indigo-700 underline">{email}</a>
                </div>
              )}
              {phone && (
                <div>
                  <span className="font-medium">Phone:</span>{' '}
                  <a href={`tel:${phone}`} className="text-indigo-700 underline">{phone}</a>
                </div>
              )}
              {website && (
                <div>
                  <span className="font-medium">Website:</span>{' '}
                  <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noreferrer" className="text-indigo-700 underline">
                    {website}
                  </a>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500">Contact details coming soon.</p>
          )}
        </div>
      )}
    </div>
  );
}


