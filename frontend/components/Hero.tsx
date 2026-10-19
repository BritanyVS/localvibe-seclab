import { provinces } from "@/lib/categories";
import type { Category } from "@/lib/types";
import { SearchIcon, SparklesIcon } from "./icons";
import { ProvinceMap } from "./ProvinceMap";

type HeroProps = {
  query: string;
  onSearch: (q: string) => void;
  category: string;
  onCategory: (c: string) => void;
  province: string;
  onProvince: (p: string) => void;
  categoryList: Category[];
  resultCount: number;
  loading: boolean;
};

export function Hero({
  query,
  onSearch,
  category,
  onCategory,
  province,
  onProvince,
  categoryList,
  resultCount,
  loading,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-blush-200/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-40 h-96 w-96 rounded-full bg-lilac-200/30 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-20 text-center">
        <p className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-blush-100 bg-blush-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blush-500">
          <SparklesIcon className="h-3.5 w-3.5" />
          Tu guía de las 7 provincias
        </p>

        <h1 className="mx-auto max-w-3xl font-display text-5xl leading-tight tracking-tight text-neutral-900 sm:text-6xl">
          Descubre la <em className="italic text-lilac-500">vibra</em> de
          <span className="text-blush-400"> Costa Rica</span>, provincia por provincia
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-500">
          Parques nacionales, playas, cafés, comercios y experiencias en todo el país.
          Explóralos o pregúntale a <span className="font-semibold text-lilac-500">Vibe</span>{" "}
          qué calza con tu plan de hoy.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const input = event.currentTarget.query as HTMLInputElement;
            onSearch(input.value);
          }}
          className="mx-auto mt-9 flex max-w-2xl items-center gap-2 rounded-full border border-blush-100 bg-white/90 p-2 shadow-soft backdrop-blur transition-shadow focus-within:shadow-gold"
        >
          <span className="pl-3 text-blush-300">
            <SearchIcon className="h-5 w-5" />
          </span>
          <input
            key={query}
            name="query"
            defaultValue={query}
            type="text"
            placeholder="Busca playas, cafés, parques, tiendas…"
            className="h-11 w-full min-w-0 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          <span aria-hidden className="hidden h-6 w-px bg-blush-100 sm:block" />
          <select
            aria-label="Filtrar por provincia"
            value={province}
            onChange={(event) => onProvince(event.target.value)}
            className="h-11 shrink-0 rounded-full bg-transparent pr-2 text-sm text-neutral-600 outline-none"
          >
            <option value="">Todas las provincias</option>
            {provinces.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-gradient-to-r from-blush-400 to-lilac-500 px-6 text-sm font-semibold text-white shadow-md shadow-blush-200/50 transition-transform hover:scale-[1.03] active:scale-95"
          >
            Buscar
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {categoryList.map((chip) => (
            <button
              key={chip.id}
              onClick={() => onCategory(chip.id)}
              className={category === chip.id ? "chip chip-active" : "chip chip-idle"}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <section className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-[2rem] border border-blush-100 bg-white/80 p-6 text-left shadow-soft backdrop-blur sm:p-9">
          <div className="grid items-center gap-7 sm:grid-cols-[1fr_1.1fr] sm:gap-10">
            <ProvinceMap province={province} onProvince={onProvince} />
            <div className="text-center sm:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-blush-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blush-500">
                <span className="h-2 w-2 rounded-full bg-blush-400" />
                Explora el mapa
              </span>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Costa Rica, <span className="text-blush-400">a tu manera</span>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-500 sm:mx-0 sm:text-base">
                Elige una provincia en el mapa y descubre los comercios y experiencias que tiene
                para ti.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span className="rounded-full border border-blush-100 bg-blush-50 px-4 py-2 text-sm font-semibold text-blush-600">
                  {province || "Todas las provincias"}
                </span>
                {province && (
                  <button
                    type="button"
                    onClick={() => onProvince("")}
                    className="text-sm font-semibold text-neutral-500 underline decoration-blush-300 underline-offset-4 transition-colors hover:text-blush-500"
                  >
                    Ver todas
                  </button>
                )}
              </div>
              <p aria-live="polite" className="mt-4 text-sm text-neutral-500">
                {loading
                  ? "Buscando lugares…"
                  : `${resultCount} ${resultCount === 1 ? "lugar encontrado" : "lugares encontrados"}${province ? ` en ${province}` : ""}`}
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
