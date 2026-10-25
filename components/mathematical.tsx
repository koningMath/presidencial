import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { Result } from "@/lib/results";
import { integer } from "@/lib/utils";

export function MathematicalDecision({result,demo}:{result:Result|null|undefined;demo:boolean}) {
  const elected = result?.released ? result.candidates.find(candidate => candidate.elected) : undefined;
  const closed = result?.released && result.final && result.progress === 100;
  const pending = result?.sections != null && result?.counted != null ? Math.max(0, result.sections - result.counted) : null;
  return <section className="mathematical-section" id="matematica" aria-label="Definição matemática da eleição">
    <div className="math-intro"><span className="small-kicker">LEITURA DA APURAÇÃO</span><h2>Quando a eleição<br/><em>está decidida?</em></h2><p>A confirmação de vitória segue exclusivamente a atribuição de eleito e a totalização oficial do TSE. Nenhuma projeção substitui essa informação.</p></div>
    <div className="math-status">
      <span className="small-kicker"><ShieldCheck size={14}/> IRREVERSIBILIDADE MATEMÁTICA</span>
      <h3>{demo ? "Cenário de demonstração" : elected ? `${elected.name} eleito` : closed ? "Apuração finalizada" : "Ainda não há vencedor oficialmente definido"}</h3>
      <p>{elected && !demo ? "Atribuição de eleito presente no arquivo oficial EA20." : closed && !demo ? "Totalização final registrada pelo TSE." : "A liderança parcial, sozinha, não comprova uma vitória irreversível."}</p>
      <div className="math-data"><div><strong>{pending === null ? "—" : integer(pending)}</strong><span>seções pendentes</span></div><div><strong>{result?.released ? `${result.progress?.toFixed(2).replace(".", ",") ?? "—"}%` : "—"}</strong><span>seções totalizadas</span></div></div>
      {(elected || closed) && !demo && <span className="math-verified"><CheckCircle2 size={15}/> Confirmação no documento oficial do TSE</span>}
    </div>
  </section>;
}
