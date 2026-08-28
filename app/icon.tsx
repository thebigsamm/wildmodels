import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const antonData = await readFile(
    join(process.cwd(), "assets/fonts/Anton-Regular.ttf")
  );

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
            fontSize: 26,
            fontFamily: "Anton",
            transform: "scaleX(1.4)",
            transformOrigin: "center",
            backgroundImage: "linear-gradient(135deg, #ff115a, #c400ff)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          W
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Anton", data: antonData, style: "normal", weight: 400 }],
    }
  );
}
