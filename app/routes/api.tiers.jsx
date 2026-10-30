import { json } from "@remix-run/node";
import prisma from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "quickstart-demo.myshopify.com";

  const tiers = await prisma.tieredDiscountRule.findMany({
    where: { shop },
    orderBy: { minQuantity: "asc" },
  });

  const config = await prisma.appConfig.findUnique({
    where: { shop },
  });

  return json(
    {
      success: true,
      shop,
      tiers,
      config: config || {
        enableTieredMatrix: true,
        primaryColor: "#00E5FF",
        buttonText: "Request B2B Bulk Quote",
        requireCompany: true,
        requireTaxId: false,
      },
    },
    { headers: corsHeaders }
  );
};
