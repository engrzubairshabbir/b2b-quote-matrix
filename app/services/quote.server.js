import prisma from "../db.server";

/**
 * Calculates the applicable tiered discount percentage based on quantity and configured rules.
 */
export async function calculateTierDiscount(shop, quantity) {
  const rules = await prisma.tieredDiscountRule.findMany({
    where: { shop },
    orderBy: { minQuantity: "desc" },
  });

  if (!rules || rules.length === 0) {
    // Default fallback brackets if shop hasn't configured custom rules yet
    if (quantity >= 50) return { discountPercent: 25.0, label: "Enterprise Bulk: 25% OFF" };
    if (quantity >= 10) return { discountPercent: 15.0, label: "Wholesale Tier 1: 15% OFF" };
    return { discountPercent: 0.0, label: "Standard Price" };
  }

  for (const rule of rules) {
    if (quantity >= rule.minQuantity) {
      if (rule.maxQuantity === null || rule.maxQuantity === undefined || quantity <= rule.maxQuantity) {
        return {
          discountPercent: rule.discountPercent,
          label: rule.label,
        };
      }
    }
  }

  return { discountPercent: 0.0, label: "Standard Price" };
}

/**
 * Generates the next sequential Quote Number (e.g. CW-Q1001)
 */
export async function getNextQuoteNumber(shop) {
  const latestQuote = await prisma.quoteRequest.findFirst({
    where: { shop },
    orderBy: { createdAt: "desc" },
    select: { quoteNumber: true },
  });

  if (!latestQuote || !latestQuote.quoteNumber) {
    return "CW-Q1001";
  }

  const match = latestQuote.quoteNumber.match(/CW-Q(\d+)/i);
  if (match && match[1]) {
    const nextSeq = parseInt(match[1], 10) + 1;
    return `CW-Q${nextSeq}`;
  }

  return `CW-Q${Date.now().toString().slice(-4)}`;
}

/**
 * Calculates KPI metrics for the merchant dashboard
 */
export async function getDashboardMetrics(shop) {
  const quotes = await prisma.quoteRequest.findMany({
    where: { shop },
  });

  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter((q) => q.status === "PENDING");
  const approvedQuotes = quotes.filter((q) => q.status === "APPROVED");
  const invoiceSentQuotes = quotes.filter((q) => q.status === "INVOICE_SENT");
  const rejectedQuotes = quotes.filter((q) => q.status === "REJECTED");

  // Pipeline value is sum of pending + approved quotes
  const totalPipelineValue = quotes
    .filter((q) => q.status === "PENDING" || q.status === "APPROVED")
    .reduce((sum, q) => sum + q.totalAmount, 0);

  // Converted revenue is sum of invoice_sent
  const convertedRevenue = invoiceSentQuotes.reduce((sum, q) => sum + q.totalAmount, 0);

  // Average B2B Order Value (AOV) across all active quotes
  const nonRejectedQuotes = quotes.filter((q) => q.status !== "REJECTED");
  const averageOrderValue =
    nonRejectedQuotes.length > 0
      ? nonRejectedQuotes.reduce((sum, q) => sum + q.totalAmount, 0) / nonRejectedQuotes.length
      : 0;

  return {
    totalQuotes,
    pendingCount: pendingQuotes.length,
    approvedCount: approvedQuotes.length,
    invoiceSentCount: invoiceSentQuotes.length,
    rejectedCount: rejectedQuotes.length,
    totalPipelineValue,
    convertedRevenue,
    averageOrderValue,
    conversionRate:
      totalQuotes > 0 ? ((invoiceSentQuotes.length / totalQuotes) * 100).toFixed(1) : "0.0",
  };
}
