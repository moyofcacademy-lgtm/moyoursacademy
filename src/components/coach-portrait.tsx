import Image from "next/image";
import { cn } from "@/lib/utils";

/** Coach headshot with an initials roundel fallback. */
export function CoachPortrait({
  name,
  photoUrl,
  size = 64,
  className,
}: {
  name: string;
  photoUrl: string | null;
  size?: number;
  className?: string;
}) {
  if (photoUrl) {
    const src = photoUrl.includes("res.cloudinary.com")
      ? photoUrl.replace("/upload/", `/upload/f_auto,q_auto,w_${size * 2},h_${size * 2},c_fill,g_face/`)
      : photoUrl;
    return (
      <Image
        src={src}
        alt={`${name} portrait`}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full border-2 border-gold object-cover", className)}
      />
    );
  }
  const initials = name
    .replace(/^Coach\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-gold bg-pitch font-mono font-bold text-chalk",
        className,
      )}
    >
      {initials}
    </span>
  );
}
