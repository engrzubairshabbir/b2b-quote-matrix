// Shopify Draft Order Service
// Uses GraphQL Admin API: draftOrderCreate and draftOrderSendInvoice

export const DRAFT_ORDER_CREATE_MUTATION = `#graphql
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        status
        invoiceUrl
        totalPrice
        appliedDiscount {
          title
          value
          valueType
          amount
        }
        customer {
          id
          displayName
          email
        }
        lineItems(first: 5) {
          edges {
            node {
              title
              quantity
              originalUnitPrice
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DRAFT_ORDER_SEND_INVOICE_MUTATION = `#graphql
  mutation DraftOrderSendInvoice($id: ID!, $email: EmailInput) {
    draftOrderSendInvoice(id: $id, email: $email) {
      draftOrder {
        id
        status
        invoiceUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Converts a QuoteRequest record into an official Shopify Draft Order
 * and automatically dispatches a branded invoice checkout link.
 */
export async function convertQuoteToDraftOrder({ admin, quote, customDiscount, customShippingFee }) {
  if (!quote) {
    throw new Error("Quote record is required for Draft Order conversion.");
  }

  // Calculate discount
  const discountPercent =
    customDiscount !== undefined ? parseFloat(customDiscount) : quote.appliedDiscount;
  
  // Clean variantId format: if it contains gid, use it, or fallback to custom item
  const hasVariantGid = quote.variantId && quote.variantId.startsWith("gid://shopify/ProductVariant/");
  
  const lineItem = hasVariantGid
    ? {
        variantId: quote.variantId,
        quantity: quote.quantity,
      }
    : {
        title: `${quote.productTitle} (${quote.variantTitle || "Standard Configuration"})`,
        originalUnitPrice: String(quote.unitPrice.toFixed(2)),
        quantity: quote.quantity,
        requiresShipping: true,
      };

  const appliedDiscountInput =
    discountPercent > 0
      ? {
          title: `ConsultWays B2B Volume Discount (${discountPercent}% OFF)`,
          value: discountPercent,
          valueType: "PERCENTAGE",
          description: `Applied tiered B2B pricing for Quote #${quote.quoteNumber}`,
        }
      : undefined;

  // Split customer name into first & last name
  const nameParts = (quote.customerName || "B2B Customer").trim().split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Buyer";

  const draftOrderInput = {
    note: `[ConsultWays B2B Quote #${quote.quoteNumber}]\nCustomer: ${quote.customerName} (${quote.companyName || "N/A"})\nTarget Delivery: ${quote.targetDeliveryDate || "Standard"}\nNotes: ${quote.notes || "None"}`,
    tags: ["ConsultWays-B2B", `Quote-${quote.quoteNumber}`, "Tiered-Matrix-Approved"],
    lineItems: [lineItem],
    appliedDiscount: appliedDiscountInput,
    shippingLine: customShippingFee
      ? {
          title: "B2B Freight & Commercial Handling",
          price: String(parseFloat(customShippingFee).toFixed(2)),
        }
      : undefined,
    email: quote.customerEmail,
    shippingAddress: quote.shippingAddress
      ? {
          address1: quote.shippingAddress,
          company: quote.companyName || undefined,
          firstName,
          lastName,
          phone: quote.phone || undefined,
        }
      : undefined,
  };

  // Step 1: Create Draft Order
  const createResponse = await admin.graphql(DRAFT_ORDER_CREATE_MUTATION, {
    variables: { input: draftOrderInput },
  });

  const createJson = await createResponse.json();
  const createResult = createJson.data?.draftOrderCreate;

  if (createResult?.userErrors && createResult.userErrors.length > 0) {
    throw new Error(
      `Shopify Draft Order Creation Failed: ${createResult.userErrors.map((e) => e.message).join(", ")}`
    );
  }

  const draftOrder = createResult.draftOrder;
  const draftOrderId = draftOrder.id;
  let finalInvoiceUrl = draftOrder.invoiceUrl;

  // Step 2: Dispatch Official Branded Checkout Invoice Email
  try {
    const sendInvoiceResponse = await admin.graphql(DRAFT_ORDER_SEND_INVOICE_MUTATION, {
      variables: {
        id: draftOrderId,
        email: {
          to: quote.customerEmail,
          subject: `Official B2B Invoice & Checkout: Quote #${quote.quoteNumber} - ${quote.productTitle}`,
          customMessage: `Dear ${quote.customerName},\n\nYour bulk quote request #${quote.quoteNumber} for "${quote.productTitle}" has been approved with our special B2B tiered wholesale pricing.\n\nPlease review your line items and complete your order through Shopify's secure 1-click checkout below.\n\nThank you,\nB2B Sales Desk`,
        },
      },
    });

    const sendInvoiceJson = await sendInvoiceResponse.json();
    const sendResult = sendInvoiceJson.data?.draftOrderSendInvoice;
    if (sendResult?.draftOrder?.invoiceUrl) {
      finalInvoiceUrl = sendResult.draftOrder.invoiceUrl;
    }
  } catch (invoiceErr) {
    console.warn("Draft order created, but sendInvoice step encountered non-blocking notice:", invoiceErr);
  }

  return {
    draftOrderId,
    draftOrderName: draftOrder.name,
    invoiceUrl: finalInvoiceUrl,
    totalPrice: draftOrder.totalPrice,
  };
}
