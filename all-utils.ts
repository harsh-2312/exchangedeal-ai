// ─── ProxyRotator.ts ──────────────────────────────────────────────────────────
export class ProxyRotator {
  private static proxies: string[] = (process.env.PROXY_LIST || '').split(',').filter(Boolean);
  private static index = 0;

  static getNext(): string | null {
    if (this.proxies.length === 0) return null;
    const proxy = this.proxies[this.index % this.proxies.length];
    this.index++;
    return proxy;
  }

  static markFailed(proxy: string) {
    this.proxies = this.proxies.filter(p => p !== proxy);
  }

  static count(): number {
    return this.proxies.length;
  }
}

// ─── UserAgentRotator.ts ──────────────────────────────────────────────────────
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
];

let uaIndex = 0;

export class UserAgentRotator {
  static getNext(): string {
    const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
    uaIndex++;
    return ua;
  }
}

// ─── helpers.ts ───────────────────────────────────────────────────────────────
export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        const waitMs = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(`Attempt ${attempt} failed, retrying in ${Math.round(waitMs)}ms...`);
        await delay(waitMs);
      }
    }
  }

  throw lastError;
}

export function normalizePrice(text: string): number {
  return parseInt(text.replace(/[₹,\s]/g, '')) || 0;
}

export function extractNumbers(text: string): number[] {
  return (text.match(/[\d,]+/g) || []).map(n => parseInt(n.replace(/,/g, ''))).filter(n => !isNaN(n));
}
