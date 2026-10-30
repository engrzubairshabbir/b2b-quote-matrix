import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  let shop = "quickstart-demo.myshopify.com";
  try {
    const { session } = await authenticate.admin(request);
    if (session?.shop) shop = session.shop;
  } catch (err) {}

  let config = await prisma.appConfig.findUnique({ where: { shop } });
  if (!config) {
    config = await prisma.appConfig.create({
      data: {
        shop,
        enableTieredMatrix: true,
        primaryColor: "#00E5FF",
        buttonText: "Request B2B Bulk Quote",
        requireCompany: true,
        requireTaxId: false,
        autoApproveDiscounts: false,
        notificationEmail: "b2b-sales@consultways.com",
      },
    });
  }

  return json({ config, shop });
};

export const action = async ({ request }) => {
  let shop = "quickstart-demo.myshopify.com";
  try {
    const { session } = await authenticate.admin(request);
    if (session?.shop) shop = session.shop;
  } catch (err) {}

  const formData = await request.formData();
  const enableTieredMatrix = formData.get("enableTieredMatrix") === "true";
  const primaryColor = formData.get("primaryColor") || "#00E5FF";
  const buttonText = formData.get("buttonText") || "Request B2B Bulk Quote";
  const requireCompany = formData.get("requireCompany") === "true";
  const requireTaxId = formData.get("requireTaxId") === "true";
  const autoApproveDiscounts = formData.get("autoApproveDiscounts") === "true";
  const notificationEmail = formData.get("notificationEmail") || "";

  const updatedConfig = await prisma.appConfig.upsert({
    where: { shop },
    update: {
      enableTieredMatrix,
      primaryColor,
      buttonText,
      requireCompany,
      requireTaxId,
      autoApproveDiscounts,
      notificationEmail,
    },
    create: {
      shop,
      enableTieredMatrix,
      primaryColor,
      buttonText,
      requireCompany,
      requireTaxId,
      autoApproveDiscounts,
      notificationEmail,
    },
  });

  return json({
    success: true,
    message: "Storefront widget and B2B quotation preferences saved successfully!",
    config: updatedConfig,
  });
};

export default function SettingsRoute() {
  const { config } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const currentConfig = actionData?.config || config;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ paddingBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            margin: 0,
            color: "#F8FAFC",
          }}
        >
          Widget Styling & Commercial Quotation Settings
        </h1>
        <p style={{ margin: "6px 0 0 0", color: "#94A3B8", fontSize: "14px" }}>
          Customize your storefront B2B quotation modal, neon branding colors, and form requirements.
        </p>
      </div>

      {actionData?.message && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "10px",
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            color: "#4ADE80",
            fontSize: "14px",
          }}
        >
          ✓ {actionData.message}
        </div>
      )}

      <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Section 1: Storefront Widget Styling */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
            🎨 Brand Accent & CTA Customization
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#CBD5E1", marginBottom: "6px" }}>
                Primary Brand Neon Accent Color
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="color"
                  name="primaryColor"
                  defaultValue={currentConfig.primaryColor}
                  style={{
                    width: "48px",
                    height: "44px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "transparent",
                  }}
                />
                <input
                  type="text"
                  name="primaryColorText"
                  defaultValue={currentConfig.primaryColor}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#0F172A",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#F8FAFC",
                    fontSize: "14px",
                    fontFamily: "monospace",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#CBD5E1", marginBottom: "6px" }}>
                Storefront CTA Button Text
              </label>
              <input
                type="text"
                name="buttonText"
                defaultValue={currentConfig.buttonText}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#0F172A",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#F8FAFC",
                  fontSize: "14px",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
            <input
              type="checkbox"
              id="enableTieredMatrix"
              name="enableTieredMatrix"
              value="true"
              defaultChecked={currentConfig.enableTieredMatrix}
              style={{ width: "18px", height: "18px", accentColor: "#00E5FF", cursor: "pointer" }}
            />
            <label htmlFor="enableTieredMatrix" style={{ fontSize: "14px", color: "#F8FAFC", cursor: "pointer" }}>
              Enable dynamic volume discount table on product pages
            </label>
          </div>
        </div>

        {/* Section 2: Form Requirements */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
            📋 B2B Modal Form Validation & Requirements
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="checkbox"
                id="requireCompany"
                name="requireCompany"
                value="true"
                defaultChecked={currentConfig.requireCompany}
                style={{ width: "18px", height: "18px", accentColor: "#00E5FF", cursor: "pointer" }}
              />
              <div>
                <label htmlFor="requireCompany" style={{ fontSize: "14px", color: "#F8FAFC", cursor: "pointer", fontWeight: 600 }}>
                  Require Company / Corporate Entity Name
                </label>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Prevents non-business consumer inquiries from requesting quotes.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="checkbox"
                id="requireTaxId"
                name="requireTaxId"
                value="true"
                defaultChecked={currentConfig.requireTaxId}
                style={{ width: "18px", height: "18px", accentColor: "#00E5FF", cursor: "pointer" }}
              />
              <div>
                <label htmlFor="requireTaxId" style={{ fontSize: "14px", color: "#F8FAFC", cursor: "pointer", fontWeight: 600 }}>
                  Require Tax ID / VAT Registration Number
                </label>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                  Mandates business tax registration number (EIN, VAT, GST) for tax-exempt B2B buyers.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Desk */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#F8FAFC", margin: 0 }}>
            🔔 Sales Desk Notification Routing
          </h2>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#CBD5E1", marginBottom: "6px" }}>
              Sales Desk Notification Email Address
            </label>
            <input
              type="email"
              name="notificationEmail"
              defaultValue={currentConfig.notificationEmail || "b2b-sales@consultways.com"}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: "#0F172A",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#F8FAFC",
                fontSize: "14px",
              }}
            />
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "6px" }}>
              Instant email notification dispatched whenever a high-ticket quote request is submitted.
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "14px 28px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)",
            border: "none",
            color: "#0B0F19",
            fontWeight: 800,
            fontSize: "15px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            alignSelf: "flex-start",
            boxShadow: "0 0 20px rgba(0, 229, 255, 0.4)",
          }}
        >
          {isSubmitting ? "Saving Preferences..." : "Save Preferences"}
        </button>
      </Form>
    </div>
  );
}
