import type { PhoneInput } from '@/types';

interface PhoneInputFormProps {
  onCompare: (input: PhoneInput) => void;
  loading: boolean;
}

export default function PhoneInputForm({ onCompare, loading }: PhoneInputFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const brand = (form.elements.namedItem('brand') as HTMLInputElement).value;
    const model = (form.elements.namedItem('model') as HTMLInputElement).value;
    onCompare({ brand, model });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto px-4">
      <input name="brand" placeholder="Brand (e.g. Samsung)" className="p-2 rounded bg-gray-800 text-white" required />
      <input name="model" placeholder="Model (e.g. Galaxy S23)" className="p-2 rounded bg-gray-800 text-white" required />
      <button type="submit" disabled={loading} className="p-2 bg-blue-600 text-white rounded disabled:opacity-50">
        {loading ? 'Comparing...' : 'Compare Prices'}
      </button>
    </form>
  );
}
