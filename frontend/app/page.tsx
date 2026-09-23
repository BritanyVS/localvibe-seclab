import { HomeClient } from "@/components/HomeClient";
import { SearchNotice } from "@/components/SearchNotice";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] ?? "" : (params.q ?? "");
  const active = raw.trim();

  return (
    <main className="min-h-screen overflow-x-hidden">
      {active && (
        <div className="sticky top-16 z-30 flex justify-center px-6 pt-4">
          <SearchNotice />
        </div>
      )}
      <HomeClient initialQuery={active} />
    </main>
  );
}