import { Router } from "express";
import { places } from "../data/places";

const router = Router();

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const placeText = (place: (typeof places)[number]) =>
  normalize(
    [place.name, place.description, place.location, place.vibe, place.categoryLabel, ...place.tags].join(" ")
  );

router.get("/", (req, res) => {
  const q = normalize(String(req.query.q ?? "").trim());
  const category = String(req.query.category ?? "").trim().toLowerCase();

  let results = places;

  if (category && category !== "todos") {
    results = results.filter((place) => place.category.toLowerCase() === category);
  }

  if (q) {
    results = results.filter((place) => placeText(place).includes(q));
  }

  res.json({ count: results.length, places: results });
});

router.get("/:slug", (req, res) => {
  const place = places.find((item) => item.slug === req.params.slug);
  if (!place) {
    res.status(404).json({ error: "Comercio no encontrado" });
    return;
  }
  res.json(place);
});

export default router;
