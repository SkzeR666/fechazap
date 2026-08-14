import { ImageResponse } from "next/og";

export const alt = "FechaZap — feche serviços em um link só";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F6F5F1", color: "#17211D", padding: "72px" }}>
      <div style={{ display: "flex", color: "#0E6B4F", fontSize: 34 }}>FechaZap</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>Fecha o serviço.</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>Num link só.</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 30 }}>Orçamento · contrato · PIX · agenda</div>
      </div>
      <div style={{ display: "flex", color: "#C97A2B", fontSize: 24 }}>fechazap.vercel.app</div>
    </div>,
    size,
  );
}
