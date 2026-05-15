export interface PhoneInput {
  brand: string;
  model: string;
  storage: string;
  ram: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  pincode: string;
}

export interface PlatformOffer {
  platform: 'amazon' | 'flipkart';
  productPrice: number;
  exchangeValue: number;
  bankDiscount: number;
  couponDiscount: number;
  finalPayable: number;
  emiOptions: EmiOption[];
  inStock: boolean;
  deliveryDate: string;
  rating: number;
  reviewCount: number;
  productUrl: string;
}

export interface EmiOption {
  bank: string;
  duration: number;
  monthlyAmount: number;
  totalAmount: number;
}

export interface ComparisonResult {
  id: string;
  phoneModel: string;
  brand: string;
  image: string;
  storage: string;
  ram: string;
  color: string;
  amazon: PlatformOffer | null;
  flipkart: PlatformOffer | null;
  bestPlatform: 'amazon' | 'flipkart' | null;
  bestFinalPrice: number;
  bestExchangeValue: number;
  valueScore: number;
  trending: boolean;
  category: 'flagship' | 'midrange' | 'budget';
}

export interface PriceHistory {
  date: string;
  amazonPrice: number;
  flipkartPrice: number;
  exchangeValue: number;
}

export interface Alert {
  id: string;
  userId: string;
  phoneModel: string;
  platform: 'amazon' | 'flipkart' | 'both';
  type: 'price_drop' | 'exchange_rise';
  targetPrice: number;
  active: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  savedPhones: string[];
  alerts: Alert[];
}

export interface ScrapeLog {
  id: string;
  platform: 'amazon' | 'flipkart';
  status: 'success' | 'failed' | 'partial';
  phonesScraped: number;
  duration: number;
  errors: string[];
  timestamp: string;
}
