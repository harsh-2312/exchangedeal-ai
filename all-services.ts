// ─── auth.ts ─────────────────────────────────────────────────────────────────
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../database/schemas';
import { nanoid } from 'nanoid';

export const authRouter = Router();

authRouter.post('/signup', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be 8+ chars' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, referralCode: nanoid(8) });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

authRouter.get('/me', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(payload.userId).select('-passwordHash');
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ─── ComparisonEngine.ts ──────────────────────────────────────────────────────
import type { ComparisonResult, PlatformOffer } from '../types';
import { Offer, Phone } from '../../database/schemas';

export class ComparisonEngine {
  static merge(amazon: PlatformOffer[], flipkart: PlatformOffer[]): ComparisonResult[] {
    const phoneMap = new Map<string, ComparisonResult>();

    const addOffer = (offer: PlatformOffer, source: 'amazon' | 'flipkart') => {
      const key = this.normalizeKey(offer);
      if (!phoneMap.has(key)) {
        phoneMap.set(key, {
          id: key,
          phoneModel: key,
          brand: '',
          image: '📱',
          storage: '',
          ram: '',
          color: '',
          amazon: null,
          flipkart: null,
          bestPlatform: null,
          bestFinalPrice: 0,
          bestExchangeValue: 0,
          valueScore: 0,
          trending: false,
          category: 'midrange',
        });
      }
      const result = phoneMap.get(key)!;
      result[source] = offer;
    };

    amazon.forEach(o => addOffer(o, 'amazon'));
    flipkart.forEach(o => addOffer(o, 'flipkart'));

    return Array.from(phoneMap.values())
      .filter(r => r.amazon || r.flipkart)
      .map(r => {
        const prices = [r.amazon?.finalPayable, r.flipkart?.finalPayable].filter(Boolean) as number[];
        const exchanges = [r.amazon?.exchangeValue, r.flipkart?.exchangeValue].filter(Boolean) as number[];
        r.bestFinalPrice = Math.min(...prices);
        r.bestExchangeValue = Math.max(...exchanges);
        r.bestPlatform = (r.amazon?.finalPayable ?? Infinity) <= (r.flipkart?.finalPayable ?? Infinity) ? 'amazon' : 'flipkart';
        r.valueScore = r.bestExchangeValue / (r.bestFinalPrice || 1);
        return r;
      })
      .sort((a, b) => a.bestFinalPrice - b.bestFinalPrice);
  }

  static normalizeKey(offer: PlatformOffer): string {
    return offer.productUrl.match(/\/([A-Z0-9]{10})\//)?.[1] || offer.productUrl.slice(-20);
  }

  static async getBestDeals(): Promise<ComparisonResult[]> {
    const recent = await Offer.find({ scrapedAt: { $gte: new Date(Date.now() - 3 * 60 * 60 * 1000) } })
      .populate('phoneId').lean();
    // Process and return top deals
    return [];
  }
}

// ─── CronService.ts ───────────────────────────────────────────────────────────
import cron from 'node-cron';
import { AmazonScraper } from '../../scrapers/amazon';
import { FlipkartScraper } from '../../scrapers/flipkart';
import { Alert } from '../../database/schemas';
import { NotificationService } from './NotificationService';
import { logger } from '../utils/logger';

export class CronService {
  static init() {
    // Full scrape every 3 hours
    cron.schedule('0 */3 * * *', async () => {
      logger.info('[Cron] Starting scheduled scrape...');
      const popularPhones = [
        { brand: 'Apple', model: 'iPhone 15', storage: '128GB', ram: '6GB', condition: 'Good', pincode: '110001' },
        { brand: 'Samsung', model: 'Galaxy S24', storage: '256GB', ram: '8GB', condition: 'Good', pincode: '110001' },
        // Add more...
      ];
      for (const phone of popularPhones) {
        await Promise.allSettled([
          AmazonScraper.scrapeExchangeOffers(phone),
          FlipkartScraper.scrapeExchangeOffers(phone),
        ]);
      }
    });

    // Check alerts every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      logger.info('[Cron] Checking alerts...');
      const activeAlerts = await Alert.find({ active: true });
      for (const alert of activeAlerts) {
        await NotificationService.checkAndTrigger(alert);
      }
    });

    // Cleanup old scrape logs daily
    cron.schedule('0 0 * * *', async () => {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await (await import('../../database/schemas')).ScrapeLog.deleteMany({ createdAt: { $lt: cutoff } });
    });

    logger.info('[Cron] All jobs scheduled');
  }
}

// ─── NotificationService.ts ───────────────────────────────────────────────────
import nodemailer from 'nodemailer';
import TelegramBot from 'node-telegram-bot-api';
import webpush from 'web-push';
import { IAlert } from '../types';

export class NotificationService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  private static bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || '', { polling: false });

  static async checkAndTrigger(alert: any): Promise<void> {
    // Fetch current price/exchange for the phone
    // Compare against alert target
    // Trigger notification if condition met
  }

  static async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({ from: 'deals@exchangedeal.ai', to, subject, html });
  }

  static async sendTelegram(chatId: string, message: string): Promise<void> {
    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }
}
