import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** App / WhatsApp icon fallback when crawlers request /icon. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0f11",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 360,
            height: 360,
            borderRadius: 72,
            backgroundColor: "#d20a11",
            color: "#ffffff",
            fontSize: 160,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
        >
          AI
        </div>
      </div>
    ),
    { ...size },
  );
}
