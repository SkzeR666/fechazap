import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FechaZap",
    short_name: "FechaZap",
    description:
      "Proposta, aceite, Pix e agenda para prestadores de serviço.",
    start_url: "/app",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#EAB308",
    lang: "pt-BR",
  };
}
