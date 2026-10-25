import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEA20, resultUrl, municipalitiesUrl } from "../lib/results";

function fixture(code: string, scope: "br" | "uf" | "mu") {
  return {
    ele: "6258", t: "2", f: "o", cdabr: code, tpabr: scope,
    dv: "s", tf: "n", dg: "25/10/2026", hg: "19:20:30",
    s: { ts: "100", st: "35", pst: "35,00" },
    e: { c: "10000", pa: "20,00" },
    v: { vv: "8000", vb: "150", tvn: "100" },
    carg: [{ cd: "1", agr: [{ par: [{ sg: "PT", cand: [{ n: "13", nmu: "LULA", vap: "4300", pvap: "53,75", e: "n" }] }] },{ par: [{ sg: "PL", cand: [{ n: "22", nmu: "FLAVIO BOLSONARO", vap: "3700", pvap: "46,25", e: "n" }] }] }] }],
  };
}

test("national source uses the published 2026 election identifier", () => {
  assert.equal(resultUrl("BR"), "https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json");
});

test("municipal result path keeps its five-digit code", () => {
  assert.equal(resultUrl("AC", undefined, "01120"), "https://resultados.tse.jus.br/oficial/ele2026/6258/dados/ac/ac01120-c0001-e006258-u.json");
  assert.match(municipalitiesUrl(), /\/config\/mun-e006258-cm\.json$/);
  assert.throws(() => resultUrl("BR", undefined, "01120"));
  assert.throws(() => resultUrl("AC", undefined, "1120"));
});

test("validated municipal EA20 returns candidate votes and section progress", () => {
  const result = normalizeEA20(fixture("01120", "mu"), "AC", undefined, "01120");
  assert.equal(result.uf, "AC");
  assert.equal(result.city, "01120");
  assert.equal(result.progress, 35);
  assert.equal(result.candidates[0].votes, 4300);
  assert.equal(result.candidates[0].percent, 53.75);
  assert.equal(result.final, false);
});

test("rejects mismatched territory, phase and fabricated municipality", () => {
  assert.throws(() => normalizeEA20(fixture("01120", "mu"), "AC", undefined, "01570"));
  assert.throws(() => normalizeEA20(fixture("01120", "mu"), "AC"));
  assert.throws(() => normalizeEA20({ ...fixture("01120", "mu"), t: "1" }, "AC", undefined, "01120"));
});

test("undisclosed votes remain null and never appear as official zero votes", () => {
  const result = normalizeEA20({ ...fixture("BR", "br"), dv: "n" }, "BR");
  assert.equal(result.released, false);
  assert.equal(result.progress, null);
  assert.equal(result.candidates[0].votes, null);
});

test("TSE elected marker is preserved without inventing a probabilistic winner", () => {
  const source = fixture("BR", "br");
  source.carg[0].agr[0].par[0].cand[0].e = "s";
  const result = normalizeEA20(source, "BR");
  assert.equal(result.candidates.find(candidate => candidate.elected)?.number, "13");
});
