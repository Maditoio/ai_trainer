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
        }}
      >
        <svg
          width="248"
          height="248"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5a3 3 0 0 0-5.997-.125A3.5 3.5 0 0 0 3.5 11a3.5 3.5 0 0 0 2.503 6.125A3 3 0 0 0 12 17m0-12a3 3 0 0 1 5.997-.125A3.5 3.5 0 0 1 20.5 11a3.5 3.5 0 0 1-2.503 6.125A3 3 0 0 1 12 17m0-12v12m-4.5-5H12m4.5 0H12m-3 4.5A2.5 2.5 0 0 1 6.5 14m8.5 2.5a2.5 2.5 0 0 0 2.5-2.5M9 7.5A2.5 2.5 0 0 0 6.5 10m8.5-2.5A2.5 2.5 0 0 1 17.5 10"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
