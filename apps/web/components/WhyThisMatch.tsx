export function WhyThisMatch({ lines }: { lines: string[] }) {
  return (
    <div>
      <h4 className="font-semibold text-sm mb-2">Why this match?</h4>
      <ul className="list-disc list-inside text-sm text-gray-700">
        {lines.slice(0, 5).map((l, i) => (
          <li key={`${l}-${i}`}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

