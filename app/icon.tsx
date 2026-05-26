import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

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
          background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
          color: "white",
          fontSize: 148,
          fontWeight: 800,
          letterSpacing: "-0.08em",
        }}
      >
        MM
      </div>
    ),
    {
      ...size,
    },
  );
}
