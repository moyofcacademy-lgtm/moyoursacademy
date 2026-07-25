import { cn } from "@/lib/utils";

/**
 * Line-drawn football — pentagon panel and stitching, drawn in currentColor
 * so it inherits gold on pitch surfaces and pitch-green on chalk.
 */
export function BallIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 7.6 16.2 10.7 14.6 15.6 9.4 15.6 7.8 10.7Z" fill="currentColor" fillOpacity="0.16" />
      <path d="M12 7.6V2.8M16.2 10.7l4.6-1.5M14.6 15.6l2.8 3.9M9.4 15.6l-2.8 3.9M7.8 10.7 3.2 9.2" />
    </svg>
  );
}

/**
 * Match-minute marker — sections of the homepage read like the phases of a
 * match: 15' programs, 45' the story, 90'+ the final whistle.
 */
export function Minute({ value, light }: { value: string; light?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "font-mono text-[0.6875rem] font-bold tracking-widest",
        light ? "text-gold" : "text-pitch",
      )}
    >
      {value}&rsquo;
    </span>
  );
}
