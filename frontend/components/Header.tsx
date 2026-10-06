import { CompassIcon, PinIcon } from "./icons";

type HeaderProps = {
  onOpenVibe?: () => void;
};

export function Header({ onOpenVibe }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-blush-100/60 bg-cream/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5" aria-label="LocalVibe Explorer inicio">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blush-300 via-blush-400 to-lilac-400 text-white shadow-soft">
            <PinIcon className="h-5 w-5" />
          </span>
          <span className="font-display text-lg tracking-tight text-neutral-800">
            Local<span className="text-lilac-500">Vibe</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 text-sm font-medium text-neutral-500 md:flex">
          <a href="/" className="rounded-full px-4 py-2 transition-colors hover:bg-blush-50 hover:text-lilac-600">
            Inicio
          </a>
          <a
            href="/#directorio"
            className="rounded-full px-4 py-2 transition-colors hover:bg-blush-50 hover:text-lilac-600"
          >
            Directorio
          </a>
          {onOpenVibe ? (
            <button
              type="button"
              onClick={onOpenVibe}
              className="rounded-full px-4 py-2 transition-colors hover:bg-blush-50 hover:text-lilac-600"
            >
              Habla con Vibe
            </button>
          ) : null}
          <a
            href="/#experiencias"
            className="rounded-full px-4 py-2 transition-colors hover:bg-blush-50 hover:text-lilac-600"
          >
            Experiencias
          </a>
          <a href="/admin" className="rounded-full px-4 py-2 transition-colors hover:bg-blush-50 hover:text-lilac-600">
            Admin
          </a>
        </div>

        <a
          href="/#directorio"
          className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-blush-400 to-lilac-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blush-200/60 transition-transform hover:scale-[1.03] active:scale-95"
        >
          <CompassIcon className="h-4 w-4 transition-transform group-hover:rotate-45" />
          Explorar
        </a>
      </nav>
    </header>
  );
}
