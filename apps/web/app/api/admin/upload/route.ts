import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import { mapCsvRowToExpert, type CsvRow } from '@/lib/csv';

function fallbackAvatar(name: string): string {
  const base = 'https://ui-avatars.com/api/';
  const params = new URLSearchParams({ name, background: '0D8ABC', color: 'fff', rounded: 'true' });
  return `${base}?${params.toString()}`;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) {
    return new Response('Missing file', { status: 400 });
  }
  const text = await file.text();
  const rows = parse(text, { columns: true, skip_empty_lines: true }) as CsvRow[];

  let created = 0;
  let updated = 0;
  for (const row of rows) {
    const mapped = mapCsvRowToExpert(row);
    const existing = await prisma.expert.findFirst({ where: { name: mapped.name, city: mapped.city ?? undefined, state: mapped.state ?? undefined } });
    const thumb = mapped.thumbnailUrl || fallbackAvatar(mapped.name);
    if (existing) {
      await prisma.expert.update({ where: { id: existing.id }, data: { ...mapped, thumbnailUrl: thumb } });
      updated += 1;
    } else {
      await prisma.expert.create({ data: { ...mapped, thumbnailUrl: thumb } });
      created += 1;
    }
  }

  // Trigger index build
  try {
    const res = await fetch(`${process.env.FASTAPI_URL || 'http://localhost:8000'}/index/build`, { method: 'POST' });
    console.log('Index rebuild via admin upload:', res.status);
  } catch {}

  return new Response(JSON.stringify({ created, updated }), { headers: { 'Content-Type': 'application/json' } });
}

