import { NextRequest, NextResponse } from "next/server";
import {
  UFS,
  normalizeEA20,
  resultUrl,
  type ApiResponse,
  type Result,
} from "@/lib/results";
import { municipalitiesFor } from "@/lib/municipalities";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cache = new Map<
  string,
  { result: Result | null; checked: number; response: ApiResponse }
>();
const pending = new Map<string, Promise<ApiResponse>>();
const TTL = 12000;
async function load(uf: string, city?: string): Promise<ApiResponse> {
  const key = city ? `${uf}:${city}` : uf;
  const previous = cache.get(key);
  const now = Date.now();
  const checkedAt = new Date(now).toISOString();
  if (previous && now - previous.checked < TTL) return previous.response;
  let response: ApiResponse;
  try {
    if (city) {
      const allowed = (await municipalitiesFor(uf)).some((item) => item.code === city);
      if (!allowed) throw new Error("Município não consta da relação oficial");
    }
    const upstream = await fetch(resultUrl(uf, undefined, city), {
      signal: AbortSignal.timeout(10000),
      // TTL and CDN caching are managed below. Do not let an implicit fetch
      // cache conceal an upstream failure by returning an old successful body.
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) throw new Error(`upstream:${upstream.status}`);
    const raw = await upstream.text();
    if (raw.length > 2000000) throw new Error("Arquivo excessivo");
    const result = normalizeEA20(JSON.parse(raw), uf, undefined, city);
    response = {
      status: result.released && result.counted !== 0 ? "live" : "waiting",
      result,
      message: result.released
        ? result.counted === 0
          ? "Arquivo oficial disponível. O TSE ainda informa zero seções totalizadas."
          : "Dados oficiais recebidos do TSE."
        : "O TSE ainda não liberou a divulgação dos votos.",
      checkedAt,
    };
  } catch {
    // Keep only the last validated result for this territory and election.
    const result = previous?.result || null;
    response = {
      status: result ? "stale" : "unavailable",
      result,
      message: result
        ? "Consulta indisponível. Exibindo a última parcial validada; ela pode estar desatualizada."
        : "Não foi possível validar os dados do TSE. Nenhum resultado está sendo estimado.",
      checkedAt,
    };
  }
  cache.set(key, { result: response.result, checked: now, response });
  return response;
}
export async function GET(request: NextRequest) {
  const uf = (request.nextUrl.searchParams.get("uf") || "BR").toUpperCase();
  const city = request.nextUrl.searchParams.get("city") || undefined;
  if (!UFS.includes(uf as (typeof UFS)[number]))
    return NextResponse.json({ error: "UF inválida" }, { status: 400 });
  if (city && (!/^\d{5}$/.test(city) || uf === "BR" || uf === "ZZ"))
    return NextResponse.json({ error: "Município inválido" }, { status: 400 });
  const key = city ? `${uf}:${city}` : uf;
  if (!pending.has(key))
    pending.set(
      key,
      load(uf, city).finally(() => pending.delete(key)),
    );
  const response = await pending.get(key);
  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=12, stale-while-revalidate=3",
    },
  });
}
