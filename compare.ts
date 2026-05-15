import { Router, Request, Response } from 'express';
import { redis } from '../server';
import { AmazonScraper } from '../../scrapers/amazon';
import { FlipkartScraper } from '../../scrapers/flipkart';
import { ComparisonEngine } from '../services/ComparisonEngine';
import { AIRecommendationService } from '../services/AIRecommendation';
import { PhoneInput } from '../types';
import { validatePhoneInput } from '../middleware/validate';
import { logger } from '../utils/logger';

export const compareRouter = Router();

compareRouter.post('/', validatePhoneInput, async (req: Request, res: Response) => {
  const input: PhoneInput = req.body;
  const cacheKey = `compare:${JSON.stringify(input)}`;

  try {
    // Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info('Cache hit for comparison');
      return res.json(JSON.parse(cached));
    }

    logger.info(`Starting comparison for ${input.brand} ${input.model}`);

    // Run scrapers in parallel
    const [amazonResults, flipkartResults] = await Promise.allSettled([
      AmazonScraper.scrapeExchangeOffers(input),
      FlipkartScraper.scrapeExchangeOffers(input),
    ]);

    const amazon = amazonResults.status === 'fulfilled' ? amazonResults.value : [];
    const flipkart = flipkartResults.status === 'fulfilled' ? flipkartResults.value : [];

    // Merge and compare
    const results = ComparisonEngine.merge(amazon, flipkart);

    // AI recommendation
    const recommendation = await AIRecommendationService.generate(results, input);

    const response = {
      results,
      recommendation,
      scrapedAt: new Date().toISOString(),
      totalFound: results.length,
    };

    // Cache for 30 minutes
    await redis.setex(cacheKey, 1800, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    logger.error('Comparison error:', error);
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

compareRouter.get('/best-deals', async (req: Request, res: Response) => {
  try {
    const cached = await redis.get('best-deals');
    if (cached) return res.json(JSON.parse(cached));

    const deals = await ComparisonEngine.getBestDeals();
    await redis.setex('best-deals', 900, JSON.stringify(deals));
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch best deals' });
  }
});
