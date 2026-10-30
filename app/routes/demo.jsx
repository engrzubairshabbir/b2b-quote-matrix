import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import prisma from "../db.server";

export const loader = async () => {
  const shop = "quickstart-demo.myshopify.com";
  const tiers = await prisma.tieredDiscountRule.findMany({
    where: { shop },
    orderBy: { minQuantity: "asc" },
  });
  const config = await prisma.appConfig.findUnique({ where: { shop } });

  return json({ tiers, config, shop });
};

export default function StorefrontProductDemo() {
  const { tiers, config, shop } = useLoaderData();

  const product = {
    id: "gid://shopify/Product/8472910384",
    title: "AeroDesk Pro Motorized Workstation Pod (10-Pack)",
    handle: "aerodesk-pro-workstation",
    variantId: "gid://shopify/ProductVariant/4482910384",
    variantTitle: "Dual Motor / Matte Charcoal Oak / Cable Spine Included",
    price: 3450.0,
    compareAtPrice: 3890.0,
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    sku: "AD-PRO-10PK-CH",
    description: "Industrial-grade dual motor ergonomic workstation cluster for commercial enterprise offices and tech campuses. Heavy-duty steel frame with synchronized whisper-quiet digital controls and integrated cable management.",
  };

  // Interactive React State for 100% Instant Responsiveness
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qty, setQty] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState(null);

  // Form State
  const [customerName, setCustomerName] = useState("Marcus Sterling");
  const [customerEmail, setCustomerEmail] = useState("m.sterling@apexindustrial.com");
  const [companyName, setCompanyName] = useState("Apex Industrial Automation Inc.");
  const [phone, setPhone] = useState("+1 (312) 555-0194");
  const [shippingAddress, setShippingAddress] = useState("Chicago, IL 60607, USA");
  const [targetDeliveryDate, setTargetDeliveryDate] = useState("2026-11-15");
  const [notes, setNotes] = useState("Need expedited freight delivery for facility expansion in Chicago. Liftgate required.");

  // Helper: Format Currency
  const formatMoney = (val) =>
    "$" + Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Calculate matching tier
  const sortedTiersDesc = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  let activeDiscountPercent = 0;
  for (const t of sortedTiersDesc) {
    if (qty >= t.minQuantity) {
      if (t.maxQuantity === null || t.maxQuantity === undefined || qty <= t.maxQuantity) {
        activeDiscountPercent = t.discountPercent;
        break;
      }
    }
  }

  const discountedUnit = product.price * (1 - activeDiscountPercent / 100);
  const totalOriginal = product.price * qty;
  const totalDiscounted = discountedUnit * qty;
  const totalSaved = totalOriginal - totalDiscounted;

  const handleOpenModal = (targetQty) => {
    if (targetQty) setQty(targetQty);
    setSubmittedQuote(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      shop,
      productId: product.id,
      productTitle: product.title,
      productHandle: product.handle,
      productImage: product.image,
      variantId: product.variantId,
      variantTitle: product.variantTitle,
      unitPrice: product.price,
      quantity: qty,
      customerName,
      customerEmail,
      companyName,
      phone,
      shippingAddress,
      targetDeliveryDate,
      notes,
    };

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmittedQuote(data);
      } else {
        alert(data.error || "Failed to submit quote");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting quote: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", color: "#0F172A", fontFamily: "'Inter', sans-serif" }}>
      {/* Top Store Header */}
      <header
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "22px" }}>🏢</span>
            <span style={{ fontWeight: 800, fontSize: "18px", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.5px" }}>
              Apex Commercial Supply Co.
            </span>
          </div>
          <span
            style={{
              backgroundColor: "#EFF6FF",
              color: "#1D4ED8",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            Storefront Simulation Mode (Online Store 2.0 Theme)
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            to="/app"
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor: "#0F172A",
              color: "#00E5FF",
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
              border: "1px solid #00E5FF",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>📊</span> Merchant Admin Dashboard &rarr;
          </Link>
        </div>
      </header>

      {/* Product Page Main Body */}
      <main style={{ maxWidth: "1280px", margin: "40px auto", padding: "0 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "48px",
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            padding: "36px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          {/* Product Image Column */}
          <div>
            <div
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                position: "relative",
              }}
            >
              <img
                src={product.image}
                alt={product.title}
                style={{ width: "100%", height: "460px", objectFit: "cover", display: "block" }}
              />
              <span
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  backgroundColor: "#0F172A",
                  color: "#00E5FF",
                  padding: "4px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "1px solid #00E5FF",
                }}
              >
                Commercial High-Ticket
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "14px" }}>
              {[
                "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=80",
                "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80",
                "https://images.unsplash.com/photo-1580481077195-c328ad4f4f72?auto=format&fit=crop&w=300&q=80",
                "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80",
              ].map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt="thumbnail"
                  style={{
                    width: "100%",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: idx === 0 ? "2px solid #00E5FF" : "1px solid #E2E8F0",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Product Purchasing Column */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              SKU: {product.sku}
            </div>

            <h1 style={{ fontSize: "28px", fontWeight: 800, fontFamily: "'Outfit', sans-serif", margin: "8px 0 12px 0", color: "#0F172A", lineHeight: 1.25 }}>
              {product.title}
            </h1>

            {/* Price Row */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", margin: "16px 0 20px 0" }}>
              <span style={{ fontSize: "32px", fontWeight: 800, color: "#0F172A" }}>
                ${product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: "18px", color: "#94A3B8", textDecoration: "line-through" }}>
                ${product.compareAtPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#10B981", backgroundColor: "#ECFDF5", padding: "3px 8px", borderRadius: "6px" }}>
                Commercial In-Stock
              </span>
            </div>

            <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6, margin: "0 0 24px 0" }}>
              {product.description}
            </p>

            <div style={{ padding: "16px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                SELECTED SPECIFICATION:
              </div>
              <div style={{ fontSize: "13px", color: "#0F172A", fontWeight: 600 }}>
                {product.variantTitle}
              </div>
            </div>

            {/* ========================================================= */}
            {/* INJECTED CONSULTWAYS B2B QUOTE & TIERED MATRIX PRO WIDGET */}
            {/* ========================================================= */}
            <div className="cw-b2b-widget-wrapper">
              {/* Volume Tier Pricing Header */}
              <div className="cw-b2b-tiers-header">
                <div className="cw-b2b-tiers-title">
                  <span>⚡</span>
                  <span>B2B Volume Wholesale Tiers</span>
                </div>
                <span className="cw-b2b-tiers-badge">Auto Bulk Discounts</span>
              </div>

              {/* Tier Cards Grid */}
              <div className="cw-b2b-cards-grid">
                {tiers.map((tier) => {
                  const dUnit = product.price * (1 - tier.discountPercent / 100);
                  const isBestValue = tier.badgeText && tier.badgeText.includes("Best Value");
                  const qtyLabel = tier.maxQuantity ? `${tier.minQuantity} - ${tier.maxQuantity} Units` : `${tier.minQuantity}+ Units`;
                  const isSelected = qty >= tier.minQuantity && (!tier.maxQuantity || qty <= tier.maxQuantity);

                  return (
                    <div
                      key={tier.id}
                      onClick={() => handleOpenModal(tier.minQuantity)}
                      className={`cw-tier-card ${isBestValue ? "cw-best-value" : ""} ${isSelected ? "cw-active-tier" : ""}`}
                      style={{ cursor: "pointer" }}
                    >
                      {tier.badgeText && <span className="cw-tier-badge">{tier.badgeText}</span>}
                      <div className="cw-tier-qty">{qtyLabel}</div>
                      <div className="cw-tier-price">
                        {formatMoney(dUnit)}
                      </div>
                      <div className="cw-tier-unit">per item</div>
                      {tier.discountPercent > 0 ? (
                        <div className="cw-tier-discount">{tier.discountPercent}% OFF</div>
                      ) : (
                        <div className="cw-tier-discount" style={{ background: "#f1f5f9", color: "#64748b" }}>
                          Standard
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  style={{
                    padding: "14px 20px",
                    borderRadius: "10px",
                    backgroundColor: "#FFFFFF",
                    border: "1.5px solid #0F172A",
                    color: "#0F172A",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                  onClick={() => alert("Standard Single Unit Checkout: For commercial volume discounts, click 'Request B2B Bulk Quote' below.")}
                >
                  Buy Single Unit (${product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                </button>

                {/* ConsultWays High-Converting Neon CTA */}
                <button
                  type="button"
                  className="cw-quote-cta-btn"
                  onClick={() => handleOpenModal(qty)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="cw-cta-neon-dot"></span>
                  <span>{config?.buttonText || "Request B2B Bulk Quote"}</span>
                </button>
              </div>
            </div>
            {/* End Injected Widget */}
          </div>
        </div>
      </main>

      {/* Glassmorphic Quote Modal Container */}
      {isModalOpen && (
        <div
          className="cw-modal-backdrop cw-modal-open"
          style={{ display: "flex", opacity: 1, pointerEvents: "auto" }}
          onClick={(e) => {
            if (e.target.classList.contains("cw-modal-backdrop")) setIsModalOpen(false);
          }}
        >
          <div className="cw-modal-container" style={{ transform: "translateY(0) scale(1)" }}>
            <div className="cw-modal-header">
              <div className="cw-modal-header-left">
                <div className="cw-modal-header-icon">CW</div>
                <div>
                  <h2 className="cw-modal-title">Request B2B Commercial Bulk Quote</h2>
                  <p className="cw-modal-subtitle">{product.title}</p>
                </div>
              </div>
              <button
                type="button"
                className="cw-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="cw-modal-body">
              {!submittedQuote ? (
                <div className="cw-form-container">
                  {/* Live Calculator */}
                  <div className="cw-calc-card">
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#CBD5E1" }}>
                        Select Target Order Quantity
                      </div>
                      <div className="cw-calc-qty-control">
                        <button
                          type="button"
                          className="cw-calc-btn"
                          onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          className="cw-calc-input"
                          value={qty}
                          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          min="1"
                        />
                        <button
                          type="button"
                          className="cw-calc-btn"
                          onClick={() => setQty((prev) => prev + 1)}
                        >
                          +
                        </button>
                        <span style={{ fontSize: "12px", color: "#94A3B8", marginLeft: "6px" }}>Units</span>
                      </div>
                      <div className="cw-calc-savings" style={{ marginTop: "6px" }}>
                        {activeDiscountPercent > 0 ? (
                          <span>★ {activeDiscountPercent}% OFF Tier applied (You save {formatMoney(totalSaved)})</span>
                        ) : (
                          <span style={{ color: "#94A3B8" }}>Standard wholesale rate. Increase to 10+ for 15% OFF!</span>
                        )}
                      </div>
                    </div>

                    <div className="cw-calc-totals">
                      <div className="cw-calc-total-label">Estimated Subtotal</div>
                      <div className="cw-calc-total-price">
                        {formatMoney(totalDiscounted)}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748B" }}>Excl. freight & local taxes</div>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleFormSubmit} style={{ marginTop: "20px" }}>
                    <div className="cw-form-grid">
                      <div>
                        <label className="cw-form-label">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="cw-form-input"
                        />
                      </div>

                      <div>
                        <label className="cw-form-label">Corporate Work Email *</label>
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="cw-form-input"
                        />
                      </div>

                      <div>
                        <label className="cw-form-label">Company / Organization *</label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="cw-form-input"
                        />
                      </div>

                      <div>
                        <label className="cw-form-label">Direct Phone</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="cw-form-input"
                        />
                      </div>

                      <div>
                        <label className="cw-form-label">Shipping Postal / Zip Code</label>
                        <input
                          type="text"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          className="cw-form-input"
                        />
                      </div>

                      <div>
                        <label className="cw-form-label">Target Delivery Date</label>
                        <input
                          type="date"
                          value={targetDeliveryDate}
                          onChange={(e) => setTargetDeliveryDate(e.target.value)}
                          className="cw-form-input"
                        />
                      </div>

                      <div className="cw-form-full">
                        <label className="cw-form-label">Project Requirements / Custom Specifications</label>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="cw-form-textarea"
                        />
                      </div>
                    </div>

                    <div className="cw-modal-footer" style={{ padding: "16px 0 0 0", marginTop: "16px" }}>
                      <button type="submit" disabled={isSubmitting} className="cw-btn-submit-quote">
                        <span>⚡</span>
                        <span>{isSubmitting ? "Submitting Inquiry..." : "Submit Bulk Quote Request"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Success Confirmation */
                <div className="cw-success-container">
                  <div className="cw-success-icon">✓</div>
                  <h3 className="cw-success-title">Quote Request Received!</h3>
                  <div className="cw-success-quote-no">Quote #{submittedQuote.quoteNumber}</div>
                  <p className="cw-success-desc">
                    Thank you for your bulk inquiry. Our B2B commercial sales desk has received your request and will review wholesale pricing, freight options, and dispatch an official 1-click Shopify Draft Order invoice within 2 hours.
                  </p>
                  <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      style={{
                        padding: "10px 18px",
                        borderRadius: "8px",
                        backgroundColor: "#334155",
                        border: "none",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                    <Link
                      to="/app"
                      style={{
                        padding: "10px 20px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)",
                        color: "#0F172A",
                        fontWeight: 800,
                        textDecoration: "none",
                        fontSize: "13px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      Inspect in Merchant Dashboard &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <link rel="stylesheet" href="/extensions/b2b-quote-widget/assets/b2b-quote-widget.css" />
    </div>
  );
}
