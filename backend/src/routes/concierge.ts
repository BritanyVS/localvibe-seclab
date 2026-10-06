import { Router } from "express";
import OpenAI from "openai";
import { listPlaces } from "../lib/store";

const router = Router();

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

async function buildCatalog() {
  const all = await listPlaces();
  return all.map(({ id, name, categoryLabel, location, vibe, description, tags }) => ({
    id,
    name,
    categoryLabel,
    location,
    vibe,
    description,
    tags,
  }));
}

async function buildSystemPrompt(): Promise<string> {
  const catalog = await buildCatalog();
  return `Eres Vibe, el asistente virtual de LocalVibe Explorer, una guía cálida que recomienda comercios y experiencias locales según el humor y los gustos de la persona.
Siempre respondes en español, con cercanía y sin jerga técnica.
Tienes acceso a este catálogo: ${JSON.stringify(catalog)}
Responde ÚNICAMENTE con JSON válido con esta forma: {"reply": "tu mensaje", "placeIds": ["id1","id2","id3"]}
Escoje como máximo 3 placeIds del catálogo que mejor calcen con lo que la persona busca. Si no hay coincidencias, devuelve placeIds vacío.`;
}

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

async function matchLocally(message: string): Promise<string[]> {
  const tokens = normalize(message).split(/\W+/).filter(Boolean);
  const all = await listPlaces();
  const scores = all
    .map((place) => {
      const hay = normalize(
        [place.name, place.categoryLabel, place.location, place.vibe, ...place.tags].join(" ")
      );
      const score = tokens.reduce((acc, token) => acc + (hay.includes(token) ? 1 : 0), 0);
      return { id: place.id, score };
    });
  return scores
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score > 0)
    .slice(0, 3)
    .map((entry) => entry.id);
}

router.post("/", async (req, res) => {
  const { message, history = [] } = req.body ?? {};
  const userMessage = String(message ?? "").trim();

  if (!userMessage) {
    res.status(400).json({ error: "Escribe un mensaje para conversar con Vibe" });
    return;
  }

  if (!client) {
    const placeIds = await matchLocally(userMessage);
    const reply =
      placeIds.length > 0
        ? "Claro, revisé el catálogo del barrio y estos lugares calzan perfecto con lo que buscas. ¡Échales un ojo!"
        : "Cuéntame un poco más sobre el plan: ¿algo tranquilo para leer, salir en grupo o una experiencia al aire libre?";
    res.json({ reply, placeIds });
    return;
  }

  try {
    const chat = await client.chat.completions.create({
      model,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: await buildSystemPrompt() },
        ...(Array.isArray(history) ? history.slice(-8) : []),
        { role: "user", content: userMessage },
      ],
    });

    const raw = chat.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { reply?: string; placeIds?: string[] };
    const validIds = new Set((await listPlaces()).map((place) => place.id));
    const placeIds = (parsed.placeIds ?? [])
      .filter((id) => validIds.has(id))
      .slice(0, 3);

    res.json({
      reply: parsed.reply ?? "¡Encontré algunos planes interesantes para ti!",
      placeIds,
    });
  } catch {
    const placeIds = await matchLocally(userMessage);
    res.json({
      reply:
        placeIds.length > 0
          ? "Conecté con el catálogo y esto es lo más cercano a lo que buscas. ¡Espero que te encante!"
          : "Hoy estoy teniendo un mal día de conexión, pero puedo recomendarte algo igual: cuéntame qué tipo de plan quieres.",
      placeIds,
    });
  }
});

export default router;