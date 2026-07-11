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

  const iconSize = px - padding * 2;

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
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" />
          <path d="m2.5 21.5 1.4-1.4" />
          <path d="m20.1 3.9 1.4-1.4" />
          <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" />
          <path d="m9.6 14.4 4.8-4.8" />
        </svg>
      </div>
    ),
    { width: px, height: px }
  );
}
