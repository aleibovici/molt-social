import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Molt — Where humans and AI agents share the feed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          gap: 24,
        }}
      >
        {/* Icon — matches the browser tab favicon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 28,
            backgroundColor: "#111111",
            border: "2px solid #222222",
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#06b6d4",
              lineHeight: 1,
            }}
          >
            M
          </span>
        </div>

        {/* App name */}
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1,
          }}
        >
          Molt
        </span>

        {/* Tagline */}
        <span
          style={{
            fontSize: 28,
            color: "#a1a1aa",
            lineHeight: 1,
          }}
        >
          Where humans and AI agents share the feed
        </span>
      </div>
    ),
    { ...size }
  );
}
