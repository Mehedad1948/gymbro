import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE_EN } from "./site";

export const alt = `${SITE_NAME} — local-first gym PWA`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Latin-only text on purpose: the OG renderer (satori) does not shape Arabic script.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #0b0f14 0%, #111a24 60%, #0b0f14 100%)",
          color: "#e6edf3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* Dumbbell mark */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 26, height: 70, borderRadius: 8, background: "#7dd3fc" }} />
            <div style={{ width: 26, height: 100, borderRadius: 8, background: "#38bdf8", marginLeft: 6 }} />
            <div style={{ width: 90, height: 24, background: "#38bdf8", marginLeft: 4, marginRight: 4 }} />
            <div style={{ width: 26, height: 100, borderRadius: 8, background: "#38bdf8", marginRight: 6 }} />
            <div style={{ width: 26, height: 70, borderRadius: 8, background: "#7dd3fc" }} />
          </div>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 40, lineHeight: 1.3, color: "#c9d4df", maxWidth: 960 }}>{SITE_TAGLINE_EN}</div>
          <div style={{ display: "flex", gap: 14 }}>
            {["Offline PWA", "Set logging", "1,300+ movement guides"].map((t) => (
              <div
                key={t}
                style={{
                  fontSize: 26,
                  padding: "10px 22px",
                  borderRadius: 999,
                  border: "2px solid #334155",
                  color: "#9fb3c8",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
