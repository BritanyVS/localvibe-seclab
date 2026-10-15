import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { asyncHandler } from "../lib/asyncHandler";
import {
  createReview,
  deleteReview,
  DuplicateReviewError,
  getPlace,
  listReviews,
  ReviewOwnershipError,
  updateReview,
} from "../lib/store";

const router = Router();
const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

type ReviewBody = {
  email?: unknown;
  password?: unknown;
  rating?: unknown;
  comment?: unknown;
};

function parseReview(body: ReviewBody, requireCredentials: boolean) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  const rating = body.rating;

  if (
    (requireCredentials &&
      (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 254 ||
        password.length < 8 ||
        password.length > 128)) ||
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    !comment ||
    comment.length > 1000
  ) {
    return null;
  }

  return { email, password, rating, comment };
}

function parseCredentials(body: ReviewBody) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !password) {
    return null;
  }
  return { email, password };
}

router.get(
  "/places/:placeId/reviews",
  asyncHandler(async (req, res) => {
    const place = await getPlace(req.params.placeId);
    if (!place) {
      res.status(404).json({ error: "Comercio no encontrado" });
      return;
    }
    const reviews = await listReviews(place.id);
    const average = reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;
    res.json({ reviews, count: reviews.length, average });
  })
);

router.post(
  "/places/:placeId/reviews",
  mutationLimiter,
  asyncHandler(async (req, res) => {
    const place = await getPlace(req.params.placeId);
    if (!place) {
      res.status(404).json({ error: "Comercio no encontrado" });
      return;
    }
    const input = parseReview(req.body as ReviewBody, true);
    if (!input) {
      res.status(400).json({
        error: "Ingresa un correo válido, una contraseña de al menos 8 caracteres, una calificación de 1 a 5 y un comentario de hasta 1000 caracteres",
      });
      return;
    }
    try {
      const review = await createReview({ ...input, placeId: place.id });
      res.status(201).json({ review });
    } catch (error) {
      if (error instanceof DuplicateReviewError) {
        res.status(409).json({ error: "Ya existe una reseña para este comercio con ese correo" });
        return;
      }
      throw error;
    }
  })
);

router.put(
  "/reviews/:reviewId",
  mutationLimiter,
  asyncHandler(async (req, res) => {
    const input = parseReview(req.body as ReviewBody, true);
    if (!input) {
      res.status(400).json({
        error: "Ingresa un correo válido, una contraseña de al menos 8 caracteres, una calificación de 1 a 5 y un comentario de hasta 1000 caracteres",
      });
      return;
    }
    try {
      const review = await updateReview(
        req.params.reviewId,
        { email: input.email, password: input.password },
        { rating: input.rating, comment: input.comment }
      );
      if (!review) {
        res.status(404).json({ error: "Reseña no encontrada" });
        return;
      }
      res.json({ review });
    } catch (error) {
      if (error instanceof ReviewOwnershipError) {
        res.status(403).json({ error: "Correo o contraseña incorrectos" });
        return;
      }
      throw error;
    }
  })
);

router.delete(
  "/reviews/:reviewId",
  mutationLimiter,
  asyncHandler(async (req, res) => {
    const credentials = parseCredentials(req.body as ReviewBody);
    if (!credentials) {
      res.status(400).json({ error: "Ingresa un correo y contraseña válidos" });
      return;
    }
    try {
      const deleted = await deleteReview(req.params.reviewId, credentials);
      if (!deleted) {
        res.status(404).json({ error: "Reseña no encontrada" });
        return;
      }
      res.status(204).end();
    } catch (error) {
      if (error instanceof ReviewOwnershipError) {
        res.status(403).json({ error: "Correo o contraseña incorrectos" });
        return;
      }
      throw error;
    }
  })
);

export default router;
