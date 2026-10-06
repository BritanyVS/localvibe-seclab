import { Router } from "express";
import OpenAI from "openai";
import { listPlaces } from "../lib/store";
import { provinces } from "../data/places";

const router = Router();

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const STOPWORDS = new Set([
  "de", "la", "el", "los", "las", "un", "una", "unos", "unas", "en", "por", "para", "con",
  "que", "y", "o", "a", "me", "mi", "se", "su", "lo", "del", "al", "como", "quiero", "busco",
  "buscar", "algo", "alguien", "actividad", "plan", "planes", "dia", "hoy", "esta", "este",
  "esto", "hay", "ir", "vamos", "voy", "dar", "dame", "recomienda", "recomiendame", "dime",
  "necesito", "favor", "gusta", "gustaria", "puede", "puedes", "hacer",
]);

async function buildCatalog() {
  const all = await listPlaces();
  return all.map(({ id, name, categoryLabel, province, location, vibe, description, tags }) => ({
    id,
    name,
    categoryLabel,
    province,
    location,
    vibe,
    description,
    tags,
  }));
}

async function buildSystemPrompt(): Promise<string> {
  const catalog = await buildCatalog();
  return `Eres Vibe, el asistente virtual de Costa Rica Vibe, una guía cálida que recomienda lugares, comercios y experiencias de las 7 provincias de Costa Rica según el plan y los gustos de la persona.
Siempre respondes en español, con cercanía y sin jerga técnica.
Tienes acceso a este catálogo (cada lugar incluye su provincia): ${JSON.stringify(catalog)}
Reglas importantes:
- Si la persona menciona una provincia, ciudad o zona, SOLO recomienda lugares de esa provincia.
- Si menciona una actividad (acampar, surf, yoga, estudiar, comprar, etc.), prioriza lugares cuya categoría, descripción o tags conecten con esa actividad.
- Combina ambos filtros cuando estén presentes: por ejemplo "acampada en Limón" = provincia "Limón" Y actividad de acampada/camping/senderismo.
Responde ÚNICAMENTE con JSON válido con esta forma: {"reply": "tu mensaje", "placeIds": ["id1","id2","id3"]}
Escoge como máximo 3 placeIds del catálogo que mejor calcen con lo que la persona busca. Si no hay coincidencias, devuelve placeIds vacío.`;
}

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

async function matchLocally(message: string): Promise<string[]> {
  const norm = normalize(message);
  const provincesHit = provinces.filter((item) => norm.includes(normalize(item)));
  let all = await listPlaces();
  if (provincesHit.length > 0) {
    const allowed = provincesHit.map(normalize);
    all = all.filter((place) => allowed.includes(normalize(place.province ?? "")));
  }
  const tokens = norm.split(/\W+/).filter((token) => token.length >= 3 && !STOPWORDS.has(token));
  const scores = all
    .map((place) => {
      const hay = normalize(
        [place.name, place.categoryLabel, place.province ?? "", place.location, place.vibe, place.description, ...place.tags].join(" ")
      );
      const score = tokens.reduce(
        (acc, token) =>
          acc + (hay.includes(token) || (token.length > 5 && hay.includes(token.slice(0, 5))) ? 1 : 0),
        0
      );
      return { id: place.id, score };
    });
  const sorted = scores.sort((a, b) => b.score - a.score).filter((entry) => entry.score > 0);
  const top = sorted[0]?.score ?? 0;
  return sorted
    .filter((entry) => top <= 1 || entry.score === top)
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
        ? "Claro, revisé el catálogo de Costa Rica y estos lugares calzan perfecto con lo que buscas. ¡Échales un ojo!"
        : "Cuéntame un poco más del plan: ¿provincia, actividad, tranquilidad o algo en grupo?";
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
          : "Hoy estoy teniendo un mal día de conexión, pero puedo recomendarte igual: cuéntame la provincia y qué plan tienes en mente.",
      placeIds,
    });
  }
});

export default router;