import * as fs from "node:fs";
import * as path from "node:path";
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
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
  province: string;
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

export type Review = {
  id: string;
  placeId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

type StoredReview = Review & {
  email: string;
  passwordHash: string;
};

type ReviewCredentials = {
  email: string;
  password: string;
};

type ReviewInput = ReviewCredentials & {
  placeId: string;
  rating: number;
  comment: string;
};

type ReviewRow = {
  id: string;
  placeId: string;
  email: string;
  passwordHash: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export class DuplicateReviewError extends Error {}
export class ReviewOwnershipError extends Error {}

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_label TEXT NOT NULL,
  province TEXT NOT NULL DEFAULT '',
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

const CREATE_REVIEWS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (place_id, email)
);`;

const ALTER_PROVINCE_SQL = `ALTER TABLE places ADD COLUMN IF NOT EXISTS province TEXT NOT NULL DEFAULT '';`;

const SELECT_SQL = `
SELECT id, slug, name, category, category_label AS "categoryLabel", province,
  location, vibe, description, tags, price, rating, hours, image, featured
FROM places
ORDER BY id::int DESC;`;

const SELECT_WHERE_SQL = `
SELECT id, slug, name, category, category_label AS "categoryLabel", province,
  location, vibe, description, tags, price, rating, hours, image, featured
FROM places
WHERE id = $1;`;

const INSERT_SQL = `
INSERT INTO places (id, slug, name, category, category_label, location, vibe, description, tags, price, rating, hours, image, featured, province)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14, $15)
RETURNING *;`;

const INSERT_SEED_SQL = `
INSERT INTO places (id, slug, name, category, category_label, location, vibe, description, tags, price, rating, hours, image, featured, province)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14, $15)
ON CONFLICT (slug) DO NOTHING;`;

const UPDATE_SQL = `
UPDATE places
SET slug = $2, name = $3, category = $4, category_label = $5, location = $6,
  vibe = $7, description = $8, tags = $9::jsonb, price = $10, rating = $11,
  hours = $12, image = $13, featured = $14, province = $15
WHERE id = $1
RETURNING *;`;

const DELETE_SQL = `DELETE FROM places WHERE id = $1 RETURNING id;`;

const NEXT_ID_SQL = `SELECT COALESCE(MAX(id::int), 0) + 1 AS next FROM places;`;

let pgReady: Promise<void> | null = null;

function readyPostgres(): Promise<void> {
  if (!pool) return Promise.resolve();
  pgReady ??= (async () => {
    await pool.query(CREATE_TABLE_SQL);
    await pool.query(ALTER_PROVINCE_SQL);
    await pool.query(CREATE_REVIEWS_TABLE_SQL);
    for (const place of seed) {
      const { rows } = await pool.query<{ next: number }>(NEXT_ID_SQL);
      await pool.query(INSERT_SEED_SQL, [String(rows[0]?.next ?? 1), ...placeParams(place).slice(1)]);
      await pool.query(
        `UPDATE places SET province = $1 WHERE slug = $2 AND (province IS NULL OR province = '');`,
        [place.province, place.slug]
      );
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
    province: row.province ?? "",
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
    place.province,
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
      if (Array.isArray(parsed)) return (parsed as Place[]).map((item) => ({ ...item, province: item.province ?? "" }));
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
  if (jsonItems.length < before) {
    persistJson(jsonItems);
    jsonReviews = loadJsonReviews().filter((review) => review.placeId !== id);
    persistJsonReviews(jsonReviews);
  }
  return jsonItems.length < before;
}

const REVIEWS_FILE = process.env.REVIEWS_FILE ?? path.join(path.dirname(FILE), "reviews.json");
const PASSWORD_KEY_LENGTH = 64;
let jsonReviews: StoredReview[] | null = null;

function derivePassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, PASSWORD_KEY_LENGTH, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await derivePassword(password, salt);
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [saltHex, keyHex] = hash.split(":");
  if (!saltHex || !keyHex || !/^[a-f0-9]+$/i.test(saltHex) || !/^[a-f0-9]+$/i.test(keyHex)) {
    return false;
  }
  const expected = Buffer.from(keyHex, "hex");
  if (expected.length !== PASSWORD_KEY_LENGTH) return false;
  const actual = await derivePassword(password, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(actual, expected);
}

function persistJsonReviews(items: StoredReview[]): void {
  fs.mkdirSync(path.dirname(REVIEWS_FILE), { recursive: true });
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(items, null, 2));
}

function loadJsonReviews(): StoredReview[] {
  if (!fs.existsSync(REVIEWS_FILE)) return [];
  const parsed: unknown = JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("El archivo de reseñas no contiene una lista válida");
  return parsed as StoredReview[];
}

function getJsonReviews(): StoredReview[] {
  jsonReviews ??= loadJsonReviews();
  return jsonReviews;
}

function rowToStoredReview(row: ReviewRow): StoredReview {
  return {
    id: row.id,
    placeId: row.placeId,
    email: row.email,
    passwordHash: row.passwordHash,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function publicReview(review: StoredReview): Review {
  const { email: _email, passwordHash: _passwordHash, ...visible } = review;
  return visible;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findStoredReview(id: string): Promise<StoredReview | undefined> {
  if (pool) {
    await readyPostgres();
    const { rows } = await pool.query<ReviewRow>(
      `SELECT id, place_id AS "placeId", email, password_hash AS "passwordHash",
        rating, comment, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM reviews WHERE id = $1;`,
      [id]
    );
    return rows[0] ? rowToStoredReview(rows[0]) : undefined;
  }
  return getJsonReviews().find((review) => review.id === id);
}

export async function listReviews(placeId: string): Promise<Review[]> {
  if (pool) {
    await readyPostgres();
    const { rows } = await pool.query<ReviewRow>(
      `SELECT id, place_id AS "placeId", email, password_hash AS "passwordHash",
        rating, comment, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM reviews WHERE place_id = $1 ORDER BY created_at DESC;`,
      [placeId]
    );
    return rows.map((row) => publicReview(rowToStoredReview(row)));
  }
  return getJsonReviews()
    .filter((review) => review.placeId === placeId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(publicReview);
}

export async function listReviewsForPlaces(placeIds: string[]): Promise<Review[]> {
  if (placeIds.length === 0) return [];
  if (pool) {
    await readyPostgres();
    const { rows } = await pool.query<ReviewRow>(
      `SELECT id, place_id AS "placeId", email, password_hash AS "passwordHash",
        rating, comment, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM reviews WHERE place_id = ANY($1) ORDER BY created_at DESC;`,
      [placeIds]
    );
    return rows.map((row) => publicReview(rowToStoredReview(row)));
  }
  const allowed = new Set(placeIds);
  return getJsonReviews()
    .filter((review) => allowed.has(review.placeId))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(publicReview);
}

export async function createReview(input: ReviewInput): Promise<Review> {
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const review: StoredReview = {
    id: randomUUID(),
    placeId: input.placeId,
    email,
    passwordHash,
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (pool) {
    await readyPostgres();
    try {
      const { rows } = await pool.query<ReviewRow>(
        `INSERT INTO reviews (id, place_id, email, password_hash, rating, comment)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, place_id AS "placeId", email, password_hash AS "passwordHash",
          rating, comment, created_at AS "createdAt", updated_at AS "updatedAt";`,
        [review.id, review.placeId, email, passwordHash, input.rating, input.comment]
      );
      return publicReview(rowToStoredReview(rows[0]));
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new DuplicateReviewError();
      throw error;
    }
  }

  const reviews = getJsonReviews();
  if (reviews.some((item) => item.placeId === review.placeId && item.email === email)) {
    throw new DuplicateReviewError();
  }
  reviews.push(review);
  persistJsonReviews(reviews);
  return publicReview(review);
}

export async function updateReview(
  id: string,
  credentials: ReviewCredentials,
  input: Pick<Review, "rating" | "comment">
): Promise<Review | undefined> {
  const review = await findStoredReview(id);
  if (!review) return undefined;
  if (
    review.email !== normalizeEmail(credentials.email) ||
    !(await verifyPassword(credentials.password, review.passwordHash))
  ) {
    throw new ReviewOwnershipError();
  }

  const updated = { ...review, ...input, updatedAt: new Date().toISOString() };
  if (pool) {
    await pool.query(
      `UPDATE reviews SET rating = $2, comment = $3, updated_at = NOW() WHERE id = $1;`,
      [id, input.rating, input.comment]
    );
    return publicReview({ ...updated, updatedAt: new Date().toISOString() });
  }
  const reviews = getJsonReviews();
  const index = reviews.findIndex((item) => item.id === id);
  if (index < 0) return undefined;
  reviews[index] = updated;
  persistJsonReviews(reviews);
  return publicReview(updated);
}

export async function deleteReview(
  id: string,
  credentials: ReviewCredentials
): Promise<boolean> {
  const review = await findStoredReview(id);
  if (!review) return false;
  if (
    review.email !== normalizeEmail(credentials.email) ||
    !(await verifyPassword(credentials.password, review.passwordHash))
  ) {
    throw new ReviewOwnershipError();
  }

  if (pool) {
    await pool.query(`DELETE FROM reviews WHERE id = $1;`, [id]);
    return true;
  }
  jsonReviews = getJsonReviews().filter((item) => item.id !== id);
  persistJsonReviews(jsonReviews);
  return true;
}