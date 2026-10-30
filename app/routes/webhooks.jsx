import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    const { topic, shop, session, admin } = await authenticate.webhook(request);

    if (!admin) {
      return new Response(null, { status: 400 });
    }

    switch (topic) {
      case "APP_UNINSTALLED":
        if (session) {
          await prisma.session.deleteMany({ where: { shop } });
        }
        break;
      case "CUSTOMERS_DATA_REQUEST":
      case "CUSTOMERS_REDACT":
      case "SHOP_REDACT":
        // Standard Shopify GDPR compliance endpoints
        return new Response(null, { status: 200 });
      default:
        console.log(`Received webhook topic: ${topic} for shop: ${shop}`);
        break;
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(null, { status: 500 });
  }
};
