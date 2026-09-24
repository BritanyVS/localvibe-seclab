import * as fs from "node:fs";
import * as path from "node:path";
import { Pool } from "pg";
import { places as seed, type Place } from "../data/places";

const FILE = process.env.PLACES_FILE ?? path.join(process.cwd(), "data", "places.json");
const connectionString = process.env.DATABASE_URL ?? "";
const usePostgres = connectionString.length > 0;

const pool = usePostgres
  ? new Pool({
      connectionString,
      max: 5,
      ssl: /[?&]sslmode=(require|verify-ca|verify-full)/i.test(connectionString)
        ? true
        : undefined,
    })
  : null;

type PlaceRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  location: string;
  vibe: string;
  description: string;
  tags: unknown;
  price: string;
  rating: string | number;
  hours: string;
  image: string;
  featured: boolean;
};

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_label TEXT NOT NULL,
  location TEXT NOT NULL,
  vibe TEXT NOT NULL,
  description TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  price TEXT NOT NULL,
  rating NUMERIC NOT NULL DEFAULT 0,
  hours TEXT NOT NULL,
  image TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE
);`;

const SELECT_SQL = `
SELECT id, slug, name, category, category_label AS "categoryLabel",
  location, vibe, description, tags, price, rating, hours, image, featured
FROM places
ORDER BY id::int DESC;`;

const SELECT_WHERE_SQL = `
SELECT id, slug, name, category, category_label AS "categoryLabel",
  location, vibe, description, tags, price, rating, hours, image, featured
FROM places
WHERE id = $1;`;

const INSERT_SQL = `
INSERT INTO places (id, slug, name, category, category_label, location, vibe, description, tags, price, rating, hours, image, featured)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14)
RETURNING *;`;

const UPDATE_SQL = `
UPDATE places
SET slug = $2, name = $3, category = $4, category_label = $5, location = $6,
  vibe = $7, description = $8, tags = $9::jsonb, price = $10, rating = $11,
  hours = $12, image = $13, featured = $14
WHERE id = $1
RETURNING *;`;

const DELETE_SQL = `DELETE FROM places WHERE id = $1 RETURNING id;`;

const NEXT_ID_SQL = `SELECT COALESCE(MAX(id::int), 0) + 1 AS next FROM places;`;

let pgReady: Promise<void> | null = null;

function readyPostgres(): Promise<void> {
  if (!pool) return Promise.resolve();
  pgReady ??= (async () => {
    await pool.query(CREATE_TABLE_SQL);
    const { rows } = await pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM places;`
    );
    if (rows[0]?.count === 0) {
      for (const place of seed) {
        await insertRow(place);
      }
    }
  })();
  return pgReady;
}

function rowToPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    categoryLabel: row.categoryLabel,
    location: row.location,
    vibe: row.vibe,
    description: row.description,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    price: row.price,
    rating: Number(row.rating),
    hours: row.hours,
    image: row.image,
    featured: Boolean(row.featured),
  };
}

function placeParams(place: Place): unknown[] {
  return [
    place.id,
    place.slug,
    place.name,
    place.category,
    place.categoryLabel,
    place.location,
    place.vibe,
    place.description,
    JSON.stringify(place.tags),
    place.price,
    place.rating,
    place.hours,
    place.image,
    place.featured,
  ];
}

async function insertRow(place: Place): Promise<void> {
  await pool!.query(INSERT_SQL, placeParams(place));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function persistJson(items: Place[]) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2));
}

function loadJsonItems(): Place[] {
  try {
    if (fs.existsSync(FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
      if (Array.isArray(parsed)) return parsed as Place[];
    }
  } catch {
  }
  const items = [...seed];
  persistJson(items);
  return items;
}

let jsonItems: Place[] | null = null;

export async function listPlaces(): Promise<Place[]> {
  if (pool) {
    await readyPostgres();
    const { rows } = await pool.query<PlaceRow>(SELECT_SQL);
    return rows.map(rowToPlace);
  }
  jsonItems ??= loadJsonItems();
  return jsonItems;
}

export async function getPlace(id: string): Promise<Place | undefined> {
  if (pool) {
    await readyPostgres();
    const { rows } = await pool.query<PlaceRow>(SELECT_WHERE_SQL, [id]);
    return rows[0] ? rowToPlace(rows[0]) : undefined;
  }
  jsonItems ??= loadJsonItems();
  return jsonItems.find((place) => place.id === id);
}

async function nextId(): Promise<number> {
  if (pool) {
    await readyPostgres();
    const { rows } = await pool.query<{ next: number }>(NEXT_ID_SQL);
    return rows[0]?.next ?? 1;
  }
  jsonItems ??= loadJsonItems();
  return jsonItems.reduce((acc, place) => Math.max(acc, Number(place.id) || 0), 0) + 1;
}

export async function addPlace(input: Omit<Place, "id" | "slug">): Promise<Place> {
  const place: Place = {
    id: String(await nextId()),
    slug: slugify(input.name),
    ...input,
  };
  if (pool) {
    await insertRow(place);
    return place;
  }
  jsonItems ??= loadJsonItems();
  jsonItems = [place, ...jsonItems];
  persistJson(jsonItems);
  return place;
}

export async function updatePlace(
  id: string,
  patch: Partial<Omit<Place, "id">>
): Promise<Place | undefined> {
  if (pool) {
    const current = await getPlace(id);
    if (!current) return undefined;
    const updated: Place = { ...current, ...patch, slug: slugify(patch.name ?? current.name) };
    const { rows } = await pool.query<PlaceRow>(UPDATE_SQL, placeParams(updated));
    return rows[0] ? rowToPlace(rows[0]) : undefined;
  }
  jsonItems ??= loadJsonItems();
  let updated: Place | undefined;
  jsonItems = jsonItems.map((place) => {
    if (place.id !== id) return place;
    updated = { ...place, ...patch, slug: slugify(patch.name ?? place.name) };
    return updated;
  });
  if (updated) persistJson(jsonItems);
  return updated;
}

export async function removePlace(id: string): Promise<boolean> {
  if (pool) {
    await readyPostgres();
    const { rowCount } = await pool.query(DELETE_SQL, [id]);
    return (rowCount ?? 0) > 0;
  }
  jsonItems ??= loadJsonItems();
  const before = jsonItems.length;
  jsonItems = jsonItems.filter((place) => place.id !== id);
  if (jsonItems.length < before) persistJson(jsonItems);
  return jsonItems.length < before;
}