import { describe, it, expect } from 'vitest';
import { parse } from 'csv-parse/sync';
import { parseMulti, mapCsvRowToExpert } from '../../../scripts/utils/csv';

describe('CSV parsing utils', () => {
  it('parseMulti splits on | and , and trims', () => {
    expect(parseMulti('a|b, c')).toEqual(['a', 'b', 'c']);
    expect(parseMulti('')).toEqual([]);
    expect(parseMulti(undefined)).toEqual([]);
  });

  it('maps a CSV row to Expert fields', () => {
    const row = {
      company_name: 'Acme Masonry',
      city: 'Wilmington',
      state: 'NC',
      description: 'Stone and sandstone specialists',
      rating: '4.6',
      years_experience: '12',
      lat: '34.2257',
      lon: '-77.9447',
      specialties: 'Sandstone|Masonry',
      certifications: 'Lead Certified, OSHA',
      projects_current: 'Project A|Project B',
      projects_completed: 'Proj X, Proj Y',
      thumbnail_url: '',
    } as any;
    const mapped = mapCsvRowToExpert(row);
    expect(mapped.name).toBe('Acme Masonry');
    expect(mapped.city).toBe('Wilmington');
    expect(mapped.state).toBe('NC');
    expect(mapped.specialties).toEqual(['Sandstone', 'Masonry']);
    expect(mapped.certifications).toEqual(['Lead Certified', 'OSHA']);
    expect(mapped.projectsCurrent.length).toBe(2);
    expect(mapped.projectsCompleted.length).toBe(2);
  });

  it('parses sample CSV text end-to-end', () => {
    const csv = `company_name,city,state,description,specialties\nAcme Masonry,Wilmington,NC,Stone and sandstone,"Sandstone|Masonry"`;
    const rows = parse(csv, { columns: true, skip_empty_lines: true }) as any[];
    expect(rows.length).toBe(1);
    const mapped = mapCsvRowToExpert(rows[0]);
    expect(mapped.name).toBe('Acme Masonry');
    expect(mapped.specialties).toEqual(['Sandstone', 'Masonry']);
  });
});

