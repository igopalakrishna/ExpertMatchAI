import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { expertId?: string; userId?: string; searchId?: string; source?: string } = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ status: 'error', error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!body.expertId) {
    return new Response(JSON.stringify({ status: 'error', error: 'expertId_required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiBase = process.env.FASTAPI_URL || process.env.RECO_API_URL || 'http://localhost:8000';
  try {
    const resp = await fetch(`${apiBase}/analytics/contact-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        expert_id: body.expertId,
        user_id: body.userId,
        search_id: body.searchId,
        source: body.source || 'search_results'
      })
    });
    if (!resp.ok) {
      return new Response(JSON.stringify({ status: 'error', error: 'backend_unavailable' }), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const data = await resp.json().catch(() => ({}));
    return new Response(JSON.stringify({ status: 'ok', ...data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ status: 'error', error: 'contact_log_failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

