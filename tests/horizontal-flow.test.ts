import test from "node:test";
import assert from "node:assert/strict";
import current from "../lib/official-comparison.json" with { type: "json" };
import previous from "../lib/official-2022-reference.json" with { type: "json" };

test("o cenário fixo fecha 100% dos votos líquidos adicionais", () => {
  const a = current.national_1;
  const b = current.national_2;
  const gain = current.national_change;
  const fewerInvalid = a.blank + a.null - b.blank - b.null;
  const fromEliminated = gain.lula - gain.attended - fewerInvalid;
  assert.equal(fewerInvalid, 1_821_246);
  assert.equal(fromEliminated, 5_595_209);
  assert.equal(fromEliminated + gain.attended + fewerInvalid, gain.lula);
  assert.equal(a.others - fromEliminated, gain.flavio);
  assert.ok(Math.abs(fromEliminated / a.others * 100 - 60.0553927245207) < 0.000001);
});

test("comparação 2022 usa totais internamente consistentes do TSE", () => {
  const { first, second } = previous;
  assert.equal(first.valid + first.blank + first.null, first.attended);
  assert.equal(second.valid + second.blank + second.null, second.attended);
  assert.equal(second.lula + second.bolsonaro, second.valid);
  assert.equal(second.attended - first.attended, 570_424);
  assert.equal(second.blank + second.null - first.blank - first.null, 247_790);
  assert.equal(second.lula - first.lula, 3_086_495);
});
