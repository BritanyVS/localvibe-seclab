import { PinIcon } from "./icons";

export function Footer() {
  return (
    <footer id="experiencias" className="border-t border-neutral-100 bg-white/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-12 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blush-300 via-blush-400 to-lilac-400 text-white shadow-soft">
          <PinIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-lg tracking-tight text-neutral-800">
            Local<span className="text-lilac-500">Vibe</span> Explorer
          </p>
          <p className="mt-1 max-w-md text-sm text-neutral-500">
            Conecta con los emprendimientos, tiendas y experiencias que dan
            carácter a tu barrio.
          </p>
        </div>
        <p className="text-xs text-neutral-400">
          Guápiles · Pocora · Cariari — Costa Rica
        </p>
      </div>
    </footer>
  );
}