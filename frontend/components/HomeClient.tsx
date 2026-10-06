"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCategories, fetchPlaces } from "@/lib/api";
import { categories as defaultCategories } from "@/lib/categories";
import type { Category, Place } from "@/lib/types";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { PlaceGrid } from "./PlaceGrid";
import { Experiences } from "./Experiences";
import { PlaceModal } from "./PlaceModal";
import { VibeChat } from "./VibeChat";
import { Footer } from "./Footer";

export function HomeClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("todos");
  const [province, setProvince] = useState("");
  const [categoryList, setCategoryList] = useState<Category[]>(defaultCategories);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const [vibeOpen, setVibeOpen] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let active = true;
    fetchCategories().then((list) => {
      if (active) setCategoryList(list);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPlaces(query, category, province)
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
  }, [query, category, province]);

  const applySearch = (next: string) => {
    const url = next.trim() ? `/?q=${encodeURIComponent(next.trim())}` : "/";
    router.push(url);
  };

  return (
    <>
      <Header onOpenVibe={() => setVibeOpen(true)} />
      <Hero
        query={query}
        onSearch={applySearch}
        category={category}
        onCategory={setCategory}
        province={province}
        onProvince={setProvince}
        categoryList={categoryList}
      />
      <PlaceGrid places={places} loading={loading} error={error} onSelect={setSelected} />
      <Experiences places={places} onSelect={setSelected} />
      <Footer />
      <VibeChat
        open={vibeOpen}
        onToggle={() => setVibeOpen((value) => !value)}
        onSelectPlace={setSelected}
      />
      {selected && <PlaceModal place={selected} onClose={() => setSelected(null)} />}
    </>
  );
}