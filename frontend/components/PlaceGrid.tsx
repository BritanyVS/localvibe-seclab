import type { Place } from "@/lib/types";
import { PlaceCard } from "./PlaceCard";

type PlaceGridProps = {
  places: Place[];
  loading: boolean;
  error: string | null;
  onSelect: (p: Place) => void;
};

const Skeleton = () => (
  <div className="animate-pulse rounded-3xl border border-white/70 bg-white shadow-soft">
    <div className="aspect-[4/3] rounded-t-3xl bg-neutral-100" />
    <div className="space-y-3 p-5">
      <div className="h-5 w-2/3 rounded-full bg-neutral-100" />
      <div className="h-3 w-1/3 rounded-full bg-neutral-100" />
      <div className="h-9 w-full rounded-2xl bg-neutral-100" />
    </div>
  </div>
);

export function PlaceGrid({ places, loading, error, onSelect }: PlaceGridProps) {
  return (
    <section id="directorio" className="relative mx-auto max-w-7xl px-6 py-14">
      <div className="mb-9 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-500">
            El directorio
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Lugares con carácter
          </h2>
        </div>
        {!loading && !error && (
          <span className="shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-neutral-500 shadow-sm">
            {places.length} {places.length === 1 ? "lugar" : "lugares"}
          </span>
        )}
      </div>

      {error ? (
        <div className="rounded-3xl border border-blush-100 bg-blush-50 p-10 text-center">
          <p className="font-semibold text-blush-500">{error}</p>
          <p className="mt-2 text-sm text-neutral-500">
            Verifica que la API esté corriendo en <code>http://localhost:4000</code>.
          </p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : places.length === 0 ? (
        <div className="rounded-3xl border border-neutral-100 bg-white p-12 text-center shadow-soft">
          <p className="font-display text-xl font-semibold text-neutral-700">
            Nada por aquí… todavía
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
            No encontramos lugares que calcen con esa búsqueda. Prueba con
            otro término o pregúntale al Conserje.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <div key={place.id} className="animate-fadeUp">
              <PlaceCard place={place} onSelect={onSelect} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}