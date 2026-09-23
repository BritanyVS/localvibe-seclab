"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchPlaces } from "@/lib/api";
import type { Place } from "@/lib/types";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { PlaceGrid } from "./PlaceGrid";
import { PlaceModal } from "./PlaceModal";
import { ConciergeChat } from "./ConciergeChat";
import { Footer } from "./Footer";

export function HomeClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("todos");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPlaces(query, category)
      .then((result) => {
        if (active) {
          setPlaces(result);
          setError(null);
        }
      })
      .catch(() => {
        if (active) setError("No logramos conectar con el directorio. Intenta de nuevo.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, category]);

  const applySearch = (next: string) => {
    const url = next.trim() ? `/?q=${encodeURIComponent(next.trim())}` : "/";
    router.push(url);
  };

  return (
    <>
      <Header />
      <Hero
        query={query}
        onSearch={applySearch}
        category={category}
        onCategory={setCategory}
      />
      <PlaceGrid places={places} loading={loading} error={error} onSelect={setSelected} />
      <Footer />
      <ConciergeChat onSelectPlace={setSelected} />
      {selected && <PlaceModal place={selected} onClose={() => setSelected(null)} />}
    </>
  );
}