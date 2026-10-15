"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createPlaceReview,
  deletePlaceReview,
  fetchPlaceReviews,
  updatePlaceReview,
} from "@/lib/api";
import type { Review, ReviewInput } from "@/lib/types";
import { StarIcon } from "./icons";

const emptyInput: ReviewInput = {
  email: "",
  password: "",
  rating: 5,
  comment: "",
};

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={index}
          className={`h-4 w-4 ${index < rating ? "text-gold-400" : "text-neutral-200"}`}
        />
      ))}
    </span>
  );
}

export function PlaceReviews({ placeId }: { placeId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ReviewInput>(emptyInput);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteCredentials, setDeleteCredentials] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshReviews() {
    setReviews(await fetchPlaceReviews(placeId));
  }

  useEffect(() => {
    let active = true;
    fetchPlaceReviews(placeId)
      .then((result) => {
        if (active) setReviews(result);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "No se pudieron cargar las reseñas");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [placeId]);

  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editingId) await updatePlaceReview(editingId, form);
      else await createPlaceReview(placeId, form);
      await refreshReviews();
      setForm(emptyInput);
      setEditingId(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar la reseña");
    } finally {
      setBusy(false);
    }
  }

  async function submitDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deleteId) return;
    setBusy(true);
    setError(null);
    try {
      await deletePlaceReview(deleteId, deleteCredentials);
      await refreshReviews();
      setDeleteId(null);
      setDeleteCredentials({ email: "", password: "" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo eliminar la reseña");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(review: Review) {
    setEditingId(review.id);
    setDeleteId(null);
    setForm({ ...emptyInput, rating: review.rating, comment: review.comment });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyInput);
  }

  return (
    <section className="mt-8 border-t border-neutral-100 pt-6" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 id="reviews-title" className="font-display text-2xl font-semibold text-neutral-900">
            Reseñas
          </h4>
          <p className="mt-1 text-sm text-neutral-500">Opiniones de la comunidad</p>
        </div>
        {average !== null && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <ReviewStars rating={Math.round(average)} />
            <span>
              {average.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
            </span>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-neutral-500">Cargando reseñas…</p>
        ) : reviews.length === 0 ? (
          <p className="rounded-2xl bg-cream px-4 py-4 text-sm text-neutral-600">
            Aún no hay reseñas. ¡Sé la primera persona en compartir su experiencia!
          </p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-neutral-100 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ReviewStars rating={review.rating} />
                <div className="flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => startEdit(review)}
                    className="font-medium text-lilac-600 hover:text-lilac-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteId(deleteId === review.id ? null : review.id);
                      setDeleteCredentials({ email: "", password: "" });
                      setEditingId(null);
                      setError(null);
                    }}
                    className="font-medium text-rose-600 hover:text-rose-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                {review.comment}
              </p>

              {deleteId === review.id && (
                <form onSubmit={submitDelete} className="mt-4 space-y-3 rounded-xl bg-cream p-4">
                  <p className="text-sm font-medium text-neutral-700">
                    Ingresa el correo y la contraseña usados para escribir esta reseña.
                  </p>
                  <input
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    value={deleteCredentials.email}
                    onChange={(event) =>
                      setDeleteCredentials({ ...deleteCredentials, email: event.target.value })
                    }
                    placeholder="Correo electrónico"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-lilac-400"
                  />
                  <input
                    type="password"
                    required
                    maxLength={128}
                    autoComplete="current-password"
                    value={deleteCredentials.password}
                    onChange={(event) =>
                      setDeleteCredentials({ ...deleteCredentials, password: event.target.value })
                    }
                    placeholder="Contraseña"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-lilac-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {busy ? "Eliminando…" : "Confirmar eliminación"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteId(null);
                        setDeleteCredentials({ email: "", password: "" });
                      }}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))
        )}
      </div>

      <form onSubmit={submitReview} className="mt-6 rounded-2xl bg-cream p-5">
        <h5 className="font-semibold text-neutral-900">
          {editingId ? "Editar tu reseña" : "Deja una reseña"}
        </h5>
        <fieldset className="mt-3">
          <legend className="text-sm font-medium text-neutral-700">Tu calificación</legend>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, rating: value })}
                  aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
                  aria-pressed={form.rating === value}
                  className="rounded-md p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lilac-500"
                >
                  <StarIcon
                    className={`h-6 w-6 ${
                      value <= form.rating ? "text-gold-400" : "text-neutral-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="mt-3 block text-sm font-medium text-neutral-700">
          Comentario
          <textarea
            required
            maxLength={1000}
            rows={3}
            value={form.comment}
            onChange={(event) => setForm({ ...form, comment: event.target.value })}
            placeholder="¿Cómo fue tu experiencia?"
            className="mt-1 w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-lilac-400"
          />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-neutral-700">
            Correo electrónico
            <input
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="tu@correo.com"
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-lilac-400"
            />
          </label>
          <label className="text-sm font-medium text-neutral-700">
            Contraseña
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete={editingId ? "current-password" : "new-password"}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder={editingId ? "Tu contraseña de reseña" : "Mínimo 8 caracteres"}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-lilac-400"
            />
          </label>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          No verificamos el correo. Guarda estos datos: necesitarás el mismo correo y contraseña
          para editar o eliminar tu reseña.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-blush-400 to-lilac-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {busy ? "Guardando…" : editingId ? "Guardar cambios" : "Publicar reseña"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-white"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
