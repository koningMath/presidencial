"use client";

import { useState } from "react";
import { ArrowUpRight, Calculator, ChartNoAxesCombined, ShieldAlert, Sparkles } from "lucide-react";
import type { Candidate, Result } from "@/lib/results";
import { integer, percent } from "@/lib/utils";

type Props = { result: Result | null | undefined; demo: boolean };
const safeVotes = (candidate: Candidate | undefined) => candidate?.votes ?? 0;

/** Scenario modeling only: assumes the same number of valid votes per remaining section. */
export function AnalysisLab({ result, demo }: Props) {
  const [challengerShare, setChallengerShare] = useState(55);
  const [firstPt, setFirstPt] = useState(0);
  const [firstPl, setFirstPl] = useState(0);
  const progress = result?.progress ?? 0;
  const ready = Boolean(result?.released && progress > 0 && result?.valid && result.candidates.length === 2);
  const [leader, challenger] = result?.candidates ?? [];
  const remainingSections = result?.sections != null && result?.counted != null
    ? Math.max(0, result.sections - result.counted) : null;
  const remainingEstimate = ready
    ? Math.max(0, Math.round((result!.valid! * (100 - progress)) / progress))
    : null;
  const lead = safeVotes(leader) - safeVotes(challenger);
  const threshold = remainingEstimate && remainingEstimate > 0
    ? ((remainingEstimate + lead) / (2 * remainingEstimate)) * 100 : null;
  const challengerProjected = ready && remainingEstimate !== null
    ? safeVotes(challenger) + Math.round(remainingEstimate * challengerShare / 100) : null;
  const leaderProjected = ready && remainingEstimate !== null
    ? safeVotes(leader) + Math.round(remainingEstimate * (100 - challengerShare) / 100) : null;
  const scenarioWinner = challengerProjected !== null && leaderProjected !== null
    ? challengerProjected === leaderProjected ? "Empate no cenário" :
      challengerProjected > leaderProjected ? challenger?.name : leader?.name
    : null;
  const officialFinal = Boolean(result?.final && progress === 100 && result?.released);
  const candidatePT = result?.candidates.find(c => c.number === "13");
  const candidatePL = result?.candidates.find(c => c.number === "22");
  const firstProvided = firstPt > 0 || firstPl > 0;

  return (
    <div className="analysis-lab">
      <div className="view-heading">
        <span className="view-eyebrow">LABORATÓRIO / CENÁRIOS</span>
        <h2>Os números <em>em movimento.</em></h2>
        <p>Explore hipóteses matemáticas. Simulações e modelos não substituem o resultado oficial.</p>
      </div>
      <div className="insight-bento">
        <article className="insight-card irreversibility">
          <div className="insight-top"><Calculator size={18}/><span>01 / IRREVERSIBILIDADE</span></div>
          <h3>O que falta para a virada?</h3>
          <strong className="insight-display">{remainingSections === null ? "—" : integer(remainingSections)}</strong>
          <span className="insight-unit">SEÇÕES AINDA NÃO TOTALIZADAS</span>
          <div className="insight-rule"/>
          <div className="insight-row"><span>Vantagem de votos no momento</span><strong>{ready ? integer(lead) : "—"}</strong></div>
          <div className="insight-row"><span>Votos restantes estimados*</span><strong>{remainingEstimate !== null ? integer(remainingEstimate) : "—"}</strong></div>
          <div className="insight-state"><ShieldAlert size={15}/>{officialFinal ? "Apuração finalizada pelo TSE" : "Irreversibilidade oficial ainda não demonstrável"}</div>
          <p className="insight-footnote">* Projeção ilustrativa pelo ritmo médio de votos válidos por seção. O número real de votos restantes é desconhecido; não é um limite matemático garantido.</p>
        </article>

        <article className="insight-card simulator">
          <div className="insight-top"><ChartNoAxesCombined size={18}/><span>02 / SIMULADOR DE VIRADA</span></div>
          <h3>E se os votos restantes mudarem?</h3>
          <div className="scenario-control">
            <div><span>Votos restantes para quem está atrás</span><strong>{challengerShare}%</strong></div>
            <input type="range" min="0" max="100" step="1" value={challengerShare} onChange={e=>setChallengerShare(Number(e.target.value))} aria-label="Percentual hipotético dos votos restantes para o candidato atrás" />
            <div className="scenario-scale"><span>0%</span><span>50%</span><span>100%</span></div>
          </div>
          <div className="scenario-result">
            <span>RESULTADO HIPOTÉTICO</span>
            <strong>{ready ? scenarioWinner : "Aguardando votos oficiais"}</strong>
            <small>{ready ? `Liderança: ${integer(leaderProjected)} · Reação: ${integer(challengerProjected)} votos` : "A simulação será calculada após a primeira parcial válida."}</small>
          </div>
          <div className="insight-row"><span>Percentual estimado necessário para virar</span><strong>{threshold === null ? "—" : threshold > 100 ? "Mais de 100%" : `${threshold.toFixed(1).replace(".", ",")}%`}</strong></div>
          <p className="insight-footnote">Hipótese simplificada: duas candidaturas e mesma média de votos válidos por seção. Não é previsão eleitoral.</p>
        </article>

        <article className="insight-card certainty">
          <div className="insight-top"><Sparkles size={18}/><span>03 / CERTEZA MATEMÁTICA</span></div>
          <h3>Termômetro de evidência.</h3>
          <strong className="certainty-number">{result?.released ? percent(progress) : "—"}<small>%</small></strong>
          <div className="certainty-meter" role="progressbar" aria-label="Cobertura da apuração oficial" aria-valuemin={0} aria-valuemax={100} aria-valuenow={result?.released ? progress : 0}><span style={{width:`${result?.released ? progress : 0}%`}} /></div>
          <div className="insight-row"><span>Cobertura oficial de seções</span><strong>{result?.released ? `${percent(progress)}%` : "Sem divulgação"}</strong></div>
          <div className="insight-state"><ShieldAlert size={15}/> Probabilidade por ML indisponível</div>
          <p className="insight-footnote">Este indicador mede apenas a cobertura de seções. Uma probabilidade por machine learning exige treinamento, calibração e validação por estado; não seria responsável inventar esse percentual.</p>
        </article>

        <article className="insight-card transition-card">
          <div className="insight-top"><ArrowUpRight size={18}/><span>04 / TRANSIÇÃO ENTRE TURNOS</span></div>
          <h3>Do primeiro ao segundo turno.</h3>
          <p>Insira percentuais do 1º turno para comparar cenários. Os valores inseridos são <b>simulação do usuário</b>, não dados do TSE.</p>
          <div className="transition-grid">
            <label>Lula · 1º turno <input type="number" min="0" max="100" step=".1" value={firstPt || ""} placeholder="%" onChange={e => setFirstPt(Math.min(100,Math.max(0,Number(e.target.value)||0)))}/></label>
            <label>Flávio · 1º turno <input type="number" min="0" max="100" step=".1" value={firstPl || ""} placeholder="%" onChange={e => setFirstPl(Math.min(100,Math.max(0,Number(e.target.value)||0)))}/></label>
          </div>
          <div className="transition-rows">
            {[[candidatePT, firstPt, "#f36a7b"],[candidatePL, firstPl, "#648fff"]].map(([candidate, initial, accent],index) => {
              const c = candidate as Candidate | undefined;
              return <div className="transition-item" key={index}>
                <div><span>{c?.name ?? (index === 0 ? "Lula" : "Flávio Bolsonaro")}</span><small>{firstProvided ? `1º: ${Number(initial).toFixed(1)}% · 2º: ${c?.percent != null ? percent(c.percent)+"%" : "—"}` : "Informe os dados do 1º turno"}</small></div>
                <div className="transition-bar"><span style={{width:`${Number(initial)}%`,background:String(accent),opacity:.38}}/><i style={{width:`${c?.percent ?? 0}%`,background:String(accent)}}/></div>
              </div>;
            })}
          </div>
          <p className="insight-footnote">{demo ? "Modo demonstração: valores do segundo turno são fictícios." : "Segundo turno: fonte TSE quando disponível. Primeiro turno: entrada manual, não validada."}</p>
        </article>
      </div>
    </div>
  );
}
