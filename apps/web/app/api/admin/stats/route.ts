import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [experts, searches] = await Promise.all([
    prisma.expert.count(),
    prisma.searchLog.count(),
  ]);
  return new Response(JSON.stringify({ experts, searches }), { headers: { 'Content-Type': 'application/json' } });
}

