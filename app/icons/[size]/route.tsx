import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const dynamic = "force-static";

function pxFor(sizeParam: string): number {
  if (sizeParam === "512-maskable") return 512;
  const parsed = Number(sizeParam);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 192;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = pxFor(size);
  const maskable = size === "512-maskable";
  const padding = maskable ? Math.round(px * 0.16) : Math.round(px * 0.08);

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16a34a",
          borderRadius: maskable ? 0 : Math.round(px * 0.2),
        }}
      >
        <div
          style={{
            width: px - padding * 2,
            height: px - padding * 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: Math.round(px * 0.42),
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          NF
        </div>
      </div>
    ),
    { width: px, height: px }
  );
}
