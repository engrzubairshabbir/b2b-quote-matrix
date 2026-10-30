import { json } from "@remix-run/node";
import prisma from "../db.server";
import { calculateTierDiscount, getNextQuoteNumber } from "../services/quote.server";

// CORS headers for Storefront Theme App Extension
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async () => {
  return json({ message: "Storefront Quote API active" }, { headers: corsHeaders });
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let payload;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      payload = Object.fromEntries(formData);
    }

    const {
      shop = "quickstart-demo.myshopify.com",
      productId,
      productTitle,
      productHandle,
      productImage,
      variantId,
      variantTitle,
      unitPrice,
      quantity,
      customerName,
      customerEmail,
      companyName,
      phone,
      taxId,
      shippingAddress,
      targetDeliveryDate,
      notes,
    } = payload;

    if (!customerEmail || !customerName || !productTitle) {
      return json(
        { error: "Customer name, email, and product details are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const qty = parseInt(quantity, 10) || 1;
    const baseUnitPrice = parseFloat(unitPrice) || 0;

    // Check discount from rules
    const tierResult = await calculateTierDiscount(shop, qty);
    const appliedDiscount = tierResult.discountPercent;
    const totalAmount = baseUnitPrice * qty * (1 - appliedDiscount / 100);

    // Generate auto-increment quote number
    const quoteNumber = await getNextQuoteNumber(shop);

    const quote = await prisma.quoteRequest.create({
      data: {
        shop,
        quoteNumber,
        customerName,
        customerEmail,
        companyName: companyName || null,
        phone: phone || null,
        taxId: taxId || null,
        shippingAddress: shippingAddress || null,
        targetDeliveryDate: targetDeliveryDate || null,
        notes: notes || null,
        productId: String(productId || "gid://shopify/Product/0"),
        productTitle: String(productTitle),
        productHandle: productHandle || null,
        productImage: productImage || null,
        variantId: String(variantId || "gid://shopify/ProductVariant/0"),
        variantTitle: variantTitle || null,
        unitPrice: baseUnitPrice,
        quantity: qty,
        appliedDiscount,
        totalAmount,
        status: "PENDING",
      },
    });

    return json(
      {
        success: true,
        quoteNumber: quote.quoteNumber,
        quoteId: quote.id,
        appliedDiscount: quote.appliedDiscount,
        totalAmount: quote.totalAmount,
        message: `Quote #${quote.quoteNumber} submitted successfully! Our B2B sales desk will review within 2 hours.`,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error in api.quote:", error);
    return json(
      { error: "Failed to process quote request: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
};
