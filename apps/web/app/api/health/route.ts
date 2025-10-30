import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // lightweight DB ping
    await prisma.$queryRaw`SELECT 1`;
    return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ status: 'degraded', error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

