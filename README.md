# ExchangeDeal AI 🇮🇳

> India's smartest smartphone exchange comparison platform — compare Amazon & Flipkart exchange deals, get AI-powered upgrade recommendations, and never miss a great deal.

---

## 🚀 Live Demo

[exchangedeal.ai](https://exchangedeal.ai) *(production URL)*

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Deployment Guide](#deployment-guide)
- [API Reference](#api-reference)
- [Scraper Architecture](#scraper-architecture)
- [Database Design](#database-design)

---

## ✨ Features

### Core Features
- **Real-Time Comparison** — Live exchange values from Amazon & Flipkart
- **AI Recommendation Engine** — Best upgrade suggestion for your current phone
- **Price History Charts** — Track price trends over time
- **Smart Alerts** — Notify when prices drop or exchange values rise
- **Exchange Calculator** — Instant final payable amount breakdown

### User Features
- JWT-based authentication (signup/login)
- Save favorite phones
- Create price alerts (email, Telegram, push)
- Compare multiple phones simultaneously
- Price drop history tracking

### Admin Panel
- Scraping job monitoring
- Failed scraper logs
- Manual scrape triggers
- Analytics dashboard
- Offer management

### Performance
- Redis caching (30-min TTL for comparisons)
- Background cron jobs every 3 hours
- Lazy loading + infinite scroll
- CDN-optimized images

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, ShadCN UI, Framer Motion |
| Backend | Node.js, Express.js, TypeScript |
| Scraping | Playwright (stealth), Proxy rotation, UA rotation |
| Database | MongoDB 7.0 + Mongoose |
| Cache | Redis 7.2 |
| Auth | JWT + bcrypt |
| Notifications | Nodemailer, Telegram Bot API, Web Push |
| Deployment | Docker, Nginx, GitHub Actions CI/CD |

---

## 📁 Project Structure

```
exchangedeal-ai/
├── frontend/                    # Next.js 15 app
│   ├── src/
│   │   ├── app/                 # App router pages
│   │   │   ├── page.tsx         # Home / compare page
│   │   │   ├── results/         # Results page
│   │   │   ├── phone/[id]/      # Phone detail page
│   │   │   ├── admin/           # Admin panel
│   │   │   └── api/             # Next.js API routes (proxy to backend)
│   │   ├── components/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── PhoneInputForm.tsx
│   │   │   ├── ResultsGrid.tsx
│   │   │   ├── PhoneCard.tsx
│   │   │   ├── AIRecommendation.tsx
│   │   │   ├── PriceHistoryChart.tsx
│   │   │   ├── TrendingDeals.tsx
│   │   │   └── admin/
│   │   ├── types/               # TypeScript interfaces
│   │   ├── lib/                 # API client, utilities
│   │   └── hooks/               # Custom React hooks
│   ├── public/
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── server.ts            # Express entry point
│   │   ├── routes/
│   │   │   ├── compare.ts       # POST /api/compare
│   │   │   ├── phones.ts        # GET /api/phones
│   │   │   ├── offers.ts        # GET /api/offers
│   │   │   ├── alerts.ts        # POST /api/alerts
│   │   │   ├── auth.ts          # POST /api/auth/login|signup
│   │   │   └── admin.ts         # Admin routes
│   │   ├── services/
│   │   │   ├── ComparisonEngine.ts
│   │   │   ├── AIRecommendation.ts
│   │   │   ├── NotificationService.ts
│   │   │   └── CronService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT middleware
│   │   │   ├── validate.ts      # Input validation
│   │   │   └── errorHandler.ts
│   │   └── utils/
│   │       └── logger.ts
│   └── Dockerfile
│
├── scrapers/
│   ├── amazon.ts                # Amazon Playwright scraper
│   ├── flipkart.ts              # Flipkart Playwright scraper
│   ├── utils/
│   │   ├── ProxyRotator.ts
│   │   ├── UserAgentRotator.ts
│   │   └── helpers.ts
│   └── Dockerfile
│
├── database/
│   ├── schemas.ts               # All Mongoose schemas
│   └── init.js                  # MongoDB init script
│
├── docker/
│   └── docker-compose.yml
│
├── nginx/
│   └── nginx.conf
│
└── docs/
    └── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- MongoDB 7+ (or use Docker)
- Redis 7+ (or use Docker)

### Option 1: Docker (Recommended)

```bash
# Clone the repo
git clone https://github.com/yourusername/exchangedeal-ai.git
cd exchangedeal-ai

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start all services
docker compose -f docker/docker-compose.yml up -d

# Visit http://localhost:3000
```

### Option 2: Manual Setup

```bash
# 1. Backend
cd backend
npm install
npm run dev    # Starts on :5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev    # Starts on :3000

# 3. Scrapers (new terminal)
cd scrapers
npm install
npm run start
```

---

## 🔐 Environment Setup

Create `.env` in project root:

```env
# App
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/exchangedeal
REDIS_URL=redis://localhost:6379

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Proxies (comma-separated)
PROXY_LIST=http://user:pass@proxy1:port,http://user:pass@proxy2:port

# Admin
ADMIN_EMAIL=admin@exchangedeal.ai
ADMIN_PASSWORD=strong-admin-password
```

---

## 🌐 API Reference

### POST /api/compare
Compare exchange offers across platforms.

**Request:**
```json
{
  "brand": "Apple",
  "model": "iPhone 13",
  "storage": "128GB",
  "ram": "4GB",
  "condition": "Good",
  "pincode": "400001"
}
```

**Response:**
```json
{
  "results": [...],
  "recommendation": {
    "bestPhone": "iPhone 15",
    "bestPlatform": "flipkart",
    "finalPayable": 42999,
    "reasoning": "Your iPhone 13 gets ₹32,000 exchange on Flipkart..."
  },
  "totalFound": 24,
  "scrapedAt": "2024-05-14T12:00:00.000Z"
}
```

### GET /api/phones
List all phones in database.

Query params: `?brand=Apple&category=flagship&page=1&limit=20`

### GET /api/offers?phoneId=xxx
Get current offers for a specific phone.

### POST /api/alerts
Create a price alert.

```json
{
  "phoneModel": "iPhone 15",
  "platform": "both",
  "type": "price_drop",
  "targetPrice": 50000,
  "notifyVia": ["email", "telegram"]
}
```

### POST /api/auth/signup
### POST /api/auth/login

---

## 🤖 Scraper Architecture

```
Queue System (Bull + Redis)
├── Amazon Scraper Worker
│   ├── Stealth Playwright browser
│   ├── Proxy rotation per request
│   ├── UA rotation
│   ├── Exchange form automation
│   └── Retry with exponential backoff
│
├── Flipkart Scraper Worker
│   ├── Same stealth setup
│   ├── Modal interaction for exchange
│   └── Anti-bot bypass
│
└── Scheduler (node-cron)
    ├── Every 3h: Full scrape top 100 phones
    ├── Every 30m: Update trending phones
    └── Every 1h: Check & trigger alerts
```

---

## 🗄 Database Design

### Collections
- **users** — Auth, saved phones, alert preferences
- **phones** — Phone catalog with variants
- **exchange_values** — Cached exchange values by condition
- **offers** — Latest scraped offers per platform
- **scrape_logs** — Audit trail for all scraping runs
- **alerts** — User-defined price/exchange alerts
- **price_history** — Time-series price data for charts

---

## 🚀 Deployment Guide

### Production on Ubuntu VPS

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Clone and configure
git clone https://github.com/yourusername/exchangedeal-ai.git
cd exchangedeal-ai
cp .env.example .env && nano .env

# 3. SSL with Let's Encrypt
certbot certonly --standalone -d exchangedeal.ai

# 4. Deploy
docker compose -f docker/docker-compose.yml up -d --build

# 5. Monitor
docker compose logs -f
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        run: ssh ${{ secrets.VPS_HOST }} 'cd /app && git pull && docker compose up -d --build'
```

---

## 📊 Admin Panel

Access at `/admin` (requires admin role JWT).

Features:
- Live scraping job status
- Failed scraper error logs
- Manual trigger buttons
- Analytics: daily comparisons, popular phones, conversion funnel
- Offer management (manual overrides)
- User management

---

## 📱 Mobile App (Roadmap)

React Native app planned using the same backend API.

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

Built with ❤️ for Indian smartphone buyers
"# exchangedeal-ai" 
"# exchangedeal-ai" 
"# exchangedeal-ai" 
