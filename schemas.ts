import mongoose, { Schema, Document } from 'mongoose';

// ─── User Schema ─────────────────────────────────────────────────────────────
interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  savedPhones: string[];
  alerts: mongoose.Types.ObjectId[];
  referralCode: string;
  referredBy?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  savedPhones: [{ type: String }],
  alerts: [{ type: Schema.Types.ObjectId, ref: 'Alert' }],
  referralCode: { type: String, unique: true },
  referredBy: { type: String },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);

// ─── Phone Schema ─────────────────────────────────────────────────────────────
interface IPhone extends Document {
  brand: string;
  model: string;
  variants: Array<{ storage: string; ram: string; color: string }>;
  image: string;
  category: 'flagship' | 'midrange' | 'budget';
  launchYear: number;
  specs: Record<string, string>;
}

const PhoneSchema = new Schema<IPhone>({
  brand: { type: String, required: true, index: true },
  model: { type: String, required: true, index: true },
  variants: [{
    storage: String,
    ram: String,
    color: String,
  }],
  image: String,
  category: { type: String, enum: ['flagship', 'midrange', 'budget'] },
  launchYear: Number,
  specs: { type: Map, of: String },
}, { timestamps: true });

PhoneSchema.index({ brand: 1, model: 1 });
export const Phone = mongoose.model<IPhone>('Phone', PhoneSchema);

// ─── Exchange Value Schema ────────────────────────────────────────────────────
interface IExchangeValue extends Document {
  phoneId: mongoose.Types.ObjectId;
  brand: string;
  model: string;
  storage: string;
  condition: string;
  amazonValue: number;
  flipkartValue: number;
  updatedAt: Date;
}

const ExchangeValueSchema = new Schema<IExchangeValue>({
  phoneId: { type: Schema.Types.ObjectId, ref: 'Phone' },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  storage: { type: String, required: true },
  condition: { type: String, required: true, enum: ['Excellent', 'Good', 'Fair', 'Poor'] },
  amazonValue: { type: Number, default: 0 },
  flipkartValue: { type: Number, default: 0 },
}, { timestamps: true });

ExchangeValueSchema.index({ brand: 1, model: 1, storage: 1, condition: 1 });
export const ExchangeValue = mongoose.model<IExchangeValue>('ExchangeValue', ExchangeValueSchema);

// ─── Offer Schema ─────────────────────────────────────────────────────────────
interface IOffer extends Document {
  platform: 'amazon' | 'flipkart';
  phoneId: mongoose.Types.ObjectId;
  productPrice: number;
  exchangeValue: number;
  bankDiscount: number;
  couponDiscount: number;
  finalPayable: number;
  productUrl: string;
  inStock: boolean;
  scrapedAt: Date;
}

const OfferSchema = new Schema<IOffer>({
  platform: { type: String, enum: ['amazon', 'flipkart'], required: true },
  phoneId: { type: Schema.Types.ObjectId, ref: 'Phone', required: true },
  productPrice: { type: Number, required: true },
  exchangeValue: { type: Number, default: 0 },
  bankDiscount: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  finalPayable: { type: Number, required: true },
  productUrl: String,
  inStock: { type: Boolean, default: true },
  scrapedAt: { type: Date, default: Date.now },
}, { timestamps: true });

OfferSchema.index({ platform: 1, phoneId: 1, scrapedAt: -1 });
export const Offer = mongoose.model<IOffer>('Offer', OfferSchema);

// ─── Scrape Log Schema ────────────────────────────────────────────────────────
interface IScrapeLog extends Document {
  platform: 'amazon' | 'flipkart';
  status: 'success' | 'failed' | 'partial';
  phonesScraped: number;
  duration: number;
  errors: string[];
  triggeredBy: 'cron' | 'manual' | 'user_request';
}

const ScrapeLogSchema = new Schema<IScrapeLog>({
  platform: { type: String, enum: ['amazon', 'flipkart'] },
  status: { type: String, enum: ['success', 'failed', 'partial'] },
  phonesScraped: { type: Number, default: 0 },
  duration: Number,
  errors: [String],
  triggeredBy: { type: String, enum: ['cron', 'manual', 'user_request'] },
}, { timestamps: true });

export const ScrapeLog = mongoose.model<IScrapeLog>('ScrapeLog', ScrapeLogSchema);

// ─── Alert Schema ─────────────────────────────────────────────────────────────
interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  phoneModel: string;
  platform: 'amazon' | 'flipkart' | 'both';
  type: 'price_drop' | 'exchange_rise';
  targetPrice: number;
  active: boolean;
  notifyVia: ('email' | 'telegram' | 'push')[];
  triggeredAt?: Date;
}

const AlertSchema = new Schema<IAlert>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  phoneModel: { type: String, required: true },
  platform: { type: String, enum: ['amazon', 'flipkart', 'both'], default: 'both' },
  type: { type: String, enum: ['price_drop', 'exchange_rise'], required: true },
  targetPrice: { type: Number, required: true },
  active: { type: Boolean, default: true },
  notifyVia: [{ type: String, enum: ['email', 'telegram', 'push'] }],
  triggeredAt: Date,
}, { timestamps: true });

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);

// ─── Price History Schema ─────────────────────────────────────────────────────
interface IPriceHistory extends Document {
  phoneId: mongoose.Types.ObjectId;
  platform: 'amazon' | 'flipkart';
  price: number;
  exchangeValue: number;
  finalPayable: number;
  recordedAt: Date;
}

const PriceHistorySchema = new Schema<IPriceHistory>({
  phoneId: { type: Schema.Types.ObjectId, ref: 'Phone', required: true, index: true },
  platform: { type: String, enum: ['amazon', 'flipkart'] },
  price: Number,
  exchangeValue: Number,
  finalPayable: Number,
  recordedAt: { type: Date, default: Date.now, index: true },
});

PriceHistorySchema.index({ phoneId: 1, platform: 1, recordedAt: -1 });
export const PriceHistory = mongoose.model<IPriceHistory>('PriceHistory', PriceHistorySchema);
