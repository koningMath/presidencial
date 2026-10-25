import { NextRequest, NextResponse } from "next/server";
import {
  UFS,
  normalizeEA20,
  resultUrl,
  type ApiResponse,
  type Result,
} from "@/lib/results";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cache = new Map<
  string,
  { result: Result | null; checked: number; response: ApiResponse }
>();
const pending = new Map<string, Promise<ApiResponse>>();
const TTL = 45000;
async function load(uf: string): Promise<ApiResponse> {
  const previous = cache.get(uf);
  const now = Date.now();
  const checkedAt = new Date(now).toISOString();
  if (previous && now - previous.checked < TTL) return previous.response;
  let response: ApiResponse;
  try {
    const upstream = await fetch(resultUrl(uf), {
      signal: AbortSignal.timeout(10000),
      // TTL and CDN caching are managed below. Do not let an implicit fetch
      // cache conceal an upstream failure by returning an old successful body.
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!upstream.ok) throw new Error(`upstream:${upstream.status}`);
    const raw = await upstream.text();
    if (raw.length > 2000000) throw new Error("Arquivo excessivo");
    const result = normalizeEA20(JSON.parse(raw), uf);
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
  cache.set(uf, { result: response.result, checked: now, response });
  return response;
}
export async function GET(request: NextRequest) {
  const uf = (request.nextUrl.searchParams.get("uf") || "BR").toUpperCase();
  if (!UFS.includes(uf as (typeof UFS)[number]))
    return NextResponse.json({ error: "UF inválida" }, { status: 400 });
  if (!pending.has(uf))
    pending.set(
      uf,
      load(uf).finally(() => pending.delete(uf)),
    );
  const response = await pending.get(uf);
  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=45, stale-while-revalidate=15",
    },
  });
}
