import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useSubmit } from "@remix-run/react";
import { useState } from "react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { getDashboardMetrics } from "../services/quote.server";

export const loader = async ({ request }) => {
  let shop = "quickstart-demo.myshopify.com";
  try {
    const { session } = await authenticate.admin(request);
    if (session?.shop) shop = session.shop;
  } catch (err) {
    // Demo fallback for local development
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || "ALL";
  const searchQuery = url.searchParams.get("q") || "";

  // Query database
  const whereClause = { shop };
  if (statusFilter !== "ALL") {
    whereClause.status = statusFilter;
  }
  if (searchQuery) {
    whereClause.OR = [
      { quoteNumber: { contains: searchQuery } },
      { customerName: { contains: searchQuery } },
      { customerEmail: { contains: searchQuery } },
      { companyName: { contains: searchQuery } },
      { productTitle: { contains: searchQuery } },
    ];
  }

  const quotes = await prisma.quoteRequest.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  const metrics = await getDashboardMetrics(shop);
  const config = await prisma.appConfig.findUnique({ where: { shop } });

  return json({
    quotes,
    metrics,
    statusFilter,
    searchQuery,
    shop,
    config,
  });
};

export const action = async ({ request }) => {
  let shop = "quickstart-demo.myshopify.com";
  try {
    const { session } = await authenticate.admin(request);
    if (session?.shop) shop = session.shop;
  } catch (err) {}

  const formData = await request.formData();
  const intent = formData.get("intent");
  const quoteId = formData.get("quoteId");

  if (intent === "approve_quote" && quoteId) {
    await prisma.quoteRequest.update({
      where: { id: quoteId },
      data: { status: "APPROVED" },
    });
    return json({ success: true, message: "Quote approved successfully." });
  }

  if (intent === "reject_quote" && quoteId) {
    await prisma.quoteRequest.update({
      where: { id: quoteId },
      data: { status: "REJECTED" },
    });
    return json({ success: true, message: "Quote marked as rejected." });
  }

  return json({ success: false });
};

export default function Dashboard() {
  const { quotes, metrics, statusFilter, searchQuery, shop } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState(searchQuery || "");
  const submit = useSubmit();

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val || 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Pending Review",
          bg: "rgba(234, 179, 8, 0.15)",
          color: "#FACC15",
          border: "1px solid rgba(234, 179, 8, 0.4)",
        };
      case "APPROVED":
        return {
          label: "Approved (Ready for DO)",
          bg: "rgba(59, 130, 246, 0.15)",
          color: "#60A5FA",
          border: "1px solid rgba(59, 130, 246, 0.4)",
        };
      case "INVOICE_SENT":
        return {
          label: "Draft Order Sent",
          bg: "rgba(34, 197, 94, 0.15)",
          color: "#4ADE80",
          border: "1px solid rgba(34, 197, 94, 0.4)",
        };
      case "REJECTED":
        return {
          label: "Declined",
          bg: "rgba(239, 68, 68, 0.15)",
          color: "#F87171",
          border: "1px solid rgba(239, 68, 68, 0.4)",
        };
      default:
        return {
          label: status,
          bg: "rgba(148, 163, 184, 0.15)",
          color: "#CBD5E1",
          border: "1px solid rgba(148, 163, 184, 0.4)",
        };
    }
  };

  const handleStatusFilter = (newStatus) => {
    const params = new URLSearchParams(window.location.search);
    if (newStatus === "ALL") {
      params.delete("status");
    } else {
      params.set("status", newStatus);
    }
    submit(params, { method: "get" });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchTerm) {
      params.set("q", searchTerm);
    } else {
      params.delete("q");
    }
    submit(params, { method: "get" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Banner / Hero Title */}
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
              letterSpacing: "-0.5px",
            }}
          >
            B2B Quotation Command Center
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "#94A3B8", fontSize: "14px" }}>
            Real-time pipeline monitoring, volume discount audits, and automated Shopify Draft Order dispatch.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
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
              fontWeight: 600,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 0 15px rgba(0, 229, 255, 0.2)",
            }}
          >
            <span>🚀</span> Test Buyer Experience
          </Link>
          <Link
            to="/app/tiers"
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%)",
              color: "#0B0F19",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(0, 229, 255, 0.35)",
            }}
          >
            <span>🏷️</span> Configure Discount Tiers
          </Link>
        </div>
      </div>

      {/* 4 High-Impact KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "18px",
        }}
      >
        {/* Card 1: Pipeline Value */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #00E5FF, #3B82F6)",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" }}>
              Active Pipeline Value
            </span>
            <span style={{ fontSize: "20px" }}>💎</span>
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#00E5FF",
              fontFamily: "'Outfit', sans-serif",
              marginTop: "8px",
            }}
          >
            {formatCurrency(metrics.totalPipelineValue)}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
            Sum of pending & approved high-ticket quotes
          </div>
        </div>

        {/* Card 2: Active Pending */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #F59E0B, #EF4444)",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" }}>
              Pending Inquiries
            </span>
            <span style={{ fontSize: "20px" }}>⏳</span>
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#FACC15",
              fontFamily: "'Outfit', sans-serif",
              marginTop: "8px",
            }}
          >
            {metrics.pendingCount} Quotes
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
            Requires B2B sales desk review & conversion
          </div>
        </div>

        {/* Card 3: Converted B2B Revenue */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #10B981, #059669)",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" }}>
              Converted Invoiced B2B
            </span>
            <span style={{ fontSize: "20px" }}>📈</span>
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#4ADE80",
              fontFamily: "'Outfit', sans-serif",
              marginTop: "8px",
            }}
          >
            {formatCurrency(metrics.convertedRevenue)}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
            {metrics.invoiceSentCount} Draft orders sent ({metrics.conversionRate}% conversion rate)
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div
          style={{
            backgroundColor: "#1E293B",
            borderRadius: "14px",
            padding: "20px 24px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #8B5CF6, #EC4899)",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" }}>
              Average B2B Order Value
            </span>
            <span style={{ fontSize: "20px" }}>🎯</span>
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#C084FC",
              fontFamily: "'Outfit', sans-serif",
              marginTop: "8px",
            }}
          >
            {formatCurrency(metrics.averageOrderValue)}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
            High-ticket commercial basket average
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          backgroundColor: "#1E293B",
          borderRadius: "14px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Table Filter & Search Controls */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "6px", backgroundColor: "#0F172A", padding: "4px", borderRadius: "10px" }}>
            {[
              { id: "ALL", label: `All Quotes (${metrics.totalQuotes})` },
              { id: "PENDING", label: `Pending (${metrics.pendingCount})` },
              { id: "APPROVED", label: `Approved (${metrics.approvedCount})` },
              { id: "INVOICE_SENT", label: `Invoiced (${metrics.invoiceSentCount})` },
              { id: "REJECTED", label: `Declined (${metrics.rejectedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleStatusFilter(tab.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "7px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: statusFilter === tab.id ? "#00E5FF" : "transparent",
                  color: statusFilter === tab.id ? "#0F172A" : "#94A3B8",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by quote #, client, product..."
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                backgroundColor: "#0F172A",
                color: "#F8FAFC",
                fontSize: "13px",
                width: "280px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#334155",
                color: "#F8FAFC",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Filter
            </button>
          </form>
        </div>

        {/* Quotes Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#0F172A", color: "#94A3B8", fontSize: "12px", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 20px" }}>Quote #</th>
                <th style={{ padding: "14px 20px" }}>Buyer / Organization</th>
                <th style={{ padding: "14px 20px" }}>Product & Quantity</th>
                <th style={{ padding: "14px 20px" }}>Tier Discount</th>
                <th style={{ padding: "14px 20px" }}>Total Amount</th>
                <th style={{ padding: "14px 20px" }}>Status</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "#94A3B8" }}>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>📦</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#E2E8F0" }}>No B2B Quotes found</div>
                    <div style={{ fontSize: "13px", marginTop: "4px" }}>
                      Submit a sample quote via the{" "}
                      <Link to="/demo" style={{ color: "#00E5FF" }}>
                        Storefront Live Preview
                      </Link>{" "}
                      to view it here!
                    </div>
                  </td>
                </tr>
              ) : (
                quotes.map((q) => {
                  const badge = getStatusBadge(q.status);
                  return (
                    <tr
                      key={q.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Quote Number */}
                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                        <Link
                          to={`/app/quotes/${q.id}`}
                          style={{
                            color: "#00E5FF",
                            fontWeight: 700,
                            fontFamily: "monospace",
                            fontSize: "14px",
                            textDecoration: "none",
                          }}
                        >
                          {q.quoteNumber}
                        </Link>
                        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                          {new Date(q.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Buyer */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontWeight: 600, color: "#F8FAFC", fontSize: "14px" }}>
                          {q.customerName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                          {q.companyName || "Commercial Buyer"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748B" }}>{q.customerEmail}</div>
                      </td>

                      {/* Product */}
                      <td style={{ padding: "16px 20px", maxWidth: "280px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#E2E8F0",
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={q.productTitle}
                        >
                          {q.productTitle}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                          Qty: <strong style={{ color: "#F8FAFC" }}>{q.quantity} units</strong> @ {formatCurrency(q.unitPrice)}/ea
                        </div>
                        {q.targetDeliveryDate && (
                          <div style={{ fontSize: "11px", color: "#F59E0B" }}>
                            Target: {q.targetDeliveryDate}
                          </div>
                        )}
                      </td>

                      {/* Discount */}
                      <td style={{ padding: "16px 20px" }}>
                        {q.appliedDiscount > 0 ? (
                          <span
                            style={{
                              backgroundColor: "rgba(16, 185, 129, 0.15)",
                              color: "#34D399",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            {q.appliedDiscount}% OFF
                          </span>
                        ) : (
                          <span style={{ color: "#94A3B8", fontSize: "12px" }}>0% (Base)</span>
                        )}
                      </td>

                      {/* Total */}
                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#F8FAFC" }}>
                          {formatCurrency(q.totalAmount)}
                        </div>
                        {q.appliedDiscount > 0 && (
                          <div style={{ fontSize: "11px", color: "#34D399" }}>
                            Saved {formatCurrency((q.unitPrice * q.quantity * q.appliedDiscount) / 100)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            padding: "5px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: badge.border,
                            display: "inline-block",
                          }}
                        >
                          {badge.label}
                        </span>
                        {q.shopifyDraftOrderId && (
                          <div style={{ fontSize: "10px", color: "#64748B", marginTop: "4px" }}>
                            Shopify DO Linked
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <Link
                            to={`/app/quotes/${q.id}`}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              backgroundColor: "rgba(0, 229, 255, 0.15)",
                              border: "1px solid #00E5FF",
                              color: "#00E5FF",
                              fontSize: "12px",
                              fontWeight: 600,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>Inspect & Convert</span> &rarr;
                          </Link>

                          {q.status === "PENDING" && (
                            <Form method="post" style={{ display: "inline" }}>
                              <input type="hidden" name="intent" value="approve_quote" />
                              <input type="hidden" name="quoteId" value={q.id} />
                              <button
                                type="submit"
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  backgroundColor: "rgba(34, 197, 94, 0.2)",
                                  border: "1px solid rgba(34, 197, 94, 0.5)",
                                  color: "#4ADE80",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                                title="Quick Approve"
                              >
                                ✓ Approve
                              </button>
                            </Form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
