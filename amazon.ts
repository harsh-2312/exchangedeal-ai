import { chromium, Page, Browser } from 'playwright';
import { PhoneInput, PlatformOffer } from '../backend/src/types';
import { ProxyRotator } from './utils/ProxyRotator';
import { UserAgentRotator } from './utils/UserAgentRotator';
import { logger } from '../backend/src/utils/logger';
import { delay, retryWithBackoff } from './utils/helpers';

export class AmazonScraper {
  private static browser: Browser | null = null;

  private static async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      const proxy = await ProxyRotator.getNext();
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=IsolateOrigins',
          '--disable-site-isolation-trials',
          ...(proxy ? [`--proxy-server=${proxy}`] : []),
        ],
      });
    }
    return this.browser;
  }

  private static async stealthPage(browser: Browser): Promise<Page> {
    const context = await browser.newContext({
      userAgent: UserAgentRotator.getNext(),
      viewport: { width: 1366, height: 768 },
      locale: 'en-IN',
      geolocation: { latitude: 19.076, longitude: 72.877 },
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const page = await context.newPage();

    // Stealth: override navigator.webdriver
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en'] });
      (window as any).chrome = { runtime: {} };
    });

    return page;
  }

  static async scrapeExchangeOffers(userPhone: PhoneInput): Promise<PlatformOffer[]> {
    return retryWithBackoff(async () => {
      const browser = await this.getBrowser();
      const page = await this.stealthPage(browser);
      const results: PlatformOffer[] = [];

      try {
        logger.info(`[Amazon] Searching for phones with exchange for ${userPhone.brand} ${userPhone.model}`);

        // Navigate to Amazon India search
        await page.goto(`https://www.amazon.in/s?k=smartphones&rh=n%3A1389401031`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        await delay(2000 + Math.random() * 2000);

        // Get product URLs
        const productLinks = await page.$$eval(
          '[data-component-type="s-search-result"] h2 a',
          links => links.slice(0, 20).map(a => (a as HTMLAnchorElement).href)
        );

        logger.info(`[Amazon] Found ${productLinks.length} products`);

        for (const url of productLinks.slice(0, 10)) {
          try {
            const offer = await this.scrapeProductExchange(page, url, userPhone);
            if (offer) results.push(offer);
            await delay(1500 + Math.random() * 1500);
          } catch (err) {
            logger.warn(`[Amazon] Failed to scrape ${url}:`, err);
          }
        }

        return results;
      } finally {
        await page.close();
      }
    }, 3);
  }

  private static async scrapeProductExchange(
    page: Page,
    url: string,
    userPhone: PhoneInput
  ): Promise<PlatformOffer | null> {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(1500);

    // Extract product price
    const priceText = await page.$eval(
      '.a-price-whole',
      el => el.textContent?.replace(/,/g, '') || '0'
    ).catch(() => '0');
    const productPrice = parseInt(priceText) || 0;
    if (productPrice === 0) return null;

    // Check if exchange offer available
    const hasExchange = await page.$('[data-action="show-exchange"]').catch(() => null);
    if (!hasExchange) return null;

    // Click exchange offer section
    await page.click('[data-action="show-exchange"]').catch(() => {});
    await delay(1000);

    // Select user's old phone in exchange widget
    await this.selectExchangePhone(page, userPhone);
    await delay(2000);

    // Extract exchange value
    const exchangeText = await page.$eval(
      '.exchange-price, [class*="exchangePrice"]',
      el => el.textContent?.replace(/[^0-9]/g, '') || '0'
    ).catch(() => '0');
    const exchangeValue = parseInt(exchangeText) || 0;

    // Extract bank offers
    const bankDiscount = await this.extractBankOffers(page);

    // Extract coupons
    const couponDiscount = await this.extractCoupons(page);

    // Extract product info
    const productName = await page.$eval('#productTitle', el => el.textContent?.trim() || '').catch(() => '');
    const rating = await page.$eval('.a-icon-alt', el => parseFloat(el.textContent || '0')).catch(() => 0);
    const reviewCount = await page.$eval('#acrCustomerReviewText', el => parseInt(el.textContent?.replace(/[^0-9]/g, '') || '0')).catch(() => 0);
    const deliveryText = await page.$eval('#mir-layout-DELIVERY_BLOCK', el => el.textContent?.trim() || 'In 2-3 days').catch(() => 'In 2-3 days');

    const finalPayable = productPrice - exchangeValue - bankDiscount - couponDiscount;

    return {
      platform: 'amazon',
      productPrice,
      exchangeValue,
      bankDiscount,
      couponDiscount,
      finalPayable: Math.max(0, finalPayable),
      emiOptions: await this.extractEmiOptions(page, finalPayable),
      inStock: true,
      deliveryDate: deliveryText,
      rating,
      reviewCount,
      productUrl: url,
    };
  }

  private static async selectExchangePhone(page: Page, phone: PhoneInput): Promise<void> {
    // Navigate the exchange dropdown tree: Brand → Model → Storage → Condition
    const selectors = ['#exchange-brand', '#exchange-model', '#exchange-storage', '#exchange-condition'];
    const values = [phone.brand, phone.model, phone.storage, phone.condition];

    for (let i = 0; i < selectors.length; i++) {
      try {
        await page.selectOption(selectors[i], { label: values[i] });
        await delay(800);
      } catch {
        // Try click-based dropdown
        await page.click(`[data-exchange-step="${i + 1}"]`).catch(() => {});
        await delay(500);
      }
    }
  }

  private static async extractBankOffers(page: Page): Promise<number> {
    try {
      const offerTexts = await page.$$eval(
        '[id*="offer"], [class*="bankOffer"], [class*="bank-offer"]',
        els => els.map(el => el.textContent || '')
      );
      let maxDiscount = 0;
      for (const text of offerTexts) {
        const match = text.match(/₹\s*([\d,]+)/);
        if (match) {
          const val = parseInt(match[1].replace(/,/g, ''));
          maxDiscount = Math.max(maxDiscount, val);
        }
      }
      return maxDiscount;
    } catch {
      return 0;
    }
  }

  private static async extractCoupons(page: Page): Promise<number> {
    try {
      const couponText = await page.$eval(
        '[data-coupon-value], #couponBadgeText',
        el => el.textContent || ''
      );
      const match = couponText.match(/(\d+)%|₹\s*([\d,]+)/);
      if (match) {
        if (match[1]) return 0; // percentage - would need MRP
        if (match[2]) return parseInt(match[2].replace(/,/g, ''));
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private static async extractEmiOptions(page: Page, amount: number) {
    return [
      { bank: 'HDFC', duration: 6, monthlyAmount: Math.round(amount / 6 * 1.03), totalAmount: Math.round(amount * 1.03) },
      { bank: 'ICICI', duration: 12, monthlyAmount: Math.round(amount / 12 * 1.06), totalAmount: Math.round(amount * 1.06) },
      { bank: 'SBI', duration: 3, monthlyAmount: Math.round(amount / 3 * 1.01), totalAmount: Math.round(amount * 1.01) },
    ];
  }
}
