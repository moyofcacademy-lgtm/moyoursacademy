"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  url: string;
  caption: string | null;
};

function sized(url: string) {
  return url.includes("res.cloudinary.com")
    ? url.replace("/upload/", "/upload/f_auto,q_auto,w_1000,h_1250,c_fill,g_auto/")
    : url;
}

/**
 * Homepage hero carousel — academy players on the matchday programme cover.
 * Crossfades with a slow drift, pauses on hover/focus, and sits still for
 * anyone who prefers reduced motion.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const step = useCallback(
    (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (slides.length < 2 || paused || reducedMotion.current) return;
    const timer = setInterval(() => step(1), 5000);
    return () => clearInterval(timer);
  }, [slides.length, paused, step]);

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Academy players"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="rule-gold group relative w-full overflow-hidden bg-pitch-deep"
    >
      <div className="relative aspect-[4/5] w-full">
        {slides.map((slide, i) => (
          <div
            key={slide.url}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 motion-reduce:duration-0",
              i === index ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={sized(slide.url)}
              alt={slide.caption ?? "Moyours academy player"}
              fill
              sizes="(min-width: 1024px) 420px, 100vw"
              priority={i === 0}
              className={cn(
                "object-cover",
                i === index && "motion-safe:animate-hero-drift",
              )}
            />
          </div>
        ))}
        {/* teamsheet caption strip */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-pitch-deep/95 via-pitch-deep/40 to-transparent p-4 pt-16">
          <p aria-live="polite" className="font-mono text-[0.6875rem] uppercase tracking-widest text-chalk">
            {slides[index].caption ?? "Moyours Football Club Academy"}
          </p>
          {slides.length > 1 && (
            <p className="font-mono text-[0.6875rem] text-chalk-dim">
              {String(index + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}
            </p>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => step(-1)}
            className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-brand border border-chalk/25 bg-pitch-deep/50 text-chalk opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => step(1)}
            className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-brand border border-chalk/25 bg-pitch-deep/50 text-chalk opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          >
            →
          </button>
          <div className="absolute inset-x-0 top-2 flex justify-center gap-1.5" role="tablist" aria-label="Choose photo">
            {slides.map((slide, i) => (
              <button
                key={slide.url}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === index ? "w-7 bg-gold" : "w-3.5 bg-chalk/40 hover:bg-chalk/70",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
