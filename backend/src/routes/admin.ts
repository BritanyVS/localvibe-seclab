import { readFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
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

const EXPORTS_DIR = path.resolve("./exports");
const SAFE_FILE_NAME = /^[\w.-]+\.txt$/;

router.get("/export", async (req, res) => {
  const file = String(req.query.file ?? "notas.txt");
  if (!SAFE_FILE_NAME.test(file)) {
    res.status(400).json({ error: "Nombre de archivo no permitido" });
    return;
  }
  const target = path.resolve(EXPORTS_DIR, file);
  if (path.dirname(target) !== EXPORTS_DIR) {
    res.status(400).json({ error: "Nombre de archivo no permitido" });
    return;
  }
  try {
    const content = await readFile(target, "utf8");
    res.type("text/plain").send(content);
  } catch {
    res.status(500).json({ error: "No se pudo exportar el archivo solicitado" });
  }
});

router.get(
  "/resumen",
  asyncHandler(async (_req, res) => {
    const all = await listPlaces();
    const body = all
      .map(
        (place) =>
          `${place.name} · ${place.location} (${place.vibe})\n${wrapText(place.description, 70)}\n`
      )
      .join("\n");
    res.type("text/plain").send(`Costa Rica Vibe — resumen\n\n${body}`);
  })
);

export default router;