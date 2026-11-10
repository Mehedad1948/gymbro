import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE_EN } from "./site";

export const alt = `${SITE_NAME} — local-first gym PWA`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read once at module scope so the route still prerenders (no request-time IO).
const logoSrc = `data:image/svg+xml;base64,${await readFile(join(process.cwd(), "public/logo.svg"), "base64")}`;

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
          {/* eslint-disable-next-line @next/next/no-img-element -- satori renders plain <img> only */}
          <img src={logoSrc} width={150} height={150} alt="" />
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
