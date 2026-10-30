import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SHOPS = [
  "quickstart-demo.myshopify.com",
  "consultways-b2b-dev.myshopify.com",
];

async function seedShop(shop) {
  console.log(`🌱 Seeding data for ${shop}...`);

  // 1. Seed or Upsert AppConfig
  await prisma.appConfig.upsert({
    where: { shop },
    update: {
      enableTieredMatrix: true,
      primaryColor: "#00E5FF", // Neon Cyan
      buttonText: "Request B2B Bulk Quote",
      requireCompany: true,
      requireTaxId: false,
      autoApproveDiscounts: false,
      activePlan: "PRO_SCALE",
    },
    create: {
      shop,
      enableTieredMatrix: true,
      primaryColor: "#00E5FF",
      buttonText: "Request B2B Bulk Quote",
      requireCompany: true,
      requireTaxId: false,
      autoApproveDiscounts: false,
      notificationEmail: "b2b-sales@consultways.com",
      activePlan: "PRO_SCALE",
    },
  });

  // 2. Clear & Seed Tiered Discount Rules
  await prisma.tieredDiscountRule.deleteMany({ where: { shop } });
  await prisma.tieredDiscountRule.createMany({
    data: [
      {
        shop,
        minQuantity: 1,
        maxQuantity: 9,
        discountPercent: 0.0,
        label: "Standard Tier (1-9 Units)",
        badgeText: "Standard Price",
      },
      {
        shop,
        minQuantity: 10,
        maxQuantity: 49,
        discountPercent: 15.0,
        label: "Wholesale Tier 1 (10-49 Units)",
        badgeText: "15% OFF (Save Bulk)",
      },
      {
        shop,
        minQuantity: 50,
        maxQuantity: null,
        discountPercent: 25.0,
        label: "Enterprise Master Bulk (50+ Units)",
        badgeText: "25% OFF (Best Value)",
      },
    ],
  });

  // 3. Clear & Seed High-Ticket B2B Quote Requests
  await prisma.quoteRequest.deleteMany({ where: { shop } });
  await prisma.quoteRequest.createMany({
    data: [
      {
        shop,
        quoteNumber: "CW-Q1001",
        customerName: "Marcus Sterling",
        customerEmail: "m.sterling@apexindustrial.com",
        companyName: "Apex Industrial Automation Inc.",
        phone: "+1 (312) 555-0194",
        taxId: "US-EIN-94827104",
        notes: "Need expedited freight delivery for facility expansion in Chicago. Certified lift gate required.",
        shippingAddress: "100 Industrial Pkwy, Dock Bay 4, Chicago, IL 60607, USA",
        targetDeliveryDate: "2026-11-15",
        productId: "gid://shopify/Product/8472910384",
        productTitle: "AeroDesk Pro Motorized Workstation Pod (10-Pack)",
        productHandle: "aerodesk-pro-workstation",
        productImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80",
        variantId: "gid://shopify/ProductVariant/4482910384",
        variantTitle: "Dual Motor / Matte Charcoal Oak / Cable Spine Included",
        unitPrice: 3450.0,
        quantity: 15,
        appliedDiscount: 15.0,
        totalAmount: 43987.5,
        status: "PENDING",
      },
      {
        shop,
        quoteNumber: "CW-Q1002",
        customerName: "Sarah Jenkins",
        customerEmail: "sjenkins@vanguardlogistics.co.uk",
        companyName: "Vanguard Logistics UK Ltd",
        phone: "+44 20 7946 0912",
        taxId: "GB992817263",
        notes: "Heavy load testing certification required prior to dispatch. VAT invoice required.",
        shippingAddress: "Unit 4, Gateway Logistics Park, Manchester, M17 1TN, United Kingdom",
        targetDeliveryDate: "2026-11-01",
        productId: "gid://shopify/Product/8472910385",
        productTitle: "Titan Heavy-Duty Hydraulic Lift Table (5,000 lbs Capacity)",
        productHandle: "titan-hydraulic-lift-table",
        productImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
        variantId: "gid://shopify/ProductVariant/4482910385",
        variantTitle: "480V 3-Phase Industrial / Safety Skirt Attached",
        unitPrice: 6890.0,
        quantity: 8,
        appliedDiscount: 0.0,
        totalAmount: 55120.0,
        status: "APPROVED",
      },
      {
        shop,
        quoteNumber: "CW-Q1003",
        customerName: "David Cho",
        customerEmail: "procurement@matrixtechcorp.com",
        companyName: "Matrix Tech Group Inc.",
        phone: "+1 (212) 555-0821",
        taxId: "US-EIN-12948201",
        notes: "Bulk corporate headquarters refurbishment. Standard net-30 terms preferred.",
        shippingAddress: "450 5th Ave, Floor 22, New York, NY 10018, USA",
        targetDeliveryDate: "2026-10-30",
        productId: "gid://shopify/Product/8472910386",
        productTitle: "Ergonomic Commercial Mesh Task Chairs - High-Performance",
        productHandle: "commercial-mesh-task-chair",
        productImage: "https://images.unsplash.com/photo-1580481077195-c328ad4f4f72?auto=format&fit=crop&w=600&q=80",
        variantId: "gid://shopify/ProductVariant/4482910386",
        variantTitle: "Carbon Black / 4D Armrests / Lumbar Support Plus",
        unitPrice: 799.0,
        quantity: 60,
        appliedDiscount: 25.0,
        totalAmount: 35955.0,
        status: "INVOICE_SENT",
        shopifyDraftOrderId: "gid://shopify/DraftOrder/9823412356",
        invoiceUrl: "https://quickstart-demo.myshopify.com/6123849/invoices/9823412356?key=3a7b8e9f20c1",
        internalNotes: "Converted to official Shopify Draft Order #CW-DO-98234. Branded checkout invoice link sent via Shopify GraphQL API.",
      },
    ],
  });
}

async function main() {
  console.log("🌱 Seeding ConsultWays B2B Quote & Tiered Matrix Pro database...");
  for (const shop of SHOPS) {
    await seedShop(shop);
  }
  console.log("✅ All shops seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
