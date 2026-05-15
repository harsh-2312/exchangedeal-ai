export interface PhoneInput {
  brand: string;
  model: string;
  storage?: string;
  condition?: string;
}

export interface ComparisonResult {
  platform: string;
  price: number;
  url?: string;
  title?: string;
  rating?: number;
  reviews?: number;
}
