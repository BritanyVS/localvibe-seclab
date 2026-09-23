import { places as seed, type Place } from "../data/places";

let items: Place[] = [...seed];

export function listPlaces(): Place[] {
  return items;
}

export function getPlace(id: string): Place | undefined {
  return items.find((place) => place.id === id);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function addPlace(input: Omit<Place, "id" | "slug">): Place {
  const maxId = items.reduce((acc, place) => Math.max(acc, Number(place.id) || 0), 0);
  const place: Place = {
    id: String(maxId + 1),
    slug: slugify(input.name),
    ...input,
  };
  items = [place, ...items];
  return place;
}

export function updatePlace(id: string, patch: Partial<Omit<Place, "id">>): Place | undefined {
  let updated: Place | undefined;
  items = items.map((place) => {
    if (place.id !== id) return place;
    updated = { ...place, ...patch, slug: slugify(patch.name ?? place.name) };
    return updated;
  });
  return updated;
}

export function removePlace(id: string): boolean {
  const before = items.length;
  items = items.filter((place) => place.id !== id);
  return items.length < before;
}