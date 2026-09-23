import { randomBytes, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";

const router = Router();
const adminPassword = process.env.ADMIN_PASSWORD;
const sessions = new Map<string, number>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function extractToken(req: Request): string {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

router.post("/login", (req, res) => {
  if (!adminPassword) {
    res.status(503).json({ error: "La autenticación del administrador no está configurada" });
    return;
  }
  const candidate = Buffer.from(String(req.body?.password ?? ""));
  const expected = Buffer.from(adminPassword);
  if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  const token = randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  res.json({ token, expiresIn: SESSION_TTL_MS / 1000 });
});

router.post("/logout", (req, res) => {
  const token = extractToken(req);
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  const expiresAt = sessions.get(token);
  if (!token || !expiresAt) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    res.status(401).json({ error: "Sesión expirada" });
    return;
  }
  next();
}

export default router;