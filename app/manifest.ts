import type { MetadataRoute } from "next";

/**
 * Bump this whenever the generated icon's visual content changes. The icon route responds
 * with a 1-year immutable Cache-Control header (appropriate for genuinely static assets, and
 * required for Android's WebAPK-minting service to accept it at all) — the only way to bust
 * that cache, including on infrastructure we don't control like Google's WebAPK minting
 * servers, is to change the URL itself via this query string.
 */
const ICON_VERSION = "2";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nithish Fit",
    short_name: "Nithish Fit",
    description: "Personal gym, workout progression, Indian food tracking and body-weight management.",
    start_url: "/today",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    orientation: "portrait",
    icons: [
      { src: `/icons/192?v=${ICON_VERSION}`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `/icons/512?v=${ICON_VERSION}`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `/icons/512-maskable?v=${ICON_VERSION}`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
