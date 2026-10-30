import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

    switch (topic) {
      case "APP_UNINSTALLED":
        if (session) {
          await prisma.session.deleteMany({ where: { shop } });
        }
        break;
      case "CUSTOMERS_DATA_REQUEST":
      case "CUSTOMERS_REDACT":
      case "SHOP_REDACT":
        // Mandatory Shopify GDPR compliance endpoints - return 200 OK
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      default:
        console.log(`Received webhook topic: ${topic} for shop: ${shop}`);
        break;
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Webhook verification/processing error:", error);
    return new Response(null, { status: 401 });
  }
};
