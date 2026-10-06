import Image from "next/image";
import type { Place } from "@/lib/types";
import { PinIcon, StarIcon } from "./icons";

export function PlaceCard({ place, onSelect }: { place: Place; onSelect: (p: Place) => void }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-blush-100/70 bg-white shadow-soft card-hover">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={place.image}
          alt={place.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/20 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-lilac-600 shadow-sm backdrop-blur">
          {place.categoryLabel}
        </span>
        <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-neutral-600 shadow-sm backdrop-blur">
          <StarIcon className="h-3.5 w-3.5 text-gold-400" />
          {place.rating.toFixed(1)}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold tracking-tight text-neutral-900">
            {place.name}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-blush-500">{place.price}</span>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
          <PinIcon className="h-4 w-4 text-lilac-400" />
          {place.location}
        </p>

        <span className="mt-3 inline-flex items-center rounded-full border border-blush-100 bg-blush-50 px-3 py-1 text-xs font-medium text-blush-500">
          {place.vibe}
        </span>

        <button
          onClick={() => onSelect(place)}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-blush-400 to-lilac-500 py-3 text-sm font-semibold text-white shadow-md shadow-blush-200/60 transition-all hover:shadow-lg hover:shadow-blush-300/60 active:scale-[0.98]"
        >
          Explorar
        </button>
      </div>
    </article>
  );
}
