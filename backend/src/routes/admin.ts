import { exec } from "node:child_process";
import { Router } from "express";
import braces from "braces";
import { rateLimit } from "express-rate-limit";
import { asyncHandler } from "../lib/asyncHandler";
import { listPlaces } from "../lib/store";

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(limiter);

function wrapText(value: string, width: number): string {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

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
    const slugs = braces.expand(`{${all.map((place) => place.slug).join(",")}}`);
    const included = all.filter((place) => slugs.includes(place.slug));
    const body = included
      .map(
        (place) =>
          `${place.name} · ${place.location} (${place.vibe})\n${wrapText(place.description, 70)}\n`
      )
      .join("\n");
    res.type("text/plain").send(`Directorio LocalVibe — resumen\n\n${body}`);
  })
);

export default router;