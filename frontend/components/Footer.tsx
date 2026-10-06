import { PinIcon } from "./icons";
import { APP_VERSION, isSupportableVersion, releaseLabel } from "@/lib/version";

export function Footer() {
  const stable = isSupportableVersion(APP_VERSION);
  return (
    <footer className="border-t border-blush-100/60 bg-white/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-12 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blush-300 via-blush-400 to-lilac-400 text-white shadow-soft">
          <PinIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-lg tracking-tight text-neutral-800">
            Costa Rica <span className="text-lilac-500">Vibe</span>
          </p>
          <p className="mt-1 max-w-md text-sm text-neutral-500">
            Parques, playas, comercios y experiencias que dan carácter a las
            7 provincias de Costa Rica.
          </p>
        </div>
        <p className="text-xs text-neutral-400">
          San José · Alajuela · Cartago · Heredia · Guanacaste · Puntarenas · Limón
        </p>
        <span className="rounded-full border border-neutral-100 bg-cream px-3 py-1 text-xs font-medium text-neutral-500">
          {releaseLabel(APP_VERSION)}
          {stable ? "" : " · pendiente de actualizar"}
        </span>
      </div>
    </footer>
  );
}