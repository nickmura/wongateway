# WonWay 

A payment gateway KRW stablecoin payments on Shopify, WooCommerce and direct invoices

## Features

- **Shopify Integration**: Real-time payment processing via webhooks
- **WooCommerce integration**: Real-time payment gateway redirect flow via webhooks
- **Direct Invoices**: Merchant dashboard for custom payment links  
- **Multi-token Support**: KAIA native token and KRW stablecoin
- **Wallet Authentication**: No passwords, Web3 wallet-based auth


## Quick Start Integrating your own store (Shopify)

**Disclaimer**: This is for testing purposes only. The KRW stablecoin operates on the Kairos Testnet, and our faucet is available [here](https://wonway.xyz/faucet). Shopify integration requires Admin API access through custom Shopify Apps.


- Add a custom payment gateway on your shopify dashboard Payments > Manual Payments > and name it KRW
- Go to your Admin Panel and go to "Apps and Sales channels" and then 'Develop apps', click "allow custom apps"
- Then click "Create an app"
- Head over to write_order_edits and read_order_edits, & write_orders & read_orders and enable them in the Admin API access scopes in Configuration section of your app
- Then in API credentials, Install the app, and copy your Admin API access token and paste it in the user dashboard, alongside the URL of your shopify store. This can only be revealed once.
- Now, in Admin settings in Notifications > Webhooks, create a webhook for Order Creation.
- Paste the link for the webhook URL in the shopify dashboard in the URL input, with the JSON format (2025-10 Release candidate API version, if relevant)
- Click save.
- Now, in order for the customer to get the invoice link in their email, we need to modify the email confimration. Head over to Notifications > Customer notifications > Order creation
- Edit the code for it and copy and paste in the [order-creation-email-notification-krw.liquid](https://github.com/wongateway/wongateway/blob/main/src/lib/order-creation-email-notification-krw.liquid) file into the Edit Code (replace) which will send the payment link to the customer.
- Click save
- Test an order via [](https://github.com/)and sent it to yourself and it should be working 
- Alternatively you can run locally or own your own hosting of this repo, just change the domain from wonway.xyz to your own


## Quick Start Integrating your own store (WooCommerce)

Refer to to the [WooCommerce plugin repository](https://kaia-commerce.vercel.app) for instructions

## Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/nickmura/wonway.git
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
SHOPIFY_API_ACCESS_TOKEN="shpat_xxx" # Optional if running payment gateway locally
SHOPIFY_SHOP_DOMAIN="store.myshopify.com" # Optional if running payment gateway locally
```

## Usage

**Merchants**: Connect wallet → `/dashboard` → Create invoices → Share payment links

**Customers**: Receive link → Connect wallet → Select token → Complete paymentYes

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
