import { ImageResponse } from "next/og";

export const alt = "Moyours Sports Academy — youth football in Abuja";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#0B3D2C",
          padding: 72,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: "#E8B319",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 9999,
              background: "#E8B319",
              border: "6px solid #14140F",
              display: "flex",
              overflow: "hidden",
            }}
          >
            <div style={{ width: 18, height: "100%", background: "#14140F", marginLeft: 16 }} />
            <div style={{ width: 18, height: "100%", background: "#14140F", marginLeft: 14 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: "#F3F1E7", letterSpacing: -1 }}>
              Moyours Sports Academy
            </div>
            <div style={{ fontSize: 30, color: "#C9C4AE" }}>
              Youth football · Abuja · Ages 4–18
            </div>
          </div>
        </div>
        <div style={{ fontSize: 34, color: "#E8B319", fontWeight: 600 }}>
          More than an academy — a family.
        </div>
      </div>
    ),
    { ...size },
  );
}
