import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
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
          background: "#060002",
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 900,
            fontFamily: "Arial, Helvetica, sans-serif",
            backgroundImage: "linear-gradient(135deg, #ff115a, #c400ff)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          W
        </div>
      </div>
    ),
    { ...size }
  );
}
