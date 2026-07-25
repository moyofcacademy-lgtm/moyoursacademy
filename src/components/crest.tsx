import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Club crest. Cloudinary crests are served padded to a square so mismatched
 * logo dimensions never break the fixture strip; clubs without an uploaded
 * crest fall back to a monogram roundel.
 */
export function Crest({
  name,
  shortName,
  logoUrl,
  size = 48,
  className,
}: {
  name: string;
  shortName?: string | null;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (logoUrl) {
    const padded = logoUrl.replace(
      "/upload/",
      `/upload/c_pad,b_transparent,w_${size * 2},h_${size * 2},f_auto,q_auto/`,
    );
    return (
      <Image
        src={padded}
        alt={`${name} crest`}
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", className)}
      />
    );
  }
  const initials = (shortName ?? name)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.3 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-line/40 bg-pitch-mid font-mono font-bold text-chalk",
        className,
      )}
    >
      {initials}
    </span>
  );
}
