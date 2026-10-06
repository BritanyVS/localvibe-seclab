import type { ChatMessage, ConciergeReply, Place, PlaceInput } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchPlaces(q = "", category = "todos"): Promise<Place[]> {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (category && category !== "todos") params.set("category", category);

  const res = await fetch(`${API_URL}/api/places?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudo cargar el directorio");
  const data = (await res.json()) as { places: Place[] };
  return data.places;
}

export async function askConcierge(
  message: string,
  history: ChatMessage[] = []
): Promise<ConciergeReply> {
  const res = await fetch(`${API_URL}/api/concierge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.map(({ role, content }) => ({ role, content })),
    }),
  });
  if (!res.ok) throw new Error("Vibe no pudo responder ahora");
  return (await res.json()) as ConciergeReply;
}

export type AdminSession = {
  token: string;
  expiresIn: number;
};

async function adminRequest(path: string, token: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Error en la solicitud de administración");
  }
  return res.json();
}

export async function adminLogin(password: string): Promise<AdminSession> {
  return (await adminRequest("/api/admin/login", "", {
    method: "POST",
    body: JSON.stringify({ password }),
  })) as AdminSession;
}

export async function adminLogout(token: string): Promise<void> {
  await adminRequest("/api/admin/logout", token, { method: "POST", body: "{}" });
}

export async function adminListPlaces(token: string): Promise<Place[]> {
  const data = (await adminRequest("/api/admin/places", token)) as { places: Place[] };
  return data.places;
}

export async function adminCreatePlace(token: string, place: PlaceInput): Promise<Place> {
  const data = (await adminRequest("/api/admin/places", token, {
    method: "POST",
    body: JSON.stringify(place),
  })) as { place: Place };
  return data.place;
}

export async function adminUpdatePlace(token: string, id: string, place: PlaceInput): Promise<Place> {
  const data = (await adminRequest(`/api/admin/places/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(place),
  })) as { place: Place };
  return data.place;
}

export async function adminDeletePlace(token: string, id: string): Promise<void> {
  await adminRequest(`/api/admin/places/${id}`, token, { method: "DELETE" });
}