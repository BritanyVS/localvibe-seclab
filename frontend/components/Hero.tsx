import { provinces } from "@/lib/categories";
import type { Category } from "@/lib/types";
import { SearchIcon, SparklesIcon } from "./icons";

type HeroProps = {
  query: string;
  onSearch: (q: string) => void;
  category: string;
  onCategory: (c: string) => void;
  province: string;
  onProvince: (p: string) => void;
  categoryList: Category[];
};

export function Hero({ query, onSearch, category, onCategory, province, onProvince, categoryList }: HeroProps) {
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
      </div>
    </section>
  );
}
