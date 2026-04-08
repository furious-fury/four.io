import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const runtime = "edge";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const subtitle = "Connect 4 vs CPU · Hall of Fame";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0a0a0a 0%, #14532d 42%, #0f172a 100%)",
          color: "#f4f4f5",
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            fontFamily:
              "ui-rounded, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 30,
            opacity: 0.88,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    { ...size }
  );
}
