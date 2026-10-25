export const UFS = [
  "BR",
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
  "ZZ",
] as const;
export type Candidate = {
  number: string;
  name: string;
  party: string;
  votes: number | null;
  percent: number | null;
  elected: boolean;
  status: string;
  vice: string | null;
};
export type Result = {
  uf: string;
  city?: string;
  election: string;
  updatedAt: string;
  fetchedAt: string;
  released: boolean;
  final: boolean;
  progress: number | null;
  sections: number | null;
  counted: number | null;
  valid: number | null;
  blank: number | null;
  nullVotes: number | null;
  turnout: number | null;
  abstention: number | null;
  candidates: Candidate[];
  source: string;
};
export type ApiResponse = {
  status: "live" | "waiting" | "unavailable" | "stale";
  result: Result | null;
  message: string;
  checkedAt: string;
};
export const election = process.env.TSE_ELECTION_ID || "6258";
export function resultUrl(uf: string, id = election, city?: string) {
  if (!UFS.includes(uf as (typeof UFS)[number]) || !/^\d{1,6}$/.test(id))
    throw new Error("Parâmetro inválido");
  if (city && (!/^\d{5}$/.test(city) || uf === "BR" || uf === "ZZ"))
    throw new Error("Código municipal inválido");
  return `https://resultados.tse.jus.br/oficial/ele2026/${id}/dados/${uf.toLowerCase()}/${uf.toLowerCase()}${city || ""}-c0001-e${id.padStart(6, "0")}-u.json`;
}
export function municipalitiesUrl(id = election) {
  if (!/^\d{1,6}$/.test(id)) throw new Error("Eleição inválida");
  return `https://resultados.tse.jus.br/oficial/ele2026/${id}/config/mun-e${id.padStart(6, "0")}-cm.json`;
}
type Obj = Record<string, unknown>;
function obj(v: unknown): Obj {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Estrutura EA20 inválida");
  return v as Obj;
}
function list(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
export function number(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(s)) throw new Error("Número EA20 inválido");
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) throw new Error("Número inválido");
  return n;
}
function pct(v: unknown) {
  const n = number(v);
  if (n !== null && n > 100) throw new Error("Percentual inválido");
  return n;
}
export function normalizeEA20(raw: unknown, uf: string, id = election, city?: string): Result {
  const r = obj(raw);
  if (
    String(r.ele) !== id ||
    String(r.t) !== "2" ||
    r.f !== "o" ||
    String(r.cdabr).toUpperCase() !== (city || uf) ||
    r.tpabr !== (city ? "mu" : uf === "BR" ? "br" : "uf")
  )
    throw new Error("Eleição, fase, turno ou abrangência incompatível");
  if (!["s", "n"].includes(String(r.dv)))
    throw new Error("Regra de divulgação ausente");
  const cargo = list(r.carg)
    .map(obj)
    .find((c) => Number(c.cd) === 1);
  if (!cargo) throw new Error("Cargo presidencial ausente");
  const released = r.dv === "s";
  const s = obj(r.s);
  const e = obj(r.e);
  const v = obj(r.v);
  const candidates: Candidate[] = list(cargo.agr)
    .flatMap((a) => list(obj(a).par))
    .flatMap((p) => {
      const party = obj(p);
      return list(party.cand).map((c) => {
        const cnd = obj(c);
        if (!cnd.n || !cnd.nmu || !party.sg)
          throw new Error("Candidato inválido");
        return {
          number: String(cnd.n),
          name: String(cnd.nmu),
          party: String(party.sg),
          votes: released ? number(cnd.vap) : null,
          percent: released ? pct(cnd.pvap) : null,
          elected: released && cnd.e === "s",
          status: released ? String(cnd.st || "") : "Aguardando divulgação",
          vice: list(cnd.vs).length
            ? String(obj(list(cnd.vs)[0]).nmu || obj(list(cnd.vs)[0]).nm || "")
            : null,
        };
      });
    })
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
  if (new Set(candidates.map((c) => c.number)).size !== candidates.length)
    throw new Error("Candidatos duplicados");
  if (released && candidates.length !== 2)
    throw new Error("Segundo turno sem dois candidatos válidos");
  if (
    !/^\d{2}\/\d{2}\/2026$/.test(String(r.dg)) ||
    !/^\d{2}:\d{2}:\d{2}$/.test(String(r.hg))
  )
    throw new Error("Data da fonte inválida");
  return {
    uf,
    ...(city ? { city } : {}),
    election: id,
    updatedAt: `${r.dg} ${r.hg}`,
    fetchedAt: new Date().toISOString(),
    released,
    final: r.tf === "s",
    progress: released ? pct(s.pst) : null,
    sections: number(s.ts),
    counted: released ? number(s.st) : null,
    valid: released ? number(v.vv) : null,
    blank: released ? number(v.vb) : null,
    nullVotes: released ? number(v.tvn) : null,
    turnout: released ? number(e.c) : null,
    abstention: released ? pct(e.pa) : null,
    candidates,
    source: resultUrl(uf, id, city),
  };
}
export function demoResult(uf = "BR"): Result {
  const i = UFS.indexOf(uf as (typeof UFS)[number]);
  const share = uf === "BR" ? 50.84 : 43 + ((i * 7) % 170) / 10;
  const total = uf === "BR" ? 104268790 : 800000 + i * 139201;
  const votes = Math.round((total * share) / 100);
  return {
    uf,
    election: "DEMO",
    updatedAt: "25/10/2026 19:42:08",
    fetchedAt: new Date().toISOString(),
    released: true,
    final: false,
    progress: uf === "BR" ? 86.72 : 65 + ((i * 13) % 340) / 10,
    sections: 472075,
    counted: 409383,
    valid: total,
    blank: 1128740,
    nullVotes: 2941526,
    turnout: total + 4070266,
    abstention: 20.56,
    candidates: [
      {
        number: "13",
        name: "Lula",
        party: "PT",
        votes,
        percent: share,
        elected: false,
        status: "Dados fictícios",
        vice: null,
      },
      {
        number: "22",
        name: "Flávio Bolsonaro",
        party: "PL",
        votes: total - votes,
        percent: 100 - share,
        elected: false,
        status: "Dados fictícios",
        vice: null,
      },
    ].sort((a, b) => b.votes - a.votes),
    source: "",
  };
}
export const placeholderCandidates: Candidate[] = [
  {
    number: "13",
    name: "Lula",
    party: "PT",
    votes: null,
    percent: null,
    elected: false,
    status: "Referência visual · candidatura não confirmada",
    vice: null,
  },
  {
    number: "22",
    name: "Flávio Bolsonaro",
    party: "PL",
    votes: null,
    percent: null,
    elected: false,
    status: "Referência visual · candidatura não confirmada",
    vice: null,
  },
];

/** Preserve the browser's validated snapshot when a cold server has no cache. */
export function retainLast(
  previous: ApiResponse | undefined,
  next: ApiResponse,
): ApiResponse {
  if (!next.result && previous?.result)
    return {
      ...next,
      status: "stale",
      result: previous.result,
      message:
        "Consulta indisponível. Exibindo a última parcial validada nesta sessão.",
    };
  return next;
}
