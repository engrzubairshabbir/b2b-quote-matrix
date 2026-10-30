import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { BILLING_PLANS, createSubscription, getActiveSubscription } from "../services/billing.server";

export const loader = async ({ request }) => {
  let shop = "quickstart-demo.myshopify.com";
  let activeSubscription = null;

  try {
    const { session, admin } = await authenticate.admin(request);
    if (session?.shop) shop = session.shop;
    if (admin) {
      activeSubscription = await getActiveSubscription({ admin });
    }
  } catch (err) {}

  const config = await prisma.appConfig.findUnique({ where: { shop } });
  const currentPlan = config?.activePlan || "PRO_SCALE";

  return json({
    shop,
    config,
    currentPlan,
    activeSubscription,
    plans: BILLING_PLANS,
  });
};

export const action = async ({ request }) => {
  let shop = "quickstart-demo.myshopify.com";
  let admin = null;

  try {
    const auth = await authenticate.admin(request);
    admin = auth.admin;
    if (auth.session?.shop) shop = auth.session.shop;
  } catch (err) {}

  const formData = await request.formData();
  const planKey = formData.get("planKey");
  const host = new URL(request.url).origin;
  const returnUrl = `${host}/app/pricing?subscribed=true&plan=${planKey}`;

  if (!BILLING_PLANS[planKey]) {
    return json({ error: "Invalid subscription plan selected" }, { status: 400 });
  }

  if (admin) {
    try {
      const { confirmationUrl } = await createSubscription({
        admin,
        returnUrl,
        planKey,
        test: true, // test mode enabled for dev/test stores
      });

      if (confirmationUrl) {
        return redirect(confirmationUrl);
      }
    } catch (err) {
      console.error("Shopify Billing GraphQL Error:", err);
      return json({ error: `Billing Error: ${err.message}` });
    }
  }

  // Standalone local preview / dev update
  await prisma.appConfig.upsert({
    where: { shop },
    update: { activePlan: planKey },
    create: { shop, activePlan: planKey },
  });

  return json({
    success: true,
    message: `Plan updated to ${BILLING_PLANS[planKey].name}! (Demo / Test mode simulated)`,
    newPlan: planKey,
  });
};

export default function PricingRoute() {
  const { currentPlan, plans, activeSubscription } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", paddingBottom: "8px" }}>
        <span
          style={{
            backgroundColor: "rgba(0, 229, 255, 0.15)",
            border: "1px solid #00E5FF",
            color: "#00E5FF",
            padding: "4px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Shopify Recurring App Billing
        </span>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            color: "#F8FAFC",
            marginTop: "14px",
            marginBottom: "8px",
          }}
        >
          Predictable B2B Volume Pricing for Scaled Growth
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "15px", maxWidth: "600px", margin: "0 auto" }}>
          Every plan includes a 7-day free trial. Charges are billed securely via your official Shopify Merchant Invoice through GraphQL Recurring Billing.
        </p>
      </div>

      {/* Notifications */}
      {actionData?.message && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "10px",
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            color: "#4ADE80",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          ✓ {actionData.message}
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
            textAlign: "center",
          }}
        >
          ⚠️ {actionData.error}
        </div>
      )}

      {/* 2 Plans Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "28px",
          alignItems: "stretch",
        }}
      >
        {/* Plan 1: Starter */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "18px",
            border: currentPlan === "STARTER" ? "2px solid #00E5FF" : "1px solid rgba(255, 255, 255, 0.1)",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
                {plans.STARTER.name}
              </h3>
              {currentPlan === "STARTER" && (
                <span
                  style={{
                    backgroundColor: "rgba(0, 229, 255, 0.15)",
                    color: "#00E5FF",
                    border: "1px solid #00E5FF",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  ACTIVE PLAN
                </span>
              )}
            </div>

            <p style={{ color: "#94A3B8", fontSize: "13px", marginTop: "8px", minHeight: "36px" }}>
              Ideal for emerging high-ticket stores launching wholesale pricing and bulk inquiries.
            </p>

            <div style={{ marginTop: "20px", marginBottom: "24px" }}>
              <span style={{ fontSize: "40px", fontWeight: 800, color: "#F8FAFC", fontFamily: "'Outfit', sans-serif" }}>
                ${plans.STARTER.price}
              </span>
              <span style={{ color: "#94A3B8", fontSize: "14px" }}> / month</span>
              <div style={{ fontSize: "12px", color: "#34D399", marginTop: "4px" }}>
                7-Day Risk-Free Trial Included
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#CBD5E1", textTransform: "uppercase", marginBottom: "12px" }}>
                Included Features:
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {plans.STARTER.features.map((f, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#E2E8F0", fontSize: "13px" }}>
                    <span style={{ color: "#00E5FF", fontSize: "15px" }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Form method="post" style={{ marginTop: "32px" }}>
            <input type="hidden" name="planKey" value="STARTER" />
            <button
              type="submit"
              disabled={currentPlan === "STARTER" || isSubmitting}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                backgroundColor: currentPlan === "STARTER" ? "#334155" : "transparent",
                border: currentPlan === "STARTER" ? "none" : "1px solid #00E5FF",
                color: currentPlan === "STARTER" ? "#94A3B8" : "#00E5FF",
                fontWeight: 700,
                fontSize: "14px",
                cursor: currentPlan === "STARTER" || isSubmitting ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {currentPlan === "STARTER" ? "Current Plan" : "Select Starter Plan"}
            </button>
          </Form>
        </div>

        {/* Plan 2: Pro Scale (Recommended) */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "18px",
            border: "2px solid #00E5FF",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 0 35px rgba(0, 229, 255, 0.25)",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(180deg, #1E293B 0%, #131E33 100%)",
          }}
        >
          {/* Most Popular Badge */}
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "-32px",
              transform: "rotate(45deg)",
              background: "linear-gradient(90deg, #00E5FF, #3B82F6)",
              color: "#0F172A",
              fontWeight: 800,
              fontSize: "10px",
              padding: "4px 36px",
              textTransform: "uppercase",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            MOST POPULAR
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
                {plans.PRO_SCALE.name}
              </h3>
              {currentPlan === "PRO_SCALE" && (
                <span
                  style={{
                    backgroundColor: "rgba(0, 229, 255, 0.2)",
                    color: "#00E5FF",
                    border: "1px solid #00E5FF",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  ACTIVE PLAN
                </span>
              )}
            </div>

            <p style={{ color: "#94A3B8", fontSize: "13px", marginTop: "8px", minHeight: "36px" }}>
              Full automation suite for serious commercial merchants closing high-value B2B purchase orders.
            </p>

            <div style={{ marginTop: "20px", marginBottom: "24px" }}>
              <span style={{ fontSize: "40px", fontWeight: 800, color: "#00E5FF", fontFamily: "'Outfit', sans-serif" }}>
                ${plans.PRO_SCALE.price}
              </span>
              <span style={{ color: "#94A3B8", fontSize: "14px" }}> / month</span>
              <div style={{ fontSize: "12px", color: "#34D399", marginTop: "4px" }}>
                7-Day Risk-Free Trial Included
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#00E5FF", textTransform: "uppercase", marginBottom: "12px" }}>
                Everything in Starter, plus:
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {plans.PRO_SCALE.features.map((f, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#F8FAFC", fontSize: "13px", fontWeight: 500 }}>
                    <span style={{ color: "#00E5FF", fontSize: "15px" }}>★</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Form method="post" style={{ marginTop: "32px" }}>
            <input type="hidden" name="planKey" value="PRO_SCALE" />
            <button
              type="submit"
              disabled={currentPlan === "PRO_SCALE" || isSubmitting}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                background: currentPlan === "PRO_SCALE" ? "#334155" : "linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)",
                border: "none",
                color: currentPlan === "PRO_SCALE" ? "#94A3B8" : "#0B0F19",
                fontWeight: 800,
                fontSize: "14px",
                cursor: currentPlan === "PRO_SCALE" || isSubmitting ? "not-allowed" : "pointer",
                boxShadow: currentPlan === "PRO_SCALE" ? "none" : "0 0 25px rgba(0, 229, 255, 0.5)",
                transition: "all 0.2s ease",
              }}
            >
              {currentPlan === "PRO_SCALE" ? "Current Active Plan" : "Upgrade to Pro Scale (7 Days Free)"}
            </button>
          </Form>
        </div>
      </div>

      {/* Security & Guarantee Note */}
      <div
        style={{
          textAlign: "center",
          color: "#64748B",
          fontSize: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "18px",
          marginTop: "12px",
        }}
      >
        <span>🔒 Official Shopify Admin GraphQL Recurring Billing</span>
        <span>•</span>
        <span>⚡ Cancel or Switch anytime from Shopify Admin</span>
        <span>•</span>
        <span>⏱️ Instant 7-Day Free Trial Activation</span>
      </div>
    </div>
  );
}
