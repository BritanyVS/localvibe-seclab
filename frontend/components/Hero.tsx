import { categories } from "@/lib/categories";
import { SearchIcon, SparklesIcon } from "./icons";

type HeroProps = {
  query: string;
  onSearch: (q: string) => void;
  category: string;
  onCategory: (c: string) => void;
};

export function Hero({ query, onSearch, category, onCategory }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-blush-200/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-40 h-96 w-96 rounded-full bg-lilac-200/40 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-20 text-center">
        <p className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-gold-200 bg-gold-100/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-500">
          <SparklesIcon className="h-3.5 w-3.5" />
          El directorio de tu barrio
        </p>

        <h1 className="mx-auto max-w-3xl font-display text-5xl leading-tight tracking-tight text-neutral-900 sm:text-6xl">
          Descubre la <span className="text-lilac-500">vibra</span> de los
          <span className="text-blush-400"> comercios</span> que aman tu zona
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-500">
          Cafés, co-workings, tiendas ecológicas y experiencias únicas en Guápiles y la
          región. Explóralos o pregúntale al Conserje Vibe qué calza con tu plan de hoy.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const input = event.currentTarget.query as HTMLInputElement;
            onSearch(input.value);
          }}
          className="mx-auto mt-9 flex max-w-xl items-center gap-2 rounded-full border border-white/80 bg-white/90 p-2 shadow-soft backdrop-blur transition-shadow focus-within:shadow-gold"
        >
          <span className="pl-3 text-neutral-400">
            <SearchIcon className="h-5 w-5" />
          </span>
          <input
            key={query}
            name="query"
            defaultValue={query}
            type="text"
            placeholder="Busca cafés, coworking, ecológico…"
            className="h-11 w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-gradient-to-r from-blush-400 to-lilac-500 px-6 text-sm font-semibold text-white shadow-md shadow-blush-300/40 transition-transform hover:scale-[1.03] active:scale-95"
          >
            Buscar
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {categories.map((chip) => (
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