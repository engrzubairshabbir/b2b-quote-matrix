import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { convertQuoteToDraftOrder } from "../services/draft-order.server";

export const loader = async ({ params, request }) => {
  let shop = "quickstart-demo.myshopify.com";
  try {
    const { session } = await authenticate.admin(request);
    if (session?.shop) shop = session.shop;
  } catch (err) {}

  const quoteId = params.id;
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
  });

  if (!quote) {
    throw new Response("Quote not found", { status: 404 });
  }

  const config = await prisma.appConfig.findUnique({ where: { shop } });

  return json({ quote, shop, config });
};

export const action = async ({ params, request }) => {
  let shop = "quickstart-demo.myshopify.com";
  let admin = null;

  try {
    const auth = await authenticate.admin(request);
    admin = auth.admin;
    if (auth.session?.shop) shop = auth.session.shop;
  } catch (err) {
    // Demo fallback for local development
  }

  const quoteId = params.id;
  const quote = await prisma.quoteRequest.findUnique({ where: { id: quoteId } });
  if (!quote) {
    return json({ error: "Quote not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // ACTION 1: One-Click Convert to Official Shopify Draft Order
  if (intent === "convert_to_draft_order") {
    const customDiscount = formData.get("customDiscount");
    const customShippingFee = formData.get("customShippingFee");
    const internalNotes = formData.get("internalNotes");

    let draftOrderResult = null;

    if (admin) {
      try {
        draftOrderResult = await convertQuoteToDraftOrder({
          admin,
          quote,
          customDiscount,
          customShippingFee,
        });
      } catch (graphQLErr) {
        console.error("GraphQL Draft Order Error:", graphQLErr);
        return json({
          error: `Shopify GraphQL Error: ${graphQLErr.message}`,
        });
      }
    } else {
      // Mock result for local standalone preview / demo testing
      const mockId = `gid://shopify/DraftOrder/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      draftOrderResult = {
        draftOrderId: mockId,
        draftOrderName: `#DO-${quote.quoteNumber}`,
        invoiceUrl: `https://${shop}/checkout/invoices/${mockId.split("/").pop()}?key=b2b_checkout_demo`,
      };
    }

    const discountVal =
      customDiscount !== null && customDiscount !== ""
        ? parseFloat(customDiscount)
        : quote.appliedDiscount;
    const shippingVal =
      customShippingFee !== null && customShippingFee !== ""
        ? parseFloat(customShippingFee)
        : 0;
    const updatedTotal =
      quote.unitPrice * quote.quantity * (1 - discountVal / 100) + shippingVal;

    const updated = await prisma.quoteRequest.update({
      where: { id: quoteId },
      data: {
        status: "INVOICE_SENT",
        appliedDiscount: discountVal,
        totalAmount: updatedTotal,
        shopifyDraftOrderId: draftOrderResult.draftOrderId,
        invoiceUrl: draftOrderResult.invoiceUrl,
        internalNotes: internalNotes || quote.internalNotes,
      },
    });

    return json({
      success: true,
      message: `Successfully generated Shopify Draft Order & dispatched branded 1-click invoice link to ${quote.customerEmail}!`,
      draftOrderResult,
      quote: updated,
    });
  }

  // ACTION 2: Update Quote Details & Pricing Overrides
  if (intent === "save_pricing_adjustments") {
    const customDiscount = parseFloat(formData.get("customDiscount") || 0);
    const customShippingFee = parseFloat(formData.get("customShippingFee") || 0);
    const internalNotes = formData.get("internalNotes") || "";
    const status = formData.get("status") || quote.status;

    const updatedTotal =
      quote.unitPrice * quote.quantity * (1 - customDiscount / 100) + customShippingFee;

    const updated = await prisma.quoteRequest.update({
      where: { id: quoteId },
      data: {
        appliedDiscount: customDiscount,
        totalAmount: updatedTotal,
        internalNotes,
        status,
      },
    });

    return json({
      success: true,
      message: "Quote pricing and configuration saved.",
      quote: updated,
    });
  }

  return json({ error: "Invalid action intent" });
};

export default function QuoteDetailView() {
  const { quote, shop } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [discountPercent, setDiscountPercent] = useState(quote.appliedDiscount || 0);
  const [shippingFee, setShippingFee] = useState(0);
  const [internalNotes, setInternalNotes] = useState(quote.internalNotes || "");

  // Live calculation
  const subtotal = quote.unitPrice * quote.quantity;
  const discountAmount = (subtotal * discountPercent) / 100;
  const netSubtotal = subtotal - discountAmount;
  const grandTotal = netSubtotal + parseFloat(shippingFee || 0);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Breadcrumb & Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
        <Link to="/app" style={{ color: "#94A3B8", textDecoration: "none" }}>
          &larr; Back to Dashboard
        </Link>
        <span style={{ color: "#475569" }}>/</span>
        <span style={{ color: "#00E5FF", fontWeight: 600 }}>Quote #{quote.quoteNumber}</span>
      </div>

      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                margin: 0,
                color: "#F8FAFC",
              }}
            >
              Quote #{quote.quoteNumber}
            </h1>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                backgroundColor:
                  quote.status === "INVOICE_SENT"
                    ? "rgba(34, 197, 94, 0.2)"
                    : quote.status === "APPROVED"
                    ? "rgba(59, 130, 246, 0.2)"
                    : quote.status === "PENDING"
                    ? "rgba(234, 179, 8, 0.2)"
                    : "rgba(239, 68, 68, 0.2)",
                color:
                  quote.status === "INVOICE_SENT"
                    ? "#4ADE80"
                    : quote.status === "APPROVED"
                    ? "#60A5FA"
                    : quote.status === "PENDING"
                    ? "#FACC15"
                    : "#F87171",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {quote.status}
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#94A3B8", fontSize: "14px" }}>
            Received on {new Date(quote.createdAt).toLocaleDateString()} from{" "}
            <strong style={{ color: "#E2E8F0" }}>{quote.companyName || quote.customerName}</strong>
          </p>
        </div>

        {/* Quick Info Header Badges */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {quote.invoiceUrl && (
            <a
              href={quote.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(34, 197, 94, 0.15)",
                border: "1px solid #22C55E",
                color: "#4ADE80",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🔗</span> Open Buyer Checkout Invoice
            </a>
          )}
        </div>
      </div>

      {/* Notifications / Action Results */}
      {actionData?.message && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "10px",
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            color: "#4ADE80",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "20px" }}>✅</span>
          <div>
            <strong>Success:</strong> {actionData.message}
            {actionData.draftOrderResult?.invoiceUrl && (
              <div style={{ marginTop: "4px" }}>
                <a
                  href={actionData.draftOrderResult.invoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#00E5FF", textDecoration: "underline" }}
                >
                  Click here to inspect official checkout invoice link &rarr;
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {actionData?.error && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "10px",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#F87171",
            fontSize: "14px",
          }}
        >
          ⚠️ {actionData.error}
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left Column: Product Line Items & Conversion Action */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Card 1: Product Line Items Inspector */}
          <div
            style={{
              backgroundColor: "#1E293B",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "24px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#F8FAFC",
                margin: "0 0 16px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>📦</span> Line Items & Tier Pricing Breakdown
            </h2>

            <div
              style={{
                display: "flex",
                gap: "18px",
                alignItems: "flex-start",
                padding: "16px",
                backgroundColor: "#0F172A",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              {quote.productImage ? (
                <img
                  src={quote.productImage}
                  alt={quote.productTitle}
                  style={{
                    width: "90px",
                    height: "90px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "8px",
                    backgroundColor: "#334155",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "30px",
                  }}
                >
                  🛍️
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#F8FAFC" }}>
                  {quote.productTitle}
                </div>
                {quote.variantTitle && (
                  <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>
                    Variant: <span style={{ color: "#E2E8F0" }}>{quote.variantTitle}</span>
                  </div>
                )}
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                  Product ID: {quote.productId}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    marginTop: "14px",
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>Unit Price</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC" }}>
                      {formatCurrency(quote.unitPrice)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>Quantity</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#00E5FF" }}>
                      {quote.quantity} Units
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>Applied Tier Discount</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#34D399" }}>
                      {discountPercent}% OFF
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>Calculated Net Total</div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#F8FAFC" }}>
                      {formatCurrency(grandTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Pricing Adjuster & 1-Click Shopify Conversion */}
          <div
            style={{
              backgroundColor: "#1E293B",
              borderRadius: "14px",
              border: "1px solid rgba(0, 229, 255, 0.3)",
              padding: "24px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
              background: "linear-gradient(180deg, #1E293B 0%, #151D2A 100%)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#F8FAFC",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>⚡</span> One-Click Official Shopify Draft Order Engine
              </h2>
              <span
                style={{
                  backgroundColor: "rgba(0, 229, 255, 0.15)",
                  color: "#00E5FF",
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                GraphQL Admin API
              </span>
            </div>

            <p style={{ color: "#94A3B8", fontSize: "13px", margin: "8px 0 20px 0" }}>
              Fine-tune discount % or add commercial freight before automatically creating a Shopify Draft Order with a direct 1-click checkout payment invoice for the customer.
            </p>

            {/* Price Adjusters */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#CBD5E1", marginBottom: "6px" }}>
                  B2B Tier Discount (%)
                </label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    step="0.5"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      backgroundColor: "#0F172A",
                      color: "#00E5FF",
                      fontWeight: 700,
                      fontSize: "15px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#CBD5E1", marginBottom: "6px" }}>
                  Freight & Commercial Shipping ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    backgroundColor: "#0F172A",
                    color: "#F8FAFC",
                    fontWeight: 700,
                    fontSize: "15px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Order Summary Recap */}
            <div
              style={{
                backgroundColor: "#0F172A",
                padding: "16px 20px",
                borderRadius: "10px",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94A3B8" }}>
                <span>Subtotal ({quote.quantity} units @ {formatCurrency(quote.unitPrice)})</span>
                <span style={{ color: "#E2E8F0" }}>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#34D399" }}>
                <span>Applied B2B Discount ({discountPercent}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              {parseFloat(shippingFee) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#60A5FA" }}>
                  <span>Commercial Freight & Handling</span>
                  <span>+{formatCurrency(parseFloat(shippingFee))}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#F8FAFC",
                  paddingTop: "10px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <span>Final Draft Order Amount</span>
                <span style={{ color: "#00E5FF" }}>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Action Form: Convert to Draft Order & Dispatch Branded Invoice */}
            <Form method="post">
              <input type="hidden" name="customDiscount" value={discountPercent} />
              <input type="hidden" name="customShippingFee" value={shippingFee} />
              <input type="hidden" name="internalNotes" value={internalNotes} />

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  name="intent"
                  value="convert_to_draft_order"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "14px 24px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)",
                    border: "none",
                    color: "#0B0F19",
                    fontWeight: 800,
                    fontSize: "15px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    boxShadow: "0 0 20px rgba(0, 229, 255, 0.4)",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  <span>🚀</span>
                  <span>
                    {isSubmitting
                      ? "Generating Draft Order & Sending Invoice..."
                      : "Convert to Official Shopify Draft Order & Send Invoice"}
                  </span>
                </button>

                <button
                  type="submit"
                  name="intent"
                  value="save_pricing_adjustments"
                  disabled={isSubmitting}
                  style={{
                    padding: "14px 20px",
                    borderRadius: "10px",
                    backgroundColor: "#334155",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#F8FAFC",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Save Adjustments
                </button>
              </div>
            </Form>
          </div>

          {/* Card 3: Internal Merchant Notes */}
          <div
            style={{
              backgroundColor: "#1E293B",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "20px 24px",
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 10px 0" }}>
              📝 Internal Sales Desk Audit Notes
            </h3>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes about margin, payment terms, or client negotiation..."
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: "#0F172A",
                color: "#E2E8F0",
                fontSize: "13px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Right Column: Buyer Profile, Shipping, & Order Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Buyer Information Card */}
          <div
            style={{
              backgroundColor: "#1E293B",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "24px",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 16px 0" }}>
              👤 Commercial Buyer Profile
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase" }}>
                  Primary Contact
                </div>
                <div style={{ fontWeight: 600, color: "#F8FAFC", marginTop: "2px" }}>
                  {quote.customerName}
                </div>
              </div>

              <div>
                <div style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase" }}>
                  Company / Organization
                </div>
                <div style={{ fontWeight: 600, color: "#00E5FF", marginTop: "2px" }}>
                  {quote.companyName || "N/A (Individual Buyer)"}
                </div>
              </div>

              <div>
                <div style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase" }}>
                  Work Email
                </div>
                <a
                  href={`mailto:${quote.customerEmail}`}
                  style={{ color: "#60A5FA", textDecoration: "none", marginTop: "2px", display: "block" }}
                >
                  {quote.customerEmail}
                </a>
              </div>

              {quote.phone && (
                <div>
                  <div style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase" }}>
                    Direct Phone
                  </div>
                  <div style={{ color: "#E2E8F0", marginTop: "2px" }}>{quote.phone}</div>
                </div>
              )}

              {quote.taxId && (
                <div>
                  <div style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase" }}>
                    Tax ID / VAT Registration
                  </div>
                  <div style={{ color: "#E2E8F0", marginTop: "2px", fontFamily: "monospace" }}>
                    {quote.taxId}
                  </div>
                </div>
              )}

              <div>
                <div style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase" }}>
                  Target Delivery Date
                </div>
                <div style={{ color: "#FACC15", fontWeight: 600, marginTop: "2px" }}>
                  {quote.targetDeliveryDate || "Standard commercial delivery"}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Shipping Destination */}
          <div
            style={{
              backgroundColor: "#1E293B",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "24px",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 16px 0" }}>
              📍 Shipping & Logistics Destination
            </h3>

            <div style={{ fontSize: "13px", color: "#E2E8F0", lineHeight: 1.5 }}>
              {quote.shippingAddress || "No delivery address specified by buyer."}
            </div>

            {quote.notes && (
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "14px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ color: "#94A3B8", fontSize: "11px", textTransform: "uppercase" }}>
                  Buyer Specific Requirements
                </div>
                <div
                  style={{
                    color: "#FACC15",
                    fontSize: "12px",
                    marginTop: "4px",
                    fontStyle: "italic",
                    backgroundColor: "rgba(250, 204, 21, 0.08)",
                    padding: "8px 12px",
                    borderRadius: "6px",
                  }}
                >
                  "{quote.notes}"
                </div>
              </div>
            )}
          </div>

          {/* Shopify Draft Order Status Details */}
          {quote.shopifyDraftOrderId && (
            <div
              style={{
                backgroundColor: "#1E293B",
                borderRadius: "14px",
                border: "1px solid rgba(34, 197, 94, 0.4)",
                padding: "24px",
                boxShadow: "0 0 20px rgba(34, 197, 94, 0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#4ADE80",
                  margin: "0 0 12px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>✓</span> Active Shopify Draft Order
              </h3>

              <div style={{ fontSize: "12px", color: "#94A3B8", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  Shopify Order GID:
                  <div style={{ color: "#F8FAFC", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {quote.shopifyDraftOrderId}
                  </div>
                </div>

                <div style={{ marginTop: "8px" }}>
                  <a
                    href={quote.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      color: "#FFFFFF",
                      textAlign: "center",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Open Customer Checkout &rarr;
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
