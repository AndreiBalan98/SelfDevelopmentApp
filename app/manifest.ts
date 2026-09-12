import type { MetadataRoute } from "next";

// Next.js serves this at /manifest.webmanifest and adds the link tag for us.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Life Tracker",
    short_name: "Life",
    description: "Personal tracking for nutrition, weight, sleep and smoking.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1c1c1f",
    theme_color: "#1c1c1f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
