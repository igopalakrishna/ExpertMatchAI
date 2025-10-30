export function KeywordChips({ terms }: { terms: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {terms.map((t) => (
        <span key={t} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-lg">{t}</span>
      ))}
    </div>
  );
}

