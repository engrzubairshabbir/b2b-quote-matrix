# 🚀 ConsultWays B2B Quote & Tiered Matrix Pro
## Official Production & Shopify Deployment Guide

This app is 100% built, compiled, database-seeded, and production-ready for Shopify App Store deployment.

---

### 🌟 Quick Architecture & Features Summary

1. **Storefront Theme App Extension (Online Store 2.0):**
   - Located at: `extensions/b2b-quote-widget/`
   - Volume Wholesale Tier Pricing table (cards under product price).
   - High-converting **"Request B2B Bulk Quote"** button with glowing neon border.
   - Glassmorphic modal popup with real-time live quantity calculator and tiered savings meter.
   - 0-dependency pure Vanilla JS & CSS.

2. **Merchant Admin Dashboard (`app/routes/`):**
   - `app._index.jsx`: Pipeline KPI cards, high-ticket quote data table, status filtering, and quick approve/decline.
   - `app.quotes.$id.jsx`: Line items inspector, custom discount override, commercial freight adder, and **1-Click "Convert to Official Shopify Draft Order & Send Branded Invoice"** via Shopify GraphQL (`draftOrderCreate` + `draftOrderSendInvoice`).
   - `app.tiers.jsx`: Visual Tier Matrix Builder with real-time simulator sandbox.
   - `app.pricing.jsx`: Official Shopify Recurring App Billing with 7-Day Free Trial via GraphQL (`appSubscriptionCreate`).
   - `app.settings.jsx`: Neon brand color accent picker, CTA button text customization, and corporate requirements.
   - `demo.jsx`: Interactive storefront simulation mode at `http://localhost:3000/demo`.

3. **Database Schema (Prisma ORM):**
   - Models: `Session`, `AppConfig`, `TieredDiscountRule`, `QuoteRequest`.
   - SQLite pre-seeded for dev; instantly switchable to PostgreSQL for production.

---

## 🛠️ How to Deploy & Upload to Shopify (Step-by-Step)

### Step 1: Log in with Shopify CLI
In your terminal, authenticate with your Shopify Partner account:
```powershell
npx @shopify/cli auth login
```

### Step 2: Connect this App to Your Shopify Partner Dashboard
Run:
```powershell
npx @shopify/cli app dev
```
Shopify CLI will:
1. Ask you to select your Partner organization and App name (or create a new app: **ConsultWays B2B Quote & Tiered Matrix Pro**).
2. Automatically create a secure Cloudflare/ngrok tunnel.
3. Automatically update your `shopify.app.toml` with your `client_id` and URLs.
4. Provide a direct URL to install the app on your development store!

---

### Step 3: Deploy the Storefront Theme App Extension
To upload and publish the Theme App Extension (`extensions/b2b-quote-widget`):
```powershell
npx @shopify/cli app deploy
```
Once deployed:
1. Open your **Shopify Store Admin** &rarr; **Online Store** &rarr; **Themes** &rarr; Click **Customize**.
2. Navigate to your **Default Product** page template.
3. Click **Add block** under Product Information and select:
   👉 **"B2B Volume Pricing & Quote Modal"**
4. Drag it directly below the Price or Add to Cart button and click **Save**!

---

### Step 4: Production Hosting Deployment (Vercel / Render / Railway)

When hosting this app on a live cloud provider (Railway, Render, Fly.io, or Heroku):

1. **Environment Variables to Set:**
   ```env
   NODE_ENV=production
   PORT=3000
   SHOPIFY_API_KEY=your_partner_api_key
   SHOPIFY_API_SECRET=your_partner_api_secret
   SHOPIFY_APP_URL=https://your-live-domain.com
   SCOPES=write_draft_orders,read_draft_orders,read_products,write_products,read_customers,write_customers
   DATABASE_URL="file:dev.sqlite"  # or postgresql://user:password@host:5432/dbname
   ```

2. **Build and Start Commands:**
   - Build: `npm run setup && npm run build`
   - Start: `npm run start`

---

## 💻 Local Testing & Verification

1. **Storefront Simulation Mode:**
   - Open: [http://localhost:3000/demo](http://localhost:3000/demo)
   - Click the neon **"Request B2B Bulk Quote"** button or any tier card to test the live calculator and submit quote inquiries.

2. **Merchant Command Center:**
   - Open: [http://localhost:3000/app](http://localhost:3000/app)
   - Inspect all quotes, filter by status, and click **"Inspect & Convert"** to generate official Shopify Draft Orders!

3. **Tier Matrix Builder:**
   - Open: [http://localhost:3000/app/tiers](http://localhost:3000/app/tiers)

4. **SaaS Plans & Billing:**
   - Open: [http://localhost:3000/app/pricing](http://localhost:3000/app/pricing)
