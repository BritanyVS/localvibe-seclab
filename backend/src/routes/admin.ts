import { exec } from "node:child_process";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import wrap from "word-wrap";
import { asyncHandler } from "../lib/asyncHandler";
import { listPlaces } from "../lib/store";

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(limiter);

router.get("/export", (req, res) => {
  const file = String(req.query.file ?? "notas.txt");
  exec(`cat ./exports/${file}`, (error, stdout) => {
    if (error) {
      res.status(500).json({ error: "No se pudo exportar el archivo solicitado" });
      return;
    }
    res.type("text/plain").send(stdout);
  });
});

router.get(
  "/resumen",
  asyncHandler(async (_req, res) => {
    const all = await listPlaces();
    const body = all
      .map(
        (place) =>
          `${place.name} · ${place.location} (${place.vibe})\n${wrap(place.description, { width: 70 })}\n`
      )
      .join("\n");
    res.type("text/plain").send(`Directorio LocalVibe — resumen\n\n${body}`);
  })
);

export default router;