# ConsultWays B2B Quote & Tiered Matrix Pro ⚡
> Ultra-modern Shopify App for High-Ticket B2B Merchants: One-Click Instant Quotes, Tiered Volume Discounts & Official Shopify Draft Order Invoicing.

---

## 🌟 Key Capabilities
- **Storefront Theme App Extension (Online Store 2.0):** Lightweight Vanilla JS & CSS widget displaying dynamic volume tier breakdown cards directly on product pages.
- **Glassmorphic Live Quote Calculator:** Instant calculation of tiered bulk savings, real-time subtotal, and buyer intake form.
- **Merchant Admin Command Center (`@shopify/polaris`):** High-ticket pipeline KPI cards ($ Pipeline Value, Pending Inquiries, Converted Revenue, Average Order Value).
- **1-Click Shopify Draft Order Engine:** Converts approved bulk quotes into official Shopify Draft Orders via Admin GraphQL (`draftOrderCreate`), automatically applies volume discounts, and dispatches branded checkout invoice links (`draftOrderSendInvoice`).
- **Official Recurring App Subscription Billing:** Fully compliant GraphQL `appSubscriptionCreate` recurring billing with 7-day free trial on Starter ($29/mo) and Pro Scale ($79/mo) plans.
- **Prisma ORM with SQLite (Dev) & PostgreSQL (Prod) Support.**

---

## 🚀 Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Setup database and seed realistic high-ticket B2B data
npm run setup

# 3. Build production bundle
npm run build

# 4. Start local server
npm run start
```
- Open Storefront Demo: [http://localhost:3000/demo](http://localhost:3000/demo)
- Open Merchant Admin Dashboard: [http://localhost:3000/app](http://localhost:3000/app)

---

## 📦 Deploying to Shopify Partner Dashboard
```bash
# Connect and run live tunnel
npx @shopify/cli app dev

# Deploy Theme App Extension
npx @shopify/cli app deploy
```
For complete details, see [`SHOPIFY_DEPLOYMENT_GUIDE.md`](./SHOPIFY_DEPLOYMENT_GUIDE.md).
