"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Photo = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  caption: string | null;
};

function sized(url: string, width: number) {
  return url.includes("res.cloudinary.com")
    ? url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`)
    : url;
}

export function Lightbox({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) => {
      setIndex((current) =>
        current === null ? null : (current + delta + photos.length) % photos.length,
      );
    },
    [photos.length],
  );

  useEffect(() => {
    if (index === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  return (
    <>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={photo.caption ?? `Open photo ${i + 1} of ${photos.length}`}
              className="block w-full overflow-hidden rounded-brand border border-line focus-visible:outline-2 focus-visible:outline-gold"
            >
              <Image
                src={sized(photo.url, 600)}
                alt={photo.caption ?? ""}
                width={photo.width ?? 600}
                height={photo.height ?? 400}
                className="aspect-[3/2] w-full object-cover transition-transform duration-200 hover:scale-[1.02] motion-reduce:hover:scale-100"
              />
            </button>
          </li>
        ))}
      </ul>

      {index !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${index + 1} of ${photos.length}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-kit/95 p-4"
          onClick={close}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-brand border border-chalk/30 text-chalk hover:border-chalk"
          >
            ✕
          </button>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-brand border border-chalk/30 text-chalk hover:border-chalk sm:left-4"
          >
            ←
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sized(photos[index].url, 1600)}
            alt={photos[index].caption ?? ""}
            className="max-h-[85vh] max-w-[85vw] rounded-brand object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-brand border border-chalk/30 text-chalk hover:border-chalk sm:right-4"
          >
            →
          </button>
          {photos[index].caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-brand bg-kit/80 px-4 py-2 text-step--1 text-chalk">
              {photos[index].caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
