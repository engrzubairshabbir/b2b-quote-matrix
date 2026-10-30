import { useState } from "react";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { login } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  return json({ shop });
};

export const action = async ({ request }) => {
  const errors = {};
  const formData = await request.formData();
  const shop = formData.get("shop");

  if (!shop) {
    errors.shop = "Please enter your Shopify store domain (e.g. your-store.myshopify.com)";
    return json({ errors }, { status: 400 });
  }

  return login(request);
};

export default function AuthLogin() {
  const { shop: defaultShop } = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState(defaultShop);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0B0F19",
        color: "#F8FAFC",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "36px",
          backgroundColor: "#1E293B",
          borderRadius: "16px",
          border: "1px solid rgba(0, 229, 255, 0.3)",
          boxShadow: "0 0 40px rgba(0, 229, 255, 0.15)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "20px",
            color: "#0F172A",
            marginBottom: "16px",
          }}
        >
          CW
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px 0", fontFamily: "'Outfit', sans-serif" }}>
          ConsultWays B2B Quote Pro
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 24px 0" }}>
          Log in with your Shopify store domain to access your B2B quotation desk.
        </p>

        {actionData?.errors?.shop && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              color: "#F87171",
              fontSize: "13px",
              marginBottom: "16px",
              textAlign: "left",
            }}
          >
            {actionData.errors.shop}
          </div>
        )}

        <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ textAlign: "left" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#CBD5E1", marginBottom: "6px" }}>
              Shopify Store Domain
            </label>
            <input
              type="text"
              name="shop"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              placeholder="example.myshopify.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "8px",
                backgroundColor: "#0F172A",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#F8FAFC",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)",
              border: "none",
              color: "#0B0F19",
              fontWeight: 800,
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 0 15px rgba(0, 229, 255, 0.4)",
            }}
          >
            Log in to Shopify &rarr;
          </button>
        </Form>
      </div>
    </div>
  );
}
