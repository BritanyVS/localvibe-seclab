import { CompassIcon, PinIcon } from "./icons";

type HeaderProps = {
  onOpenConserje?: () => void;
};

export function Header({ onOpenConserje }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-cream/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5" aria-label="LocalVibe Explorer inicio">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blush-300 via-blush-400 to-lilac-400 text-white shadow-soft">
            <PinIcon className="h-5 w-5" />
          </span>
          <span className="font-display text-lg tracking-tight text-neutral-800">
            Local<span className="text-lilac-500">Vibe</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 text-sm font-medium text-neutral-600 md:flex">
          <a href="/" className="hover:text-lilac-600">
            Inicio
          </a>
          <a href="/#directorio" className="hover:text-lilac-600">
            Directorio
          </a>
          {onOpenConserje ? (
            <button
              type="button"
              onClick={onOpenConserje}
              className="hover:text-lilac-600 transition-colors"
            >
              Conserje Vibe
            </button>
          ) : null}
          <a href="/#experiencias" className="hover:text-lilac-600">
            Experiencias
          </a>
          <a href="/admin" className="hover:text-lilac-600">
            Admin
          </a>
        </div>

        <a
          href="/#directorio"
          className="group flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lilac-600"
        >
          <CompassIcon className="h-4 w-4 text-gold-300 transition-transform group-hover:rotate-45" />
          Explorar
        </a>
      </nav>
    </header>
  );
}