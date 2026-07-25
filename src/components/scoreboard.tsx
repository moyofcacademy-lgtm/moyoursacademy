import { Crest } from "@/components/crest";
import { OutcomeBadge } from "@/components/fixture-strip";
import { MoyoursCrest } from "@/components/logo";
import { cn } from "@/lib/utils";

/**
 * Stadium scoreboard — split-flap digits on a floodlit black panel.
 * The theatrical version of the fixture strip, used on result pages.
 */
export function Scoreboard({
  competition,
  ageGroup,
  teamName,
  opponent,
  isHome,
  goalsFor,
  goalsAgainst,
  halfTimeFor,
  halfTimeAgainst,
  className,
}: {
  competition: string;
  ageGroup: string;
  teamName: string;
  opponent: { name: string; shortName: string | null; logoUrl: string | null };
  isHome: boolean;
  goalsFor: number;
  goalsAgainst: number;
  halfTimeFor?: number | null;
  halfTimeAgainst?: number | null;
  className?: string;
}) {
  const leftScore = isHome ? goalsFor : goalsAgainst;
  const rightScore = isHome ? goalsAgainst : goalsFor;
  const htLeft = isHome ? halfTimeFor : halfTimeAgainst;
  const htRight = isHome ? halfTimeAgainst : halfTimeFor;

  return (
    <section
      aria-label={`Final score: ${teamName} ${goalsFor}, ${opponent.name} ${goalsAgainst}`}
      className={cn(
        "rule-gold goal-net relative overflow-hidden rounded-b-brand bg-kit px-5 py-7 text-chalk sm:px-8",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
          {competition} · {ageGroup}
        </p>
        <span className="flex items-center gap-2">
          <OutcomeBadge goalsFor={goalsFor} goalsAgainst={goalsAgainst} />
          <p className="rounded-brand bg-gold px-2 py-0.5 font-mono text-[0.6875rem] font-bold uppercase tracking-widest text-kit">
            Full time
          </p>
        </span>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <Side
          name={isHome ? teamName : opponent.name}
          club={isHome ? null : opponent}
          align="left"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FlipScore value={leftScore} />
            <span aria-hidden className="font-mono text-step-1 text-chalk-dim">
              –
            </span>
            <FlipScore value={rightScore} />
          </div>
          {htLeft != null && htRight != null && (
            <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
              Half time {htLeft}–{htRight}
            </p>
          )}
        </div>

        <Side
          name={isHome ? opponent.name : teamName}
          club={isHome ? opponent : null}
          align="right"
        />
      </div>
    </section>
  );
}

function FlipScore({ value }: { value: number }) {
  return (
    <span className="flex gap-1" aria-hidden>
      {String(value).split("").map((digit, i) => (
        <span
          key={i}
          className="flip-digit tabular h-16 w-12 font-mono text-step-3 font-bold text-gold sm:h-20 sm:w-14"
        >
          {digit}
        </span>
      ))}
    </span>
  );
}

function Side({
  name,
  club,
  align,
}: {
  name: string;
  club: { name: string; shortName: string | null; logoUrl: string | null } | null;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:gap-3",
        align === "right" && "sm:flex-row-reverse",
      )}
    >
      {club ? (
        <Crest name={club.name} shortName={club.shortName} logoUrl={club.logoUrl} size={44} />
      ) : (
        <MoyoursCrest size={44} />
      )}
      <p
        className={cn(
          "w-full truncate text-center font-display text-step-0 sm:text-step-1",
          align === "left" ? "sm:text-left" : "sm:text-right",
        )}
      >
        {name}
      </p>
    </div>
  );
}
