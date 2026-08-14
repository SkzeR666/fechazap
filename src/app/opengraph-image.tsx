import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "FechaZap — do fechamento ao serviço confirmado. Em um link.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(
    join(process.cwd(), "public/brand/wordmark-gold.png"),
  );
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#000000",
        color: "#FEFBEA",
        padding: "72px",
      }}
    >
      <img src={src} width={420} height={84} alt="FechaZap" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 58, fontWeight: 700 }}>
          Do orçamento ao serviço fechado.
        </div>
        <div style={{ display: "flex", fontSize: 58, fontWeight: 700 }}>
          Em um link.
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 28, color: "#EAB308" }}>
          Proposta · aceite · Pix · agenda
        </div>
      </div>
    </div>,
    size,
  );
}
