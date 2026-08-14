import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: "#0E6B4F", color: "#F6F5F1", fontSize: 30, fontWeight: 800 }}>FZ</div>,
    size,
  );
}
