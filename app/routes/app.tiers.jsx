import { json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  let shop = "quickstart-demo.myshopify.com";
  try {
    const { session } = await authenticate.admin(request);
    if (session?.shop) shop = session.shop;
  } catch (err) {}

  const tiers = await prisma.tieredDiscountRule.findMany({
    where: { shop },
    orderBy: { minQuantity: "asc" },
  });

  const config = await prisma.appConfig.findUnique({ where: { shop } });

  return json({ tiers, shop, config });
};

export const action = async ({ request }) => {
  let shop = "quickstart-demo.myshopify.com";
  try {
    const { session } = await authenticate.admin(request);
    if (session?.shop) shop = session.shop;
  } catch (err) {}

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create_tier") {
    const minQuantity = parseInt(formData.get("minQuantity"), 10);
    const maxQuantityRaw = formData.get("maxQuantity");
    const maxQuantity = maxQuantityRaw ? parseInt(maxQuantityRaw, 10) : null;
    const discountPercent = parseFloat(formData.get("discountPercent"));
    const label = formData.get("label") || `Tier: ${discountPercent}% OFF`;
    const badgeText = formData.get("badgeText") || (discountPercent >= 20 ? "Best Value" : "Popular");

    if (isNaN(minQuantity) || isNaN(discountPercent)) {
      return json({ error: "Invalid quantity or discount percentage." }, { status: 400 });
    }

    await prisma.tieredDiscountRule.create({
      data: {
        shop,
        minQuantity,
        maxQuantity,
        discountPercent,
        label,
        badgeText,
      },
    });

    return json({ success: true, message: "New bulk discount tier added successfully!" });
  }

  if (intent === "delete_tier") {
    const id = formData.get("id");
    if (id) {
      await prisma.tieredDiscountRule.delete({ where: { id } });
      return json({ success: true, message: "Discount tier deleted." });
    }
  }

  if (intent === "update_tier") {
    const id = formData.get("id");
    const minQuantity = parseInt(formData.get("minQuantity"), 10);
    const maxQuantityRaw = formData.get("maxQuantity");
    const maxQuantity = maxQuantityRaw ? parseInt(maxQuantityRaw, 10) : null;
    const discountPercent = parseFloat(formData.get("discountPercent"));
    const label = formData.get("label");
    const badgeText = formData.get("badgeText");

    await prisma.tieredDiscountRule.update({
      where: { id },
      data: {
        minQuantity,
        maxQuantity,
        discountPercent,
        label,
        badgeText,
      },
    });

    return json({ success: true, message: "Discount tier updated." });
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function TierMatrixBuilder() {
  const { tiers, shop, config } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Simulator state
  const [simQty, setSimQty] = useState(25);
  const [simPrice, setSimPrice] = useState(1200);

  // Calculate matching tier for simulator
  const sortedTiersDesc = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity);
  let activeTier = null;
  for (const t of sortedTiersDesc) {
    if (simQty >= t.minQuantity) {
      if (t.maxQuantity === null || simQty <= t.maxQuantity) {
        activeTier = t;
        break;
      }
    }
  }

  const effectiveDiscount = activeTier ? activeTier.discountPercent : 0;
  const unitDiscountedPrice = simPrice * (1 - effectiveDiscount / 100);
  const totalOriginal = simPrice * simQty;
  const totalDiscounted = unitDiscountedPrice * simQty;
  const totalSaved = totalOriginal - totalDiscounted;

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              margin: 0,
              color: "#F8FAFC",
            }}
          >
            Tiered Wholesale Matrix Builder
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "#94A3B8", fontSize: "14px" }}>
            Configure automatic volume price breaks displayed on your Online Store 2.0 product pages.
          </p>
        </div>

        <Link
          to="/demo"
          target="_blank"
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            backgroundColor: "rgba(0, 229, 255, 0.15)",
            border: "1px solid #00E5FF",
            color: "#00E5FF",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>👁️</span> View Storefront Widget
        </Link>
      </div>

      {/* Notifications */}
      {actionData?.message && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "8px",
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            color: "#4ADE80",
            fontSize: "14px",
          }}
        >
          ✓ {actionData.message}
        </div>
      )}

      {actionData?.error && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "8px",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#F87171",
            fontSize: "14px",
          }}
        >
          ⚠️ {actionData.error}
        </div>
      )}

      {/* Grid: Tiers List & Create New Tier */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 1.2fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left Column: Configured Tiers Table */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
              Active Volume Price Brackets ({tiers.length})
            </h2>
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Applied globally across commercial catalog</span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#0F172A", color: "#94A3B8", fontSize: "12px", textTransform: "uppercase" }}>
                <th style={{ padding: "12px 20px" }}>Quantity Bracket</th>
                <th style={{ padding: "12px 20px" }}>Discount %</th>
                <th style={{ padding: "12px 20px" }}>Tier Label</th>
                <th style={{ padding: "12px 20px" }}>Badge</th>
                <th style={{ padding: "12px 20px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <td style={{ padding: "16px 20px", fontWeight: 700, color: "#00E5FF", fontFamily: "monospace" }}>
                    {t.minQuantity} {t.maxQuantity ? `- ${t.maxQuantity} Units` : "+ Units"}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        backgroundColor: t.discountPercent > 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(148, 163, 184, 0.15)",
                        color: t.discountPercent > 0 ? "#4ADE80" : "#CBD5E1",
                        fontWeight: 700,
                        fontSize: "13px",
                      }}
                    >
                      {t.discountPercent}% OFF
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px", color: "#E2E8F0", fontSize: "13px" }}>
                    {t.label}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    {t.badgeText && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor:
                            t.badgeText.includes("Best Value")
                              ? "rgba(0, 229, 255, 0.2)"
                              : "rgba(255, 255, 255, 0.1)",
                          color: t.badgeText.includes("Best Value") ? "#00E5FF" : "#F8FAFC",
                          border: t.badgeText.includes("Best Value") ? "1px solid #00E5FF" : "none",
                        }}
                      >
                        {t.badgeText}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <Form method="post" style={{ display: "inline" }}>
                      <input type="hidden" name="intent" value="delete_tier" />
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          color: "#EF4444",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "4px 8px",
                        }}
                        title="Delete Tier"
                      >
                        🗑️
                      </button>
                    </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Column: Add New Tier Form */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "14px",
            border: "1px solid rgba(0, 229, 255, 0.3)",
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
            <span>➕</span> Add New Wholesale Tier
          </h2>

          <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <input type="hidden" name="intent" value="create_tier" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>
                  Min Quantity *
                </label>
                <input
                  type="number"
                  name="minQuantity"
                  required
                  min="1"
                  placeholder="e.g. 100"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    backgroundColor: "#0F172A",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#F8FAFC",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>
                  Max Quantity (Blank = Unlimited)
                </label>
                <input
                  type="number"
                  name="maxQuantity"
                  min="1"
                  placeholder="e.g. 499"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    backgroundColor: "#0F172A",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#F8FAFC",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>
                Discount Percentage (%) *
              </label>
              <input
                type="number"
                name="discountPercent"
                required
                min="0"
                max="90"
                step="0.5"
                placeholder="e.g. 30"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#0F172A",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#00E5FF",
                  fontWeight: 700,
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>
                Tier Display Label
              </label>
              <input
                type="text"
                name="label"
                placeholder="e.g. Enterprise Tier 3: 30% OFF"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#0F172A",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#F8FAFC",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>
                Marketing Badge Text (Optional)
              </label>
              <input
                type="text"
                name="badgeText"
                placeholder="e.g. Best Value, Most Popular"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#0F172A",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#F8FAFC",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: "10px",
                padding: "12px 20px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)",
                border: "none",
                color: "#0B0F19",
                fontWeight: 800,
                fontSize: "14px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 0 15px rgba(0, 229, 255, 0.4)",
              }}
            >
              {isSubmitting ? "Saving Tier..." : "Add Tier to Live Storefront"}
            </button>
          </Form>
        </div>
      </div>

      {/* Interactive Live Tier Calculator Sandbox */}
      <div
        style={{
          backgroundColor: "#1E293B",
          borderRadius: "14px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "24px",
        }}
      >
        <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#F8FAFC", margin: "0 0 8px 0" }}>
          🧪 Live Tier Matrix Simulator Sandbox
        </h2>
        <p style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 20px 0" }}>
          Test how your configured volume rules calculate pricing in real time for any hypothetical order size.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1.5fr",
            gap: "20px",
            alignItems: "center",
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>
              Sample Unit Price ($)
            </label>
            <input
              type="number"
              value={simPrice}
              onChange={(e) => setSimPrice(parseFloat(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: "#0F172A",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#F8FAFC",
                fontSize: "16px",
                fontWeight: 700,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>
              Sample Quantity (Units)
            </label>
            <input
              type="number"
              value={simQty}
              onChange={(e) => setSimQty(parseInt(e.target.value, 10) || 1)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: "#0F172A",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#00E5FF",
                fontSize: "16px",
                fontWeight: 700,
              }}
            />
          </div>

          <div
            style={{
              backgroundColor: "#0F172A",
              padding: "16px 20px",
              borderRadius: "10px",
              border: "1px solid rgba(0, 229, 255, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                Triggered Tier: <strong style={{ color: "#FACC15" }}>{activeTier ? activeTier.label : "Base / Standard"}</strong>
              </div>
              <div style={{ fontSize: "13px", color: "#34D399", marginTop: "2px" }}>
                Effective Discount: {effectiveDiscount}% OFF
              </div>
              <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                Per Unit: {formatCurrency(unitDiscountedPrice)}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>Total Order Value</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#00E5FF" }}>
                {formatCurrency(totalDiscounted)}
              </div>
              <div style={{ fontSize: "11px", color: "#34D399" }}>
                Saved {formatCurrency(totalSaved)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
