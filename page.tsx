'use client';

import { useState } from 'react';
import HeroSection from '@/components/HeroSection';
import PhoneInputForm from '@/components/PhoneInputForm';
import ResultsGrid from '@/components/ResultsGrid';
import AIRecommendation from '@/components/AIRecommendation';
import PriceHistoryChart from '@/components/PriceHistoryChart';
import TrendingDeals from '@/components/TrendingDeals';
import type { PhoneInput, ComparisonResult } from '@/types';

export default function Home() {
  const [results, setResults] = useState<ComparisonResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [phoneInput, setPhoneInput] = useState<PhoneInput | null>(null);

  const handleCompare = async (input: PhoneInput) => {
    setLoading(true);
    setPhoneInput(input);
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <HeroSection />
      <PhoneInputForm onCompare={handleCompare} loading={loading} />
      {results && phoneInput && (
        <>
          <AIRecommendation results={results} phoneInput={phoneInput} />
          <ResultsGrid results={results} />
          <PriceHistoryChart />
        </>
      )}
      <TrendingDeals />
    </main>
  );
}
