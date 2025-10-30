import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { filterBonus, combineScores } from '@/lib/scoring';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || undefined;

  const expert = await prisma.expert.findUnique({ where: { id } });
  if (!expert) return new Response('Not found', { status: 404 });

  let match: any = undefined;
  if (q) {
    // Lightweight explanation using filters/BM25 terms. In a full build, call backend rerank.
    const { score: filt } = filterBonus({}, expert);
    const kwOverlap = (expert.specialties || [])
      .filter((s) => q.toLowerCase().includes(s.toLowerCase()))
      .map((s) => `${s} (0.20)`);
    const final = combineScores({ sem: 0, kw: kwOverlap.length > 0 ? 0.5 : 0.1, filt });
    match = { score: final, explain: kwOverlap.slice(0, 5) };
  }

  return new Response(
    JSON.stringify({ ...expert, match }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

