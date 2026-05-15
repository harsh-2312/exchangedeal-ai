import type { ComparisonResult } from '@/types';

interface ResultsGridProps {
  results: ComparisonResult[];
}

export default function ResultsGrid({ results }: ResultsGridProps) {
  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-white mb-4">Results</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result, i) => (
          <div key={i} className="bg-gray-800 rounded p-4 text-white">
            <p className="font-bold">{result.platform}</p>
            <p className="text-green-400">₹{result.price.toLocaleString()}</p>
            {result.title && <p className="text-sm text-gray-400 mt-1">{result.title}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
