import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap",
  },
];

export const meta = () => [
  { charset: "utf-8" },
  { name: "viewport", content: "width=device-width,initial-scale=1" },
  { title: "ConsultWays B2B Quote & Tiered Matrix Pro" },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        <style>{`
          :root {
            --cw-neon-cyan: #00E5FF;
            --cw-neon-glow: rgba(0, 229, 255, 0.25);
            --cw-dark-bg: #0B0F19;
            --cw-card-border: rgba(255, 255, 255, 0.08);
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f6f6f7;
          }
          .cw-gradient-text {
            background: linear-gradient(135deg, #00E5FF 0%, #3B82F6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .cw-stat-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .cw-stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          }
        `}</style>
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
