import { Router } from "express";
import { requireAdmin } from "./auth";
import { addPlace, listPlaces, removePlace, updatePlace } from "../lib/store";
import type { Place } from "../data/places";

const router = Router();

router.use(requireAdmin);

router.get("/", (_req, res) => {
  res.json({ places: listPlaces() });
});

router.post("/", (req, res) => {
  const body = req.body ?? {};
  if (!body.name || !body.category) {
    res.status(400).json({ error: "Son obligatorios el nombre y la categoría" });
    return;
  }
  const place = addPlace({
    ...body,
    rating: Number(body.rating) || 0,
  });
  res.status(201).json({ place });
});

router.put("/:id", (req, res) => {
  const body = req.body ?? {};
  const patch: Partial<Omit<Place, "id">> = {
    ...body,
    rating: Number(body.rating) || 0,
  };
  delete (patch as Partial<Place>).id;
  const updated = updatePlace(req.params.id, patch);
  if (!updated) {
    res.status(404).json({ error: "Comercio no encontrado" });
    return;
  }
  res.json({ place: updated });
});

router.delete("/:id", (req, res) => {
  const removed = removePlace(req.params.id);
  if (!removed) {
    res.status(404).json({ error: "Comercio no encontrado" });
    return;
  }
  res.json({ ok: true });
});

export default router;