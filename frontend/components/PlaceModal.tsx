"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import type { Place } from "@/lib/types";
import { CloseIcon, PinIcon, StarIcon } from "./icons";

function wrapText(value: string, width: number): string {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

const categoryAccent: Record<string, string> = {
  cafe: "from-blush-400 to-lilac-500",
  coworking: "from-lilac-400 to-indigo-400",
  eco: "from-emerald-300 to-lime-400",
  artesanía: "from-amber-300 to-gold-400",
  gastronomía: "from-gold-400 to-blush-400",
  experiencias: "from-lilac-400 to-blush-400",
  bienestar: "from-sky-300 to-lilac-400",
};

export function PlaceModal({ place, onClose }: { place: Place; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const fallback =
    categoryAccent[place.category] ?? "from-lilac-400 to-blush-400";

  const wrappedDescription = useMemo(
    () => wrapText(place.description, 64),
    [place.description]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-800/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={place.name}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-2xl animate-fadeUp overflow-hidden rounded-3xl border border-blush-100 bg-white shadow-2xl shadow-blush-200/40"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image src={place.image} alt={place.name} fill sizes="(max-width: 900px) 100vw, 800px" className="object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-t ${fallback} opacity-20 mix-blend-multiply`} />
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-neutral-600 shadow-md backdrop-blur transition-colors hover:text-lilac-600"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-lilac-50 px-3 py-1 text-xs font-semibold text-lilac-600">
              {place.categoryLabel}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
              <StarIcon className="h-3.5 w-3.5 text-gold-400" />
              {place.rating.toFixed(1)}
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
              {place.price}
            </span>
          </div>

          <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-neutral-900">
            {place.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500">
            <PinIcon className="h-4 w-4 text-lilac-400" />
            {place.location} · {place.hours}
          </p>

          <span className="mt-4 inline-flex rounded-full border border-blush-100 bg-blush-50 px-3 py-1 text-sm font-medium text-blush-500">
            {place.vibe}
          </span>

          <p className="mt-4 whitespace-pre-line leading-relaxed text-neutral-600">
            {wrappedDescription}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-neutral-100 bg-cream px-3 py-1 text-xs font-medium text-neutral-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}