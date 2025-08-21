# Kaia Commerce

A Web3 payment gateway for Kaia blockchain enabling KRW stablecoin payments on Shopify and direct invoices.

## Features

- **Shopify Integration**: Real-time payment processing via webhooks
- **Direct Invoices**: Merchant dashboard for custom payment links  
- **Multi-token Support**: KAIA native token and KRW stablecoin
- **Wallet Authentication**: No passwords, Web3 wallet-based auth

## Quick Start

**Shopify/e-commerce integration instructions to be added**


1. **Clone & Install**
   ```bash
   git clone https://github.com/nickmura/kaia-commerce.git
   cd kaia-commerce && npm install
   ```

2. **Setup Database**
   ```bash
   # Configure .env with DATABASE_URL
   npx prisma migrate dev && npx prisma generate
   ```

3. **Run Development**
   ```bash
   npm run dev
   ```

## Environment Variables

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/kaia-commerce"
SHOPIFY_API_ACCESS_TOKEN="shpat_xxx" # Optional
SHOPIFY_SHOP_DOMAIN="store.myshopify.com" # Optional
```

## Usage

**Merchants**: Connect wallet → `/dashboard` → Create invoices → Share payment links

**Customers**: Receive link → Connect wallet → Select token → Complete payment

## Tech Stack

- Next.js 15 + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL  
- Wagmi + RainbowKit + Viem (Web3)
- Kaia Network integration

## API Endpoints

- `POST /api/merchants/auth` - Wallet authentication
- `GET /api/merchants/invoices` - Fetch invoices
- `POST /api/merchants/invoices` - Create invoice
- `GET /pay?orderId=xxx` - Payment page

## Development

```bash
npm run build    # Build for production
npm run test     # Run tests
npx prisma studio # Database GUI
```

---

**Live Demo**: [kaia-commerce.vercel.app](https://kaia-commerce.vercel.app)

**Live Demo (Shopify)**: [kaia-commerce.myshopify.com](https://kaia-commerce.myshopify.com)




**Built for the Kaia ecosystem**
