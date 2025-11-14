import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { createBM25Index, normalizeBm25 } from '@/lib/bm25';
import { combineScores, filterBonus } from '@/lib/scoring';

type Body = {
  query: string;
  filters?: {
    state?: string;
    city?: string;
    specialties?: string[];
    minRating?: number;
    yearsExperience?: number;
  };
  limit?: number;
  offset?: number;
  sort?: 'best' | 'rating' | 'distance' | 'experience';
};

export async function POST(req: NextRequest) {
  const start = Date.now();
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = { query: '', limit: 24, offset: 0 } as Body;
  }
  const { query, filters = {}, limit = 24, offset = 0, sort = 'best' } = body;

  // Simple in-memory rate limit per IP per minute
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const now = Date.now();
  const store = (global as any).__rate__ || ((global as any).__rate__ = new Map());
  const entry = store.get(ip) || { count: 0, resetAt: now + 60_000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60_000;
  }
  entry.count += 1;
  store.set(ip, entry);
  if (entry.count > 60) {
    // Return top-rated instead of empty when rate limited
    const [experts, total] = await Promise.all([
      prisma.expert.findMany({
        orderBy: [{ rating: 'desc' }, { yearsExperience: 'desc' }],
        take: limit,
        skip: offset,
      }),
      prisma.expert.count()
    ]);
    const results = experts.map((e) => ({
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
      match: { score: combineScores({ sem: 0, kw: 0, filt: 0 }), explain: ['Rate limit fallback'] }
    }));
    const tookMs = Date.now() - start;
    return new Response(JSON.stringify({ results, total, tookMs }), { headers: { 'Content-Type': 'application/json' } });
  }

  const where: any = {};
  if (filters.state) where.state = filters.state;
  if (filters.city) where.city = filters.city;
  if (filters.minRating) where.rating = { gte: filters.minRating };
  if (filters.yearsExperience) where.yearsExperience = { gte: filters.yearsExperience };
  if (filters.specialties && Array.isArray(filters.specialties) && filters.specialties.length > 0) {
    where.specialties = { hasSome: filters.specialties };
  }

  // Empty query: return top-rated experts (respect filters)
  if (!query || query.trim() === '') {
    let experts: any[] = [];
    let total = 0;
    try {
      [experts, total] = await Promise.all([
        prisma.expert.findMany({
          where,
          orderBy: [{ rating: 'desc' }, { yearsExperience: 'desc' }],
          take: limit,
          skip: offset,
        }),
        prisma.expert.count({ where })
      ]);
    } catch {
      // ultra-safe fallback
      [experts, total] = await Promise.all([
        prisma.expert.findMany({ where, take: limit, skip: offset }),
        prisma.expert.count({ where })
      ]);
    }
    const results = experts.map((e) => {
      const { score: filtScore, reasons } = filterBonus(filters, e);
      return {
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
        match: { score: combineScores({ sem: 0, kw: 0, filt: filtScore }), explain: [...reasons, 'Default: top-rated'] }
      };
    });
    const tookMs = Date.now() - start;
    await prisma.searchLog.create({ data: { query: '(empty)', filters: filters as any, results: results.length, tookMs } });
    return new Response(
      JSON.stringify({ results, total, tookMs }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  let experts = [] as any[];
  let total = 0;
  try {
    [experts, total] = await Promise.all([
      prisma.expert.findMany({ where }),
      prisma.expert.count({ where })
    ]);
  } catch (e) {
    // On unexpected DB error, fall back below
    experts = [];
    total = 0;
  }

  // BM25 fallback
  const docs = experts.map((e) => ({
    id: e.id,
    text: [
      e.name,
      e.company ?? '',
      e.description,
      (e.specialties || []).join(' '),
      e.city ?? '',
      e.state ?? ''
    ].join(' ')
  }));
  let bmScores: Record<number, number> = {};
  let maxBm = 0;
  let candidateIds: string[] = [];
  try {
    const bm = createBM25Index(docs);
    const bmRes = bm.search(query, experts.length) as Array<[number, number]>;
    bmScores = {};
    bmRes.forEach(([docIdx, score]) => {
      bmScores[docIdx] = score;
    });
    maxBm = Math.max(0, ...Object.values(bmScores));
    candidateIds = bmRes
      .slice(0, Math.min(1000, bmRes.length))
      .map(([docIdx]) => experts[docIdx]?.id)
      .filter(Boolean) as string[];
  } catch {
    bmScores = {};
    maxBm = 0;
    candidateIds = [];
  }
  const normBm = normalizeBm25(Object.values(bmScores));

  // Optionally query semantic backend
  let semScoresById: Record<string, number> = {};
  let explainById: Record<string, string[]> = {};
  const fullMatchIds = new Set<string>();
  // Default to enabling semantic if FASTAPI is available
  let bm25Only = (process.env.BM25_ONLY || 'false') === 'true';
  if (bm25Only) {
    try {
      const h = await fetch(`${process.env.FASTAPI_URL || 'http://localhost:8000'}/health`, { cache: 'no-store' });
      if (h.ok) {
        const j = await h.json();
        if (j.status === 'ok') bm25Only = false;
      }
    } catch {
      // keep bm25Only true if backend not reachable
    }
  }
  if (!bm25Only) {
    try {
      const res = await fetch(`${process.env.FASTAPI_URL || 'http://localhost:8000'}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, candidateIds })
      });
      if (res.ok) {
        const data = await res.json();
        // data: { results: [{ id, score, topTerms: [] }] }
        for (const r of data.results || []) {
          const sem = r.semScore ?? (typeof r.score === 'number' ? r.score : (typeof r.finalScore === 'number' ? r.finalScore / 100 : 0));
          semScoresById[r.id] = sem;
          explainById[r.id] = (r.topTerms || []).map((t: any) => {
            const w = typeof t.weight === 'number' ? t.weight : (typeof t === 'object' && t.weight ? t.weight : 0);
            return `${t.term ?? t} (${(w as number).toFixed ? (w as number).toFixed(2) : w})`;
          });
          if (r.allKeywordsMatched) {
            fullMatchIds.add(r.id);
          }
        }
      }
    } catch {
      // ignore and stay on BM25-only
    }
  }

  // Build final results
  const results = experts.map((e, idx) => {
    const bmRaw = bmScores[idx] || 0;
    const bmNorm = maxBm > 0 ? bmRaw / maxBm : 0;
    const { score: filtScore, reasons } = filterBonus(filters, e);
    const sem = semScoresById[e.id] ?? 0;
    const score = combineScores({ sem, kw: bmNorm, filt: filtScore });
    const explanation = [
      ...(explainById[e.id] || []),
      ...reasons
    ].slice(0, 5);
    const isFullMatch = fullMatchIds.has(e.id);
    const explain = isFullMatch ? ['Full keyword match', ...explanation].slice(0, 5) : explanation;
    const finalScore = isFullMatch ? 100 : score;
    return {
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
      match: { score: finalScore, explain }
    };
  });

  // Sorting
  const sorted = results.sort((a, b) => {
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sort === 'experience') return (b.yearsExperience || 0) - (a.yearsExperience || 0);
    return b.match.score - a.match.score; // best match default
  });

  let page = sorted.slice(offset, offset + limit);

  // Fallback: if no results, show top-rated experts (respect current filters)
  if (page.length === 0) {
    const topRated = await prisma.expert.findMany({
      where,
      orderBy: [{ rating: 'desc' }],
      take: limit,
      skip: offset,
    });
    page = topRated.map((e) => {
      const { score: filtScore, reasons } = filterBonus(filters, e);
      const score = combineScores({ sem: 0, kw: 0, filt: filtScore });
      const explain = [
        ...reasons,
        'Fallback: top-rated'
      ].slice(0, 5);
      return {
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
        match: { score, explain }
      };
    });
  }

  const tookMs = Date.now() - start;
  try {
    await prisma.searchLog.create({ data: { query: query || '(empty)', filters: filters as any, results: page.length, tookMs } });
  } catch {}

  return new Response(JSON.stringify({ results: page, total: total, tookMs }), { headers: { 'Content-Type': 'application/json' } });
}

