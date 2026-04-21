import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Les Orchidées 2 — Gestion",
    short_name: "Orchidées 2",
    description: "Application de gestion de la résidence Les Orchidées 2",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#166534",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
      { src: "/icon-192.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
    screenshots: [],
    categories: ["business", "productivity"],
  };
}
