export type CsvRow = Record<string, string>;

export function parseMulti(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\||,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function mapCsvRowToExpert(row: CsvRow) {
  // Names / company
  const name = row['company_name'] || row['name'] || row['company_title'] || 'Unknown Expert';
  const company = row['company_name'] || row['company_title'] || null;

  const city = row['city'] || null;
  const state = row['state'] || null;

  // Description – prefer explicit, fallback to doc_text
  const description = row['description'] || row['doc_text'] || '';

  // Rating
  const rating = row['rating'] ? parseFloat(row['rating']) : null;

  // Years experience – either provided or derived from established_year
  let yearsExperience: number | null = null;
  if (row['years_experience']) yearsExperience = parseInt(row['years_experience'], 10);
  else if (row['established_year']) {
    const year = parseInt(row['established_year'], 10);
    const current = new Date().getFullYear();
    yearsExperience = year >= 1900 && year <= current ? current - year : null;
  }

  // Geo (optional)
  const lat = row['lat'] ? parseFloat(row['lat']) : null;
  const lon = row['lon'] ? parseFloat(row['lon']) : null;

  // Specialties / tags
  const specialties = parseMulti(
    row['specialties'] ||
      row['categories'] ||
      row['construction_categories'] ||
      row['structured_tags']
  );
  const certifications = parseMulti(row['certifications']);
  const projectsCurrent = parseMulti(row['projects_current']);
  const projectsCompleted = parseMulti(row['projects_completed']);
  const thumbnail_url = row['thumbnail_url'] || row['thumbnail'];

  return {
    name,
    company,
    email: row['email'] || null,
    phone: row['contact_number'] || row['reach_out_number'] || null,
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

