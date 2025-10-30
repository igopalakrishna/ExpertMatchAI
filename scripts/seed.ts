import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { mapCsvRowToExpert, type CsvRow } from './utils/csv';

function fallbackAvatar(name: string): string {
  const base = 'https://ui-avatars.com/api/';
  const params = new URLSearchParams({ name, background: '0D8ABC', color: 'fff', rounded: 'true' });
  return `${base}?${params.toString()}`;
}

async function main() {
  const prisma = new PrismaClient();
  const csvPath = path.resolve(process.cwd(), 'data', 'construction_companies_enriched_v2.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found at ${csvPath}`);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true }) as CsvRow[];

  console.log(`Parsed ${records.length} rows`);

  let created = 0;
  let updated = 0;
  for (const row of records) {
    const mapped = mapCsvRowToExpert(row);
    const keyCity = (mapped.city || '').toLowerCase();
    const keyState = (mapped.state || '').toLowerCase();
    const existing = await prisma.expert.findFirst({
      where: {
        name: mapped.name,
        city: keyCity ? { equals: mapped.city } : undefined,
        state: keyState ? { equals: mapped.state } : undefined,
      },
    });
    const thumbnail = mapped.thumbnailUrl || fallbackAvatar(mapped.name);
    if (existing) {
      await prisma.expert.update({
        where: { id: existing.id },
        data: { ...mapped, thumbnailUrl: thumbnail },
      });
      updated += 1;
    } else {
      await prisma.expert.create({ data: { ...mapped, thumbnailUrl: thumbnail } });
      created += 1;
    }
  }

  // Ensure a deterministic E2E fixture exists
  const fixtureEmail = 'playwright.fixture@example.com';
  const fixture = await prisma.expert.findFirst({ where: { email: fixtureEmail } });
  if (!fixture) {
    await prisma.expert.create({
      data: {
        name: 'Playwright Fixture Mason',
        company: 'Fixture Co',
        email: fixtureEmail,
        city: 'Wilmington',
        state: 'NC',
        specialties: ['Sandstone', 'Masonry'],
        rating: 4.8,
        yearsExperience: 12,
        description: 'Specialist in sandstone in Wilmington, NC.',
        projectsCurrent: ['Fixture Project A'],
        projectsCompleted: ['Fixture Project B'],
        thumbnailUrl: fallbackAvatar('PF'),
      },
    });
  }

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  // For demo purposes only: store a simple hashed value. In production use bcrypt.
  const hashed = Buffer.from(adminPassword).toString('base64');
  const adminExisting = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExisting) {
    await prisma.user.create({ data: { email: adminEmail, name: 'Admin', role: 'admin', password: hashed } });
  } else {
    await prisma.user.update({ where: { email: adminEmail }, data: { password: hashed } });
  }

  console.log(`Seeding complete. created=${created}, updated=${updated}. Requesting vector index build...`);
  const fastapiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${fastapiUrl}/index/build`, { method: 'POST' });
    console.log('Index build status:', res.status);
  } catch (err) {
    console.warn('Index build failed (continuing). Ensure backend is running.', err);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

