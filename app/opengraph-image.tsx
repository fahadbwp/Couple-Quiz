import { ImageResponse } from "next/og";
export const alt = "PlayNudge — Jelloo and Friendship Quiz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 85,
          background: "#f0eafb",
          color: "#25233c",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 35, color: "#6950c9", marginBottom: 35 }}>
          PlayNudge.
        </div>
        <div style={{ fontSize: 76, fontWeight: 800 }}>
          A little play goes a long way.
        </div>
        <div style={{ fontSize: 30, marginTop: 40 }}>
          Jelloo · Friendship Quiz · Free browser games
        </div>
      </div>
    ),
    size,
  );
}
