import { chromium, Page, Browser } from 'playwright';
import { PhoneInput, PlatformOffer } from '../backend/src/types';
import { ProxyRotator } from './utils/ProxyRotator';
import { UserAgentRotator } from './utils/UserAgentRotator';
import { logger } from '../backend/src/utils/logger';
import { delay, retryWithBackoff } from './utils/helpers';

export class FlipkartScraper {
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
          ...(proxy ? [`--proxy-server=${proxy}`] : []),
        ],
      });
    }
    return this.browser;
  }

  static async scrapeExchangeOffers(userPhone: PhoneInput): Promise<PlatformOffer[]> {
    return retryWithBackoff(async () => {
      const browser = await this.getBrowser();
      const context = await browser.newContext({
        userAgent: UserAgentRotator.getNext(),
        locale: 'en-IN',
        extraHTTPHeaders: { 'Accept-Language': 'en-IN,en;q=0.9' },
      });

      const page = await context.newPage();
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      const results: PlatformOffer[] = [];

      try {
        logger.info(`[Flipkart] Searching for exchange offers for ${userPhone.brand} ${userPhone.model}`);

        await page.goto('https://www.flipkart.com/search?q=smartphones&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // Handle login popup
        await page.keyboard.press('Escape').catch(() => {});
        await delay(1000);

        // Get product links
        const productLinks = await page.$$eval(
          'a[href*="/p/"]',
          links => [...new Set(links.map(a => (a as HTMLAnchorElement).href))].slice(0, 20)
        );

        logger.info(`[Flipkart] Found ${productLinks.length} products`);

        for (const url of productLinks.slice(0, 10)) {
          try {
            const offer = await this.scrapeProductExchange(page, url, userPhone);
            if (offer) results.push(offer);
            await delay(2000 + Math.random() * 1000);
          } catch (err) {
            logger.warn(`[Flipkart] Failed to scrape ${url}:`, err);
          }
        }

        return results;
      } finally {
        await page.close();
        await context.close();
      }
    }, 3);
  }

  private static async scrapeProductExchange(
    page: Page,
    url: string,
    userPhone: PhoneInput
  ): Promise<PlatformOffer | null> {
    await page.goto(`https://www.flipkart.com${new URL(url).pathname}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await delay(2000);

    // Extract price - Flipkart uses different class structures
    const priceText = await page.$eval(
      '._30jeq3._16Jk6d, ._30jeq3',
      el => el.textContent?.replace(/[₹,]/g, '').trim() || '0'
    ).catch(() => '0');
    const productPrice = parseInt(priceText) || 0;
    if (productPrice === 0) return null;

    // Find and click exchange offer
    const exchangeBtn = await page.$('._3YgFIa, [class*="exchange"], button:has-text("Exchange")');
    if (!exchangeBtn) return null;

    await exchangeBtn.click();
    await delay(1500);

    // Fill exchange form - Flipkart's multi-step exchange modal
    await this.fillExchangeForm(page, userPhone);
    await delay(2000);

    // Extract exchange value from modal
    const exchangeText = await page.$eval(
      '._1FH0tX, [class*="exchangePrice"], [class*="exchange-value"]',
      el => el.textContent?.replace(/[^0-9]/g, '') || '0'
    ).catch(() => '0');
    const exchangeValue = parseInt(exchangeText) || 0;

    // Bank offers
    const bankDiscount = await this.extractFlipkartBankOffers(page);

    // Flipkart Super Coins / coupons
    const couponDiscount = await this.extractFlipkartCoupons(page);

    const productName = await page.$eval('.B_NuCI, ._35KyD6', el => el.textContent?.trim() || '').catch(() => '');
    const ratingText = await page.$eval('._3LWZlK', el => el.textContent?.trim() || '0').catch(() => '0');
    const reviewText = await page.$eval('._2_R_DZ span', el => el.textContent?.replace(/[^0-9]/g, '') || '0').catch(() => '0');
    const deliveryText = await page.$eval('._1YokD2 > div:last-child', el => el.textContent?.trim() || 'In 2-4 days').catch(() => 'In 2-4 days');

    const finalPayable = productPrice - exchangeValue - bankDiscount - couponDiscount;

    return {
      platform: 'flipkart',
      productPrice,
      exchangeValue,
      bankDiscount,
      couponDiscount,
      finalPayable: Math.max(0, finalPayable),
      emiOptions: this.getFlipkartEmiOptions(finalPayable),
      inStock: true,
      deliveryDate: deliveryText,
      rating: parseFloat(ratingText) || 0,
      reviewCount: parseInt(reviewText) || 0,
      productUrl: url,
    };
  }

  private static async fillExchangeForm(page: Page, phone: PhoneInput): Promise<void> {
    // Step 1: Select brand
    await page.click(`[data-id="${phone.brand.toLowerCase()}"], li:has-text("${phone.brand}")`).catch(async () => {
      await page.selectOption('select[name="brand"]', phone.brand).catch(() => {});
    });
    await delay(700);

    // Step 2: Select model
    await page.click(`li:has-text("${phone.model}")`).catch(async () => {
      await page.selectOption('select[name="model"]', phone.model).catch(() => {});
    });
    await delay(700);

    // Step 3: Select storage
    await page.click(`li:has-text("${phone.storage}")`).catch(async () => {
      await page.selectOption('select[name="storage"]', phone.storage).catch(() => {});
    });
    await delay(700);

    // Step 4: Select condition
    const conditionMap: Record<string, string> = {
      'Excellent': 'Like New',
      'Good': 'Good',
      'Fair': 'Fair',
      'Poor': 'Acceptable',
    };
    await page.click(`li:has-text("${conditionMap[phone.condition] || phone.condition}")`).catch(() => {});
    await delay(700);

    // Confirm
    await page.click('button:has-text("Get Exchange Value"), button:has-text("Apply")').catch(() => {});
  }

  private static async extractFlipkartBankOffers(page: Page): Promise<number> {
    try {
      const offers = await page.$$eval(
        '._1Igs5b li, [class*="bankOffer"] li, ._3SiKqu li',
        els => els.map(el => el.textContent || '')
      );
      let maxDiscount = 0;
      for (const text of offers) {
        const pctMatch = text.match(/(\d+)%\s*off/i);
        const flatMatch = text.match(/₹\s*([\d,]+)\s*(?:off|instant)/i);
        if (flatMatch) maxDiscount = Math.max(maxDiscount, parseInt(flatMatch[1].replace(/,/g, '')));
      }
      return maxDiscount;
    } catch {
      return 0;
    }
  }

  private static async extractFlipkartCoupons(page: Page): Promise<number> {
    try {
      const couponText = await page.$eval('[class*="coupon"], ._2xmrME', el => el.textContent || '');
      const match = couponText.match(/Save ₹([\d,]+)/i);
      return match ? parseInt(match[1].replace(/,/g, '')) : 0;
    } catch {
      return 0;
    }
  }

  private static getFlipkartEmiOptions(amount: number) {
    return [
      { bank: 'HDFC', duration: 6, monthlyAmount: Math.round(amount / 6 * 1.02), totalAmount: Math.round(amount * 1.02) },
      { bank: 'Axis', duration: 12, monthlyAmount: Math.round(amount / 12 * 1.05), totalAmount: Math.round(amount * 1.05) },
      { bank: 'Kotak', duration: 3, monthlyAmount: Math.round(amount / 3), totalAmount: amount },
    ];
  }
}
