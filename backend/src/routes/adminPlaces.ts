import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAdmin } from "./auth";
import { addPlace, listPlaces, removePlace, updatePlace } from "../lib/store";
import type { Place } from "../data/places";

const router = Router();

router.use(requireAdmin);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ places: await listPlaces() });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    if (!body.name || !body.category) {
      res.status(400).json({ error: "Son obligatorios el nombre y la categoría" });
      return;
    }
    const place = await addPlace({
      ...body,
      rating: Number(body.rating) || 0,
    });
    res.status(201).json({ place });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const patch: Partial<Omit<Place, "id">> = {
      ...body,
      rating: Number(body.rating) || 0,
    };
    delete (patch as Partial<Place>).id;
    const updated = await updatePlace(req.params.id, patch);
    if (!updated) {
      res.status(404).json({ error: "Comercio no encontrado" });
      return;
    }
    res.json({ place: updated });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const removed = await removePlace(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Comercio no encontrado" });
      return;
    }
    res.json({ ok: true });
  })
);

export default router;