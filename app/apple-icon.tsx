import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
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
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 118,
            fontWeight: 900,
            backgroundImage: "linear-gradient(135deg, #ff115a, #c400ff)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          W
        </div>
      </div>
    ),
    size
  );
}
