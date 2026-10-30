import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useLocation, useRouteError } from "@remix-run/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import { NavMenu } from "@shopify/app-bridge-react";
import enTranslations from "@shopify/polaris/locales/en.json";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    return json({
      apiKey: process.env.SHOPIFY_API_KEY || "cw_b2b_matrix_pro",
      shop: session?.shop || "quickstart-demo.myshopify.com",
      isEmbedded: true,
    });
  } catch (error) {
    // Graceful fallback for local preview & testing
    return json({
      apiKey: process.env.SHOPIFY_API_KEY || "cw_b2b_matrix_pro",
      shop: "quickstart-demo.myshopify.com",
      isEmbedded: false,
    });
  }
};

export default function AppLayout() {
  const { shop } = useLoaderData();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard & Quotes", path: "/app", icon: "📊" },
    { label: "Tiered Matrix Builder", path: "/app/tiers", icon: "🏷️" },
    { label: "Plans & Billing", path: "/app/pricing", icon: "💳" },
    { label: "App Settings", path: "/app/settings", icon: "⚙️" },
    { label: "Storefront Live Preview", path: "/demo", icon: "🚀", external: false },
  ];

  return (
    <PolarisAppProvider i18n={enTranslations}>
      <NavMenu>
        <Link to="/app" rel="home">Dashboard & Quotes</Link>
        <Link to="/app/tiers">Tiered Matrix</Link>
        <Link to="/app/pricing">Plans & Billing</Link>
        <Link to="/app/settings">Settings</Link>
      </NavMenu>
      <div style={{ minHeight: "100vh", backgroundColor: "#0F172A", color: "#F8FAFC" }}>

        {/* Modern ConsultWays Navigation Header */}
        <header
          style={{
            background: "linear-gradient(90deg, #0B0F19 0%, #1E293B 100%)",
            borderBottom: "1px solid rgba(0, 229, 255, 0.2)",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 15px rgba(0, 229, 255, 0.5)",
                fontWeight: "bold",
                color: "#0F172A",
                fontSize: "18px",
              }}
            >
              CW
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "17px",
                    letterSpacing: "-0.3px",
                    color: "#FFFFFF",
                  }}
                >
                  ConsultWays B2B Quote & Tiered Matrix Pro
                </span>
                <span
                  style={{
                    backgroundColor: "rgba(0, 229, 255, 0.15)",
                    border: "1px solid #00E5FF",
                    color: "#00E5FF",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  High-Ticket B2B
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                Connected Store: <strong style={{ color: "#E2E8F0" }}>{shop}</strong>
              </div>
            </div>
          </div>

          {/* Navigation Bar Pills */}
          <nav style={{ display: "flex", gap: "8px" }}>
            {navItems.map((item) => {
              const isActive =
                item.path === "/app"
                  ? location.pathname === "/app"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                    color: isActive ? "#00E5FF" : "#94A3B8",
                    backgroundColor: isActive
                      ? "rgba(0, 229, 255, 0.12)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: isActive
                      ? "1px solid rgba(0, 229, 255, 0.4)"
                      : "1px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Content Area */}
        <main style={{ padding: "24px 32px", maxWidth: "1600px", margin: "0 auto" }}>
          <Outlet />
        </main>
      </div>
    </PolarisAppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <PolarisAppProvider i18n={enTranslations}>
      <div style={{ padding: "40px", color: "#FFFFFF", backgroundColor: "#0F172A", minHeight: "100vh" }}>
        <h2 style={{ color: "#EF4444" }}>An error occurred in ConsultWays B2B App</h2>
        <p style={{ color: "#94A3B8" }}>{error?.message || "Please reload or check application configuration."}</p>
        <Link to="/app" style={{ color: "#00E5FF", textDecoration: "underline" }}>
          Return to Dashboard
        </Link>
      </div>
    </PolarisAppProvider>
  );
}
