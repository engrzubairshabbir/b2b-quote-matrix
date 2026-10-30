// Shopify Recurring App Subscription Billing Service
// Uses GraphQL Admin API: appSubscriptionCreate

export const BILLING_PLANS = {
  STARTER: {
    name: "Starter Plan",
    price: 29.0,
    interval: "EVERY_30_DAYS",
    trialDays: 7,
    features: [
      "Up to 25 Bulk Quote requests / mo",
      "Dynamic Tiered Pricing Table Widget",
      "Standard Email Delivery & Notifications",
      "Standard CSV Export",
      "Community & Email Support",
    ],
    recommended: false,
  },
  PRO_SCALE: {
    name: "Pro Scale",
    price: 79.0,
    interval: "EVERY_30_DAYS",
    trialDays: 7,
    features: [
      "Unlimited High-Ticket B2B Quote Requests",
      "Automated 1-Click Shopify Draft Order Invoicing",
      "Real-time Glassmorphic Modal Calculator",
      "Custom Neon & Brand Styling Matrix",
      "Automatic Multi-tier Discount Application",
      "Priority 24/7 B2B Sales Desk Support",
    ],
    recommended: true,
  },
};

export const CREATE_SUBSCRIPTION_MUTATION = `#graphql
  mutation AppSubscriptionCreate(
    $name: String!
    $returnUrl: URL!
    $lineItems: [AppSubscriptionLineItemInput!]!
    $trialDays: Int
    $test: Boolean
  ) {
    appSubscriptionCreate(
      name: $name
      returnUrl: $returnUrl
      lineItems: $lineItems
      trialDays: $trialDays
      test: $test
    ) {
      userErrors {
        field
        message
      }
      confirmationUrl
      appSubscription {
        id
        name
        status
        test
      }
    }
  }
`;

export const GET_ACTIVE_SUBSCRIPTION_QUERY = `#graphql
  query GetActiveSubscriptions {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
        test
        currentPeriodEnd
        lineItems {
          id
          plan {
            pricingDetails {
              ... on AppRecurringPricing {
                price {
                  amount
                  currencyCode
                }
                interval
              }
            }
          }
        }
      }
    }
  }
`;

export const CANCEL_SUBSCRIPTION_MUTATION = `#graphql
  mutation AppSubscriptionCancel($id: ID!, $prorate: Boolean) {
    appSubscriptionCancel(id: $id, prorate: $prorate) {
      userErrors {
        field
        message
      }
      appSubscription {
        id
        status
      }
    }
  }
`;

/**
 * Creates a recurring app subscription via GraphQL
 */
export async function createSubscription({
  admin,
  returnUrl,
  planKey = "PRO_SCALE",
  test = true,
}) {
  const plan = BILLING_PLANS[planKey] || BILLING_PLANS.PRO_SCALE;

  const variables = {
    name: plan.name,
    returnUrl,
    trialDays: plan.trialDays,
    test,
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: plan.price,
              currencyCode: "USD",
            },
            interval: plan.interval,
          },
        },
      },
    ],
  };

  const response = await admin.graphql(CREATE_SUBSCRIPTION_MUTATION, {
    variables,
  });

  const responseJson = await response.json();
  const data = responseJson.data?.appSubscriptionCreate;

  if (data?.userErrors && data.userErrors.length > 0) {
    throw new Error(
      `Shopify Subscription Error: ${data.userErrors.map((e) => e.message).join(", ")}`
    );
  }

  return {
    confirmationUrl: data?.confirmationUrl,
    subscription: data?.appSubscription,
  };
}

/**
 * Retrieves the currently active subscription for this shop
 */
export async function getActiveSubscription({ admin }) {
  try {
    const response = await admin.graphql(GET_ACTIVE_SUBSCRIPTION_QUERY);
    const responseJson = await response.json();
    const subs =
      responseJson.data?.currentAppInstallation?.activeSubscriptions || [];
    return subs.length > 0 ? subs[0] : null;
  } catch (error) {
    console.error("Error fetching active subscriptions:", error);
    return null;
  }
}
