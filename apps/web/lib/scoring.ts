export type FilterParams = {
  state?: string;
  city?: string;
  specialties?: string[];
  minRating?: number;
  yearsExperience?: number;
};

export function normalizeScore(raw: number): number {
  const clamped = Math.max(0, Math.min(1, raw));
  return Math.round(clamped * 1000) / 10; // one decimal place
}

export function combineScores(params: {
  sem: number; // 0-1
  kw: number; // 0-1
  filt: number; // 0-1
}): number {
  const wSem = parseFloat(process.env.MATCH_W_SEM || '0.6');
  const wKw = parseFloat(process.env.MATCH_W_KW || '0.25');
  const wFilt = parseFloat(process.env.MATCH_W_FILT || '0.15');
  const raw = wSem * params.sem + wKw * params.kw + wFilt * params.filt;
  return normalizeScore(raw);
}

export function filterBonus(filters: FilterParams, expert: any): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  if (filters.state && expert.state && filters.state.toLowerCase() === expert.state.toLowerCase()) {
    score += 0.4;
    reasons.push(`State match (${filters.state}) (0.40)`);
  } else if (filters.state && expert.state && filters.state[0] === expert.state[0]) {
    score += 0.15; // loose proximity
    reasons.push(`${filters.state} proximity (0.15)`);
  }
  if (filters.city && expert.city && filters.city.toLowerCase() === expert.city.toLowerCase()) {
    score += 0.3;
    reasons.push(`City match (${filters.city}) (0.30)`);
  }
  if (filters.specialties && filters.specialties.length > 0) {
    const set = new Set((expert.specialties || []).map((s: string) => s.toLowerCase()));
    for (const tag of filters.specialties) {
      if (set.has(tag.toLowerCase())) {
        score += 0.15;
        reasons.push(`${tag} (0.15)`);
      }
    }
  }
  if (filters.minRating && expert.rating && expert.rating >= filters.minRating) {
    score += 0.05;
    reasons.push(`rating≥${filters.minRating} (0.05)`);
  }
  return { score: Math.min(1, score), reasons };
}

export function colorForScore(score: number): 'red' | 'orange' | 'green' {
  if (score < 65) return 'red';
  if (score <= 80) return 'orange';
  return 'green';
}

