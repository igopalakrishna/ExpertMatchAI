export type CsvRow = Record<string, string>;

export function parseMulti(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\||,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function mapCsvRowToExpert(row: CsvRow) {
  const name = row['company_name'] || row['name'] || 'Unknown Expert';
  const city = row['city'] || null;
  const state = row['state'] || null;
  const description = row['description'] || '';
  const rating = row['rating'] ? parseFloat(row['rating']) : null;
  const yearsExperience = row['years_experience'] ? parseInt(row['years_experience'], 10) : null;
  const lat = row['lat'] ? parseFloat(row['lat']) : null;
  const lon = row['lon'] ? parseFloat(row['lon']) : null;
  const specialties = parseMulti(row['specialties'] || row['categories']);
  const certifications = parseMulti(row['certifications']);
  const projectsCurrent = parseMulti(row['projects_current']);
  const projectsCompleted = parseMulti(row['projects_completed']);
  const thumbnail_url = row['thumbnail_url'];

  return {
    name,
    company: row['company_name'] || null,
    email: row['email'] || null,
    phone: row['contact_number'] || null,
    website: row['website'] || null,
    city,
    state,
    latitude: lat,
    longitude: lon,
    specialties,
    certifications,
    yearsExperience,
    rating,
    projectsCurrent,
    projectsCompleted,
    description,
    thumbnailUrl: thumbnail_url || null,
  };
}

