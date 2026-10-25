import { municipalitiesUrl, UFS } from "@/lib/results";

export type Municipality = { code: string; name: string; ibge: string };
const cache = new Map<string, { loadedAt: number; items: Municipality[] }>();
let pending: Promise<Map<string, Municipality[]>> | null = null;

async function loadAll(): Promise<Map<string, Municipality[]>> {
  const response = await fetch(municipalitiesUrl(), {
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`TSE municípios: HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 5_000_000) throw new Error("Cadastro municipal excessivo");
  const payload: unknown = JSON.parse(text);
  if (!payload || typeof payload !== "object" || !("abr" in payload) || !Array.isArray(payload.abr))
    throw new Error("Estrutura de municípios inválida");
  const all = new Map<string, Municipality[]>();
  for (const state of payload.abr) {
    if (!state || typeof state.cd !== "string" || !Array.isArray(state.mu)) continue;
    const uf = state.cd.toUpperCase();
    if (!UFS.includes(uf as (typeof UFS)[number]) || uf === "BR" || uf === "ZZ") continue;
    const items: Municipality[] = state.mu
      .filter((city: Record<string, unknown>) => /^\d{5}$/.test(String(city.cd)) && typeof city.nm === "string")
      .map((city: Record<string, unknown>) => ({ code: String(city.cd), name: String(city.nm), ibge: String(city.cdi ?? "") }))
      .sort((a: Municipality, b: Municipality) => a.name.localeCompare(b.name, "pt-BR"));
    all.set(uf, items);
  }
  if (all.size < 27) throw new Error("Cadastro municipal incompleto");
  const loadedAt = Date.now();
  for (const [uf, items] of all) cache.set(uf, { loadedAt, items });
  return all;
}

export async function municipalitiesFor(uf: string): Promise<Municipality[]> {
  if (!UFS.includes(uf as (typeof UFS)[number]) || uf === "BR" || uf === "ZZ")
    throw new Error("UF inválida");
  const cached = cache.get(uf);
  if (cached && Date.now() - cached.loadedAt < 24 * 60 * 60 * 1000) return cached.items;
  if (!pending) pending = loadAll().finally(() => { pending = null; });
  try { return (await pending).get(uf) ?? []; }
  catch (error) {
    if (cached) return cached.items;
    throw error;
  }
}
