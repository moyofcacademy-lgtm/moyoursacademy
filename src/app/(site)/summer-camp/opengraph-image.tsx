import { ImageResponse } from "next/og";

export const alt = "Moyours Football Summer Camp — 27 July to 28 August, ages 2–17, Wuse Zone 2 Abuja";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function CampOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B3D2C",
          padding: 64,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, background: "#E8B319" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, color: "#E8B319", fontWeight: 700, letterSpacing: 4, display: "flex" }}>
            MOYOURS SPORTS ACADEMY PRESENTS
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, color: "#F3F1E7", letterSpacing: -2, lineHeight: 1.02, display: "flex", flexDirection: "column" }}>
            <span>FOOTBALL</span>
            <span style={{ color: "#E8B319" }}>SUMMER CAMP</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 40, alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 32, color: "#F3F1E7", fontWeight: 600 }}>
              27 July – 28 August · Ages 2–17
            </div>
            <div style={{ fontSize: 26, color: "#C9C4AE" }}>
              DMAK Indaptil, Wuse Zone 2, Abuja
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#E8B319",
              borderRadius: 8,
              padding: "18px 32px",
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 800, color: "#14140F" }}>#120,000</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "#14140F" }}>5 WEEKS · REGISTER NOW</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
