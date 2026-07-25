import Link from "next/link";
import { Crest } from "@/components/crest";
import { MoyoursCrest } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { cn, formatKickoffWAT } from "@/lib/utils";

export type FixtureStripData = {
  id: string;
  competition: string;
  ageGroup: string;
  isHome: boolean;
  kickoffAt: Date;
  venue: string;
  status: string;
  team: { name: string };
  opponent: { name: string; shortName: string | null; logoUrl: string | null };
  result?: { goalsFor: number; goalsAgainst: number } | null;
};

/** Match outcome from Moyours' perspective — WIN green, DRAW deep yellow, LOSS red. */
export function OutcomeBadge({
  goalsFor,
  goalsAgainst,
  compact = false,
}: {
  goalsFor: number;
  goalsAgainst: number;
  compact?: boolean;
}) {
  const outcome =
    goalsFor > goalsAgainst
      ? { label: "Win", classes: "bg-green-600 text-white" }
      : goalsFor === goalsAgainst
        ? { label: "Draw", classes: "bg-amber-500 text-kit" }
        : { label: "Loss", classes: "bg-red-600 text-white" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-brand font-mono font-bold uppercase tracking-widest",
        compact ? "px-1.5 py-0.5 text-[0.625rem]" : "px-2 py-0.5 text-[0.6875rem]",
        outcome.classes,
      )}
    >
      {outcome.label}
    </span>
  );
}

/**
 * The fixture board — a matchday teamsheet strip. Home crest, mono kickoff
 * time (or score), away crest, competition eyebrow, one gold rule. Reused on
 * the homepage, fixtures, results, and (compact) the admin dashboard.
 */
export function FixtureStrip({
  fixture,
  compact = false,
  href,
  className,
}: {
  fixture: FixtureStripData;
  compact?: boolean;
  href?: string;
  className?: string;
}) {
  const moyours = { name: fixture.team.name };
  const left = fixture.isHome ? moyours : fixture.opponent;
  const right = fixture.isHome ? fixture.opponent : moyours;
  const hasScore = fixture.result != null && fixture.status === "COMPLETED";
  const leftScore = fixture.isHome ? fixture.result?.goalsFor : fixture.result?.goalsAgainst;
  const rightScore = fixture.isHome ? fixture.result?.goalsAgainst : fixture.result?.goalsFor;

  const crestSize = compact ? 32 : 48;

  const body = (
    <article
      className={cn(
        "rule-gold surface-pitch text-chalk",
        compact ? "px-4 py-3" : "px-5 py-5 sm:px-8",
        href &&
          "transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-xl motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={cn(
            "font-mono uppercase tracking-widest text-chalk-dim",
            compact ? "text-[0.625rem]" : "text-[0.6875rem]",
          )}
        >
          {fixture.competition} · {fixture.ageGroup}
        </p>
        {fixture.status === "LIVE" && <Badge tone="gold">Live</Badge>}
        {hasScore && (
          <OutcomeBadge
            goalsFor={fixture.result!.goalsFor}
            goalsAgainst={fixture.result!.goalsAgainst}
            compact={compact}
          />
        )}
        {(fixture.status === "POSTPONED" || fixture.status === "CANCELLED") && (
          <Badge tone="outline" className="text-chalk-dim">
            {fixture.status === "POSTPONED" ? "Postponed" : "Cancelled"}
          </Badge>
        )}
      </div>

      <div
        className={cn(
          "grid grid-cols-[1fr_auto_1fr] items-center gap-3",
          compact ? "mt-2" : "mt-4 sm:gap-6",
        )}
      >
        <TeamSide name={left.name} club={left === moyours ? null : fixture.opponent} crestSize={crestSize} align="left" compact={compact} />

        <div className="text-center">
          {hasScore ? (
            <p className={cn("font-mono font-bold text-gold", compact ? "text-step-1" : "text-step-3")}>
              {leftScore}
              <span className="mx-1 text-chalk-dim">–</span>
              {rightScore}
            </p>
          ) : (
            <p className={cn("font-mono text-chalk", compact ? "text-step--1" : "text-step-0 sm:text-step-1")}>
              {formatKickoffWAT(fixture.kickoffAt)}
            </p>
          )}
          {!compact && (
            <p className="mt-1 text-[0.6875rem] uppercase tracking-widest text-chalk-dim">
              {hasScore ? "Full time" : fixture.venue}
            </p>
          )}
        </div>

        <TeamSide name={right.name} club={right === moyours ? null : fixture.opponent} crestSize={crestSize} align="right" compact={compact} />
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-2 focus-visible:outline-gold">
        {body}
      </Link>
    );
  }
  return body;
}

function TeamSide({
  name,
  club,
  crestSize,
  align,
  compact,
}: {
  name: string;
  club: { name: string; shortName: string | null; logoUrl: string | null } | null;
  crestSize: number;
  align: "left" | "right";
  compact: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 min-w-0",
        align === "right" && "flex-row-reverse",
      )}
    >
      {club ? (
        <Crest name={club.name} shortName={club.shortName} logoUrl={club.logoUrl} size={crestSize} />
      ) : (
        <MoyoursCrest size={crestSize} />
      )}
      <p
        className={cn(
          "font-display truncate",
          compact ? "text-step--1" : "text-step-0 sm:text-step-1",
          align === "right" && "text-right",
        )}
      >
        {name}
      </p>
    </div>
  );
}
