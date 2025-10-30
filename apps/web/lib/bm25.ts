import winkBM25 from 'wink-bm25-text-search';

export type Doc = { id: string; text: string };

export function createBM25Index(docs: Doc[]) {
  const bm25 = winkBM25();
  bm25.defineConfig({ fldWeights: { text: 1 } });
  bm25.definePrepTasks([
    (s: string) => s.toLowerCase(),
    (s: string) => s.replace(/[^a-z0-9\s]/g, ' '),
  ]);
  // Add documents with numeric keys aligned to incoming order
  docs.forEach((d, i) => bm25.addDoc({ text: d.text }, i));
  bm25.consolidate();
  return {
    search: (query: string, limit = 50) => {
      const results = bm25.search(query, 1e3) as Array<[number, number]>;
      return results.slice(0, limit);
    },
  };
}

export function normalizeBm25(scores: number[]): number[] {
  if (scores.length === 0) return scores;
  const max = Math.max(...scores);
  if (max === 0) return scores.map(() => 0);
  return scores.map((s) => s / max);
}

