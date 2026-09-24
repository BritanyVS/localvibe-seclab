import type { Place } from "@/lib/types";
import { SparklesIcon } from "./icons";

type ExperiencesProps = {
  places: Place[];
  onSelect: (place: Place) => void;
};

export function Experiences({ places, onSelect }: ExperiencesProps) {
  const picks = places.filter((place) => place.featured).slice(0, 3);
  const shown = picks.length > 0 ? picks : places.slice(0, 3);

  return (
    <section
      id="experiencias"
      className="scroll-mt-20 border-y border-white/60 bg-gradient-to-b from-blush-50 via-white to-lilac-50"
    >
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-500">
              <SparklesIcon className="h-4 w-4" />
              Experiencias
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Planes que se sienten
            </h2>
          </div>
          <p className="max-w-md text-sm text-neutral-500">
            Lugares que nuestra comunidad destaca por su ambiente y carácter.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((place) => (
            <article
              key={place.id}
              className="card-hover flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-soft"
            >
              <div
                className="h-44 w-full bg-neutral-200"
                style={
                  place.image
                    ? {
                        backgroundImage: `url(${place.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              />
              <div className="flex flex-1 flex-col p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-lilac-500">
                  {place.categoryLabel}
                </p>
                <h3 className="mt-2 font-display text-xl text-neutral-800">{place.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">{place.vibe}</p>
                <p className="mt-3 text-xs font-medium text-neutral-400">
                  {place.location} · {place.hours}
                </p>
                <button
                  type="button"
                  onClick={() => onSelect(place)}
                  className="mt-5 w-fit rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-lilac-600"
                >
                  Ver este plan
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}