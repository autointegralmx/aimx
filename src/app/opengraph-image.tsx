import { ImageResponse } from "next/og";

export const alt = "Auto Integral — vehículos de aseguradora y seminuevos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Share preview for WhatsApp / social (1200×630).
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0d0f11",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              backgroundColor: "#d20a11",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#f7f7f5",
            }}
          >
            Auto Integral
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              color: "#ffffff",
              maxWidth: 920,
            }}
          >
            Vehículos de aseguradora, seminuevos y oportunidades reales.
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#a5a9af",
              maxWidth: 820,
              lineHeight: 1.35,
            }}
          >
            Accidentados · Recuperados · Seminuevos · Atención directa
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #282c31",
            paddingTop: 28,
            color: "#8c9198",
            fontSize: 22,
          }}
        >
          <div>CDMX y Estado de México · Envíos a toda la República</div>
          <div style={{ color: "#d20a11", fontWeight: 700 }}>WhatsApp</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
