import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FechaZap",
    short_name: "FechaZap",
    description:
      "Orçamentos, contratos, PIX e agenda para prestadores de serviço.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F5F1",
    theme_color: "#0E6B4F",
    lang: "pt-BR",
  };
}
