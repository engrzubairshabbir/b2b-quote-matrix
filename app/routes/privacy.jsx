export default function PrivacyPolicy() {
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
        {/* Header */}
        <div style={{ borderBottom: "1px solid #1F2937", paddingBottom: "24px", marginBottom: "32px" }}>
          <div style={{ display: "inline-block", background: "rgba(0, 229, 255, 0.1)", color: "#00E5FF", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
            Legal & Compliance
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#F8FAFC", margin: "0 0 10px 0" }}>
            Privacy Policy
          </h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: "14px" }}>
            <strong>ConsultWays B2B Quote & Bulk Discounts</strong> • Last Updated: October 31, 2026
          </p>
        </div>

        {/* Content */}
        <div style={{ lineHeight: "1.75", fontSize: "15px", color: "#CBD5E1" }}>
          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>1. Introduction</h2>
            <p>
              Welcome to <strong>ConsultWays B2B Quote & Bulk Discounts</strong> ("the App", "we", "us", or "our"), developed and operated by <strong>ConsultWays Limited</strong>. This Privacy Policy describes how merchant, customer, and quote inquiry data is collected, processed, and protected when you install and use our Shopify application.
            </p>
            <p>
              We are strictly committed to safeguarding business privacy and comply with the European Union General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and Shopify Partner API Data Protection Requirements.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>2. Data We Collect</h2>
            <p>When you install and activate the App on your Shopify store, we access and store only the data strictly necessary to facilitate wholesale tiered pricing and custom quote management:</p>
            <ul style={{ paddingLeft: "24px", margin: "12px 0" }}>
              <li style={{ marginBottom: "8px" }}>
                <strong>Merchant Store Data:</strong> Store domain (.myshopify.com), merchant contact email, and authorized Shopify API access tokens required to perform actions on your behalf (such as creating Draft Orders).
              </li>
              <li style={{ marginBottom: "8px" }}>
                <strong>B2B Quote Inquiry Details:</strong> When a wholesale buyer submits a quote request via the Storefront modal, we securely record their name, business email, corporate entity name, phone number, VAT/Tax ID (if requested), requested line items, quantities, and optional shipping address.
              </li>
              <li style={{ marginBottom: "8px" }}>
                <strong>App Configuration & Volume Tier Rules:</strong> Merchant-configured wholesale discount tiers, brand accent color tokens, button CTA customizations, and notification routing preferences.
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>3. How We Use Your Data</h2>
            <p>Collected data is used exclusively to:</p>
            <ul style={{ paddingLeft: "24px", margin: "12px 0" }}>
              <li style={{ marginBottom: "8px" }}>Display wholesale tiered pricing tables and dynamic bulk calculators on product pages.</li>
              <li style={{ marginBottom: "8px" }}>Manage and organize inbound high-ticket quote inquiries inside the Merchant Admin Pipeline.</li>
              <li style={{ marginBottom: "8px" }}>Execute official Shopify Draft Orders and email branded checkout invoices via authorized GraphQL API mutations.</li>
              <li style={{ marginBottom: "8px" }}>Ensure real-time synchronization of merchant session states and billing subscription tiers.</li>
            </ul>
            <p><strong>We never sell, rent, monetize, or broker any customer or business transaction data to third-party data aggregators or advertising networks.</strong></p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>4. Data Security & Storage</h2>
            <p>
              All communication between your Shopify storefront, the App backend, and database infrastructure is enforced via end-to-end 256-bit TLS/SSL encryption. Data is stored in secure, enterprise-grade cloud environments with strict role-based access control (RBAC) and automated DDoS mitigation.
            </p>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>5. Shopify Mandatory Webhooks & GDPR Compliance</h2>
            <p>The App strictly complies with Shopify mandatory compliance webhooks:</p>
            <ul style={{ paddingLeft: "24px", margin: "12px 0" }}>
              <li style={{ marginBottom: "8px" }}><strong>Customer Data Request (`customers/data_request`):</strong> We supply any quote inquiries submitted by the requested customer within the required timeline.</li>
              <li style={{ marginBottom: "8px" }}><strong>Customer Data Erasure (`customers/redact`):</strong> All personal and contact details linked to the customer are purged from quote logs upon request.</li>
              <li style={{ marginBottom: "8px" }}><strong>Shop Data Erasure (`shop/redact`):</strong> Within 48 hours of an uninstallation or store deletion event, all associated merchant sessions, configurations, and quote history are permanently scrubbed.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "28px" }}>
            <h2 style={{ color: "#F1F5F9", fontSize: "20px", fontWeight: "700", marginBottom: "12px" }}>6. Merchant Rights & Contact Information</h2>
            <p>
              Merchants and consumers retain full rights to inspect, update, or permanently delete their personal data. For privacy inquiries, compliance audits, or support, please contact our Data Protection Officer:
            </p>
            <div style={{ background: "#1E293B", padding: "18px 24px", borderRadius: "10px", marginTop: "12px" }}>
              <p style={{ margin: "0 0 6px 0", color: "#F8FAFC" }}><strong>ConsultWays Limited</strong></p>
              <p style={{ margin: "0 0 6px 0", color: "#94A3B8" }}>Support & Compliance Desk: <a href="mailto:help.econsult@gmail.com" style={{ color: "#00E5FF", textDecoration: "none" }}>help.econsult@gmail.com</a></p>
              <p style={{ margin: "0 0 6px 0", color: "#94A3B8" }}>Corporate Website: <a href="https://consultways.com" target="_blank" rel="noreferrer" style={{ color: "#00E5FF", textDecoration: "none" }}>https://consultways.com</a></p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #1F2937", paddingTop: "20px", marginTop: "32px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
          © {new Date().getFullYear()} ConsultWays Limited. All rights reserved. Built for Shopify merchants worldwide.
        </div>
      </div>
    </div>
  );
}
