import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The Moyours crest — the club's round badge (striped shield, ball, laurel
 * wreath). Served from /crest.png with a transparent circular edge so it
 * sits cleanly on both pitch-green and chalk surfaces.
 */
export function MoyoursCrest({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/crest.png"
      alt="Moyours Football Club Academy crest"
      width={size}
      height={size}
      priority={size >= 64}
      className={cn("shrink-0 rounded-full", className)}
    />
  );
}
