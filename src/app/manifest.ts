import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Puzzimori · Little puzzles. Big discoveries.",
    short_name: "Puzzimori",
    description:
      "Follow the clues and discover the secret number behind every emoji. A playful math adventure in English and Hebrew.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fbf8f0",
    theme_color: "#fbf8f0",
    categories: ["education", "games", "kids"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
