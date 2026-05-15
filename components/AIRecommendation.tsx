import type { ComparisonResult, PhoneInput } from '@/types';

interface AIRecommendationProps {
  results: ComparisonResult[];
  phoneInput: PhoneInput;
}

export default function AIRecommendation({ results, phoneInput }: AIRecommendationProps) {
  const best = results.reduce((a, b) => (a.price < b.price ? a : b), results[0]);

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-white mb-4">AI Recommendation</h2>
      <div className="bg-gray-800 rounded p-4 text-white">
        <p>
          Best deal for <strong>{phoneInput.brand} {phoneInput.model}</strong>:{' '}
          <strong>{best?.platform}</strong> at <strong className="text-green-400">₹{best?.price.toLocaleString()}</strong>
        </p>
      </div>
    </section>
  );
}
