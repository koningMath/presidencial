import assert from "node:assert/strict";
import { test } from "node:test";
import audit from "../lib/official-comparison.json";

test("A identidade nacional entre turnos fecha exatamente", () => {
  const one = audit.national_1;
  const two = audit.national_2;
  const lula = two.lula - one.lula;
  const flavio = two.flavio - one.flavio;
  const fromOthers = one.others;
  const increasedTurnout = two.attended - one.attended;
  const decreasedInvalid = one.blank + one.null - two.blank - two.null;
  assert.equal(lula + flavio, fromOthers + increasedTurnout + decreasedInvalid);
  assert.equal(lula + flavio, 14_098_232);
  assert.equal(lula, 10_376_694);
  assert.equal(flavio, 3_721_538);
});

test("Os 28 territórios (27 UFs + exterior) totalizam o Brasil", () => {
  assert.equal(audit.rows.length, 28);
  for (const [round, value] of [[1, audit.national_1], [2, audit.national_2]] as const) {
    const suffix = `_${round}` as const;
    assert.equal(audit.rows.reduce((sum, item) => sum + item[`lula${suffix}`], 0), value.lula);
    assert.equal(audit.rows.reduce((sum, item) => sum + item[`flavio${suffix}`], 0), value.flavio);
  }
});

test("Apenas Minas Gerais troca de líder entre os dois turnos", () => {
  const switches = audit.rows.filter((row) => row.winner1 !== row.winner2);
  assert.deepEqual(switches.map((row) => row.uf), ["MG"]);
  assert.equal(switches[0].margin_2_lula - switches[0].margin_1_lula, 697_925);
});

test("Simulação 100% de comparecimento e 100% de inválidos requer ~60% dos eliminados", () => {
  const needed = (audit.national_change.lula - audit.national_change.attended
    - (audit.national_1.blank + audit.national_1.null - audit.national_2.blank - audit.national_2.null))
    / audit.national_1.others;
  assert.ok(needed > 0.60 && needed < 0.601);
});
