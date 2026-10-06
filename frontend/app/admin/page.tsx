"use client";

import { FormEvent, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { CloseIcon, CompassIcon, PinIcon, StarIcon } from "@/components/icons";
import { categories, provinces } from "@/lib/categories";
import {
  adminCreatePlace,
  adminDeletePlace,
  adminListPlaces,
  adminLogin,
  adminLogout,
  adminUpdatePlace,
} from "@/lib/api";
import type { Place, PlaceInput } from "@/lib/types";

type EditorState =
  | { mode: "create"; place: PlaceInput }
  | { mode: "edit"; id: string; place: PlaceInput }
  | null;

const adminSlot = "lv-admin-session";

const emptyPlace = (): PlaceInput => ({
  name: "",
  category: "cafe",
  categoryLabel: "Cafés",
  province: "San José",
  location: "",
  vibe: "",
  description: "",
  tags: [],
  price: "$",
  rating: 4,
  hours: "",
  image: "",
  featured: false,
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white/80 px-3.5 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition focus:border-lilac-400 focus:ring-2 focus:ring-lilac-200";

const labelClass = "block text-xs font-semibold uppercase tracking-wide text-neutral-500";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);
  const [tagsText, setTagsText] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(adminSlot);
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    if (!token) return;
    adminListPlaces(token)
      .then(setPlaces)
      .catch(() => {
        window.localStorage.removeItem(adminSlot);
        setToken(null);
      });
  }, [token]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await adminLogin(password);
      window.localStorage.setItem(adminSlot, session.token);
      setToken(session.token);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) await adminLogout(token).catch(() => undefined);
    window.localStorage.removeItem(adminSlot);
    setToken(null);
    setPlaces([]);
  };

  const openCreate = () => {
    setTagsText("");
    setError("");
    setEditor({ mode: "create", place: emptyPlace() });
  };

  const openEdit = (place: Place) => {
    setTagsText(place.tags.join(", "));
    setError("");
    setEditor({ mode: "edit", id: place.id, place: { ...place } });
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor || !token) return;
    setError("");
    setLoading(true);
    try {
      const input: PlaceInput = {
        ...editor.place,
        tags: tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      if (input.category === "__custom") {
        const label = input.categoryLabel.trim();
        const id = slugify(label);
        if (!label || !id) {
          setError("Escribe el nombre de la categoría personalizada");
          return;
        }
        input.category = id;
        input.categoryLabel = label;
      }
      if (editor.mode === "create") {
        await adminCreatePlace(token, input);
      } else {
        await adminUpdatePlace(token, editor.id, input);
      }
      setPlaces(await adminListPlaces(token));
      setEditor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el comercio");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (place: Place) => {
    if (!token) return;
    if (!window.confirm(`¿Eliminar "${place.name}" del directorio?`)) return;
    setError("");
    try {
      await adminDeletePlace(token, place.id);
      setPlaces(await adminListPlaces(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el comercio");
    }
  };

  const selectCategory = (id: string) => {
    if (!editor) return;
    if (id === "__custom") {
      setEditor({
        ...editor,
        place: { ...editor.place, category: "__custom", categoryLabel: "" },
      });
      return;
    }
    const category = categories.find((entry) => entry.id === id);
    setEditor({
      ...editor,
      place: {
        ...editor.place,
        category: category?.id ?? id,
        categoryLabel: category?.label ?? id,
      },
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream via-blush-50/70 to-lilac-50">
      <Header />

      {!token ? (
        <section className="mx-auto flex max-w-md flex-col items-center px-6 py-20">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-blush-300 via-blush-400 to-lilac-400 text-white shadow-soft">
            <CompassIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-3xl tracking-tight text-neutral-800">
            Panel de administración
          </h1>
          <p className="mt-2 text-center text-sm text-neutral-500">
            Inicia sesión para gestionar los comercios y experiencias de la plataforma.
          </p>

          <form
            onSubmit={handleLogin}
            className="mt-8 w-full space-y-5 rounded-3xl border border-blush-100/70 bg-white/80 p-8 shadow-soft backdrop-blur-xl"
          >
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className={labelClass}>
                Contraseña de administrador
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={inputClass}
                autoFocus
              />
            </div>
            {error ? (
              <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-full bg-gradient-to-r from-blush-400 to-lilac-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blush-200/50 transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "Verificando…" : "Entrar al panel"}
            </button>
          </form>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl tracking-tight text-neutral-800">
                Gestión del directorio
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {places.length} lugares publicados en Costa Rica Vibe.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCreate}
                className="flex items-center gap-2 rounded-full bg-lilac-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lilac-600"
              >
                <PinIcon className="h-4 w-4" />
                Añadir comercio
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-neutral-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-white"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          {error ? (
            <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {places.map((place) => (
              <article
                key={place.id}
                className="flex flex-col overflow-hidden rounded-3xl border border-blush-100/70 bg-white/80 shadow-soft backdrop-blur-xl"
              >
                <div
                  className="h-36 w-full bg-neutral-200"
                  style={
                    place.image
                      ? { backgroundImage: `url(${place.image})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined
                  }
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold text-blush-500">
                      {place.categoryLabel}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-gold-500">
                      <StarIcon className="h-3.5 w-3.5" />
                      {Number(place.rating).toFixed(1)}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg text-neutral-800">{place.name}</h3>
                  <p className="mt-1 flex-1 text-sm text-neutral-500">
                    {place.province ? `${place.province} · ` : ""}
                    {place.location}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(place)}
                      className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-lilac-400 hover:text-lilac-600"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(place)}
                      className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {editor ? (
            <FormEditor
              editor={editor}
              tagsText={tagsText}
              loading={loading}
              onChange={(place) => setEditor({ ...editor, place })}
              onTagsChange={setTagsText}
              onCategoryChange={selectCategory}
              onClose={() => setEditor(null)}
              onSubmit={handleSave}
            />
          ) : null}
        </section>
      )}
    </main>
  );
}

function FormEditor({
  editor,
  tagsText,
  loading,
  onChange,
  onTagsChange,
  onCategoryChange,
  onClose,
  onSubmit,
}: {
  editor: NonNullable<EditorState>;
  tagsText: string;
  loading: boolean;
  onChange: (place: PlaceInput) => void;
  onTagsChange: (value: string) => void;
  onCategoryChange: (id: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const place = editor.place;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-neutral-800/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl rounded-3xl border border-white/70 bg-cream p-8 shadow-soft"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl tracking-tight text-neutral-800">
              {editor.mode === "create" ? "Añadir comercio" : "Editar comercio"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Completa la ficha para publicarla en el directorio.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar editor" className="text-neutral-400 hover:text-neutral-700">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelClass}>Nombre *</label>
            <input
              value={place.name}
              onChange={(event) => onChange({ ...place, name: event.target.value })}
              placeholder="Ej. Cafetería Aurora"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Categoría *</label>
            <select
              value={place.category}
              onChange={(event) => onCategoryChange(event.target.value)}
              className={inputClass}
            >
              {place.category !== "__custom" &&
              !categories.some((category) => category.id === place.category) ? (
                <option value={place.category}>{place.categoryLabel || place.category}</option>
              ) : null}
              {categories
                .filter((category) => category.id !== "todos")
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              <option value="__custom">Personalizada…</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Provincia *</label>
            <select
              value={place.province}
              onChange={(event) => onChange({ ...place, province: event.target.value })}
              className={inputClass}
            >
              {!provinces.includes(place.province) ? (
                <option value={place.province || ""}>{place.province || "Sin provincia"}</option>
              ) : null}
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          {place.category === "__custom" ? (
            <div className="space-y-1.5 sm:col-span-2">
              <label className={labelClass}>Nombre de la categoría personalizada *</label>
              <input
                value={place.categoryLabel}
                onChange={(event) => onChange({ ...place, categoryLabel: event.target.value })}
                placeholder="Ej. Mascotas, música, cine…"
                className={inputClass}
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className={labelClass}>Zona / ubicación</label>
            <input
              value={place.location}
              onChange={(event) => onChange({ ...place, location: event.target.value })}
              placeholder="Ej. Barrio Escalante"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Vibe</label>
            <input
              value={place.vibe}
              onChange={(event) => onChange({ ...place, vibe: event.target.value })}
              placeholder="Ej. acogedor, música indie"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Precio</label>
            <select
              value={place.price}
              onChange={(event) => onChange({ ...place, price: event.target.value })}
              className={inputClass}
            >
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Calificación</label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={place.rating}
              onChange={(event) => onChange({ ...place, rating: Number(event.target.value) })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Horario</label>
            <input
              value={place.hours}
              onChange={(event) => onChange({ ...place, hours: event.target.value })}
              placeholder="Ej. Lun–Sáb 7:00–18:00"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>URL de imagen</label>
            <input
              value={place.image}
              onChange={(event) => onChange({ ...place, image: event.target.value })}
              placeholder="https://…"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelClass}>Tags (separados por coma)</label>
            <input
              value={tagsText}
              onChange={(event) => onTagsChange(event.target.value)}
              placeholder="Ej. brunch, terraza, café de especialidad"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelClass}>Descripción</label>
            <textarea
              value={place.description}
              onChange={(event) => onChange({ ...place, description: event.target.value })}
              rows={4}
              placeholder="¿Qué hace especial a este lugar?"
              className={`${inputClass} resize-none`}
            />
          </div>

          <label className="flex items-center gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={place.featured}
              onChange={(event) => onChange({ ...place, featured: event.target.checked })}
              className="h-4 w-4 accent-lilac-500"
            />
            <span className="text-sm font-medium text-neutral-600">Destacado en la portada</span>
          </label>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              !place.name ||
              !place.category ||
              (place.category === "__custom" && !place.categoryLabel.trim())
            }
            className="rounded-full bg-gradient-to-r from-blush-400 to-lilac-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blush-200/50 transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Guardando…" : editor.mode === "create" ? "Publicar" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}