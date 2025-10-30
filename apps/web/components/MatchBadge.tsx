export function MatchBadge({ score }: { score: number }) {
  const color = score < 65 ? 'bg-red-100 text-red-700' : score <= 80 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700';
  return (
    <span data-testid="match-badge" className={`text-xs font-semibold px-2 py-1 rounded-lg ${color}`}>Match {score.toFixed(1)}%</span>
  );
}

