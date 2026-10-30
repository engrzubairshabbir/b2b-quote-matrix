export default function TermsOfService() {
  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      backgroundColor: "#0B0F19",
      color: "#E2E8F0",
      minHeight: "100vh",
      padding: "40px 20px"
    }}>
      <div style={{
        maxWidth: "860px",
        margin: "0 auto",
        backgroundColor: "#111827",
        borderRadius: "16px",
        padding: "48px 40px",
        border: "1px solid #1F2937",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
      }}>
        <div style={{ borderBottom: "1px solid #1F2937", paddingBottom: "24px", marginBottom: "32px" }}>
          <div style={{ display: "inline-block", background: "rgba(0, 229, 255, 0.1)", color: "#00E5FF", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
            Terms of Service
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#F8FAFC", margin: "0 0 10px 0" }}>
            Terms & Conditions
          </h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: "14px" }}>
            <strong>ConsultWays B2B Quote & Bulk Discounts</strong> • Last Updated: October 31, 2026
          </p>
        </div>

        <div style={{ lineHeight: "1.75", fontSize: "15px", color: "#CBD5E1" }}>
          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>1. Acceptance of Terms</h2>
            <p>
              By installing and using ConsultWays B2B Quote & Bulk Discounts ("the App"), you agree to be bound by these Terms of Service. If you disagree with any portion of these terms, you must immediately uninstall the App from your Shopify store.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>2. App Services & Functionality</h2>
            <p>
              The App provides tools enabling Shopify merchants to showcase volume wholesale discount matrices, capture custom commercial quote requests, calculate wholesale tiered pricing, and convert quotes to official Shopify Draft Orders.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>3. Billing & Recurring Charges</h2>
            <p>
              The App offers a 7-Day Free Trial followed by recurring monthly SaaS billing managed directly through the official Shopify Billing API. Charges are consolidated and invoiced directly via your standard Shopify subscription invoice.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>4. Support & Maintenance</h2>
            <p>
              We provide continuous software updates and responsive customer support via email at <a href="mailto:help.econsult@gmail.com" style={{ color: "#00E5FF", textDecoration: "none" }}>help.econsult@gmail.com</a>.
            </p>
          </section>
        </div>

        <div style={{ borderTop: "1px solid #1F2937", paddingTop: "20px", marginTop: "32px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
          © {new Date().getFullYear()} ConsultWays Limited. All rights reserved.
        </div>
      </div>
    </div>
  );
}
