import { NextRequest, NextResponse } from "next/server";
import { municipalitiesFor } from "@/lib/municipalities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const uf = (request.nextUrl.searchParams.get("uf") || "").toUpperCase();
  try {
    const municipalities = await municipalitiesFor(uf);
    return NextResponse.json({ uf, municipalities, source: "TSE / EA12", checkedAt: new Date().toISOString() }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "UF inválida" ? "UF inválida" : "Cadastro municipal indisponível" }, { status: error instanceof Error && error.message === "UF inválida" ? 400 : 503 });
  }
}
