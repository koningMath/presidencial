"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Database, Minus } from "lucide-react";
import official from "@/lib/official-comparison.json";
import zeros from "@/lib/zero-sections-2026.json";

const one = official.national_1;
const two = official.national_2;
const delta = official.national_change;
const marginOne = one.flavio - one.lula;
const marginTwo = two.lula - two.flavio;
const marginShift = marginOne + marginTwo;
const gained = delta.lula + delta.flavio;
const lulaShare = (delta.lula / gained) * 100;
const otherNeed = delta.lula - (delta.attended + one.blank + one.null - two.blank - two.null) / 2;
const scenarioPercent = 100 * otherNeed / one.others;
const number = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const pct = (value: number, digits = 2) => `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}%`;

const contenders = [
  { key: "flavio" as const, short: "FLÁVIO", name: "Flávio Bolsonaro", label: "PL · 22", photo: "/flavio-uol-2026.jpg", party: "/pl.png", first:one.flavio, second:two.flavio, gain:delta.flavio },
  { key: "lula" as const, short: "LULA", name: "Luiz Inácio Lula da Silva", label: "PT · 13", photo: "/lula-new.webp", party: "/pt.png", first:one.lula, second:two.lula, gain:delta.lula },
];

function Party({ source, name }: { source:string; name:string }) {
  return <span className="pa-party"><Image src={source} alt={`Símbolo do ${name}`} width={23} height={23} /></span>;
}

function CandidatePortrait({ item, index }: { item:typeof contenders[number];index:number }) {
  return <motion.div className={`pa-portrait pa-${item.key}`} initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:.65, delay:.15 + index*.12 }}>
    <div className="pa-portrait-image"><Image src={item.photo} alt={`Retrato de ${item.name}`} fill priority sizes="(max-width: 760px) 46vw, 22vw" /></div>
    <div className="pa-portrait-label"><Party source={item.party} name={item.key === "lula" ? "PT" : "PL"}/><span><b>{item.name}</b><small>{item.label}</small></span></div>
  </motion.div>;
}

function ZeroComparison({ item }: { item:typeof contenders[number] }) {
  const data=zeros[item.key];
  const sign=data.absolute_delta>0?"+":"";
  const opponent=item.key === "flavio" ? "Lula" : "Flávio";
  return <article className={`pa-zero-comparison pa-zero-${item.key}`}>
    <div className="pa-zero-head"><div><Party source={item.party} name={item.key === "lula" ? "PT" : "PL"} /><strong>{item.name}</strong></div><span>0 VOTOS NA SEÇÃO</span></div>
    <div className="pa-zero-values"><div><small>1º TURNO</small><strong>{number(data.first_zero)}</strong><span>seções</span></div><ArrowRight size={27} strokeWidth={1.7}/><div><small>2º TURNO</small><strong>{number(data.second_zero)}</strong><span>seções</span></div></div>
    <div className="pa-zero-comparison-line"><span style={{ width:`${data.first_zero / 106 * 100}%` }} /><span style={{ width:`${data.second_zero / 106 * 100}%` }} /></div>
    <div className="pa-zero-change"><strong>{sign}{number(data.absolute_delta)}</strong><span>{sign}{pct(data.relative_delta_pct)} <small>de variação na quantidade</small></span></div>
    <p>Nas {number(data.second_zero)} seções zeradas do 2º turno, <b>{opponent} recebeu {number(data.opponent_votes_second)} votos.</b></p>
    <div className="pa-zero-rate">Parcela das seções analisadas: {pct(data.first_share_pct,4)} → {pct(data.second_share_pct,4)}</div>
  </article>;
}

export default function InvestigationCompact() {
  return <div className="pulse-audit">
    <header className="pa-nav"><a className="pa-brand" href="/" aria-label="Voltar ao Pulso">▥ <b>pulso<span>.</span></b><small>ANÁLISE / 2026</small></a><nav aria-label="Navegação"><a href="#saldos">VOTOS</a><a href="#zeradas">SEÇÕES ZERO</a><a href="#cenario">O CENÁRIO</a></nav><a className="pa-back" href="/"><ArrowLeft size={14}/> APURAÇÃO</a></header>
    <main>
      <section className="pa-hero" id="topo">
        <div className="pa-hero-copy"><span className="pa-eyebrow"><span className="pa-tiny-dot"/>DADOS DO TSE · 1º × 2º TURNO</span><motion.h1 initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7 }}>A conta<br/>da <em>virada.</em></motion.h1><p>Flávio abriu <b>{number(marginOne)}</b> votos de vantagem. Lula terminou com <b>{number(marginTwo)}</b> de vantagem.</p><div className="pa-swing"><small>MUDANÇA NA MARGEM</small><strong>{number(marginShift)}</strong><span>votos a favor de Lula entre os turnos</span></div><a className="pa-jump" href="#zeradas">VER AS SEÇÕES COM ZERO VOTO <ArrowDownRight size={18}/></a></div>
        <div className="pa-hero-photos"><CandidatePortrait item={contenders[0]} index={0}/><CandidatePortrait item={contenders[1]} index={1}/><div className="pa-hero-rounds"><span>1º TURNO <b>FLÁVIO LIDERA</b></span><ArrowRight size={19}/><span>2º TURNO <b>LULA VENCE</b></span></div></div>
      </section>

      <section className="pa-gains" id="saldos"><span className="pa-eyebrow">01 / VOTOS ADICIONAIS</span><div className="pa-gains-top"><div><h2>De onde veio a <em>diferença?</em></h2><p>Os dois candidatos cresceram. Mas o ganho líquido de Lula foi quase três vezes maior.</p></div><div className="pa-gain-callout"><strong>3 em 4</strong><span>votos líquidos adicionais dos finalistas foram para Lula.</span></div></div><div className="pa-gains-figure"><div className="pa-gains-track"><div className="pa-track-lula" style={{ width:`${lulaShare}%` }} /><div className="pa-track-flavio" style={{ width:`${100-lulaShare}%` }} /></div><div className="pa-gains-legend"><div><span className="pa-key red"/>LULA <b>+{number(delta.lula)}</b><small>{pct(lulaShare)}</small></div><div><span className="pa-key blue"/>FLÁVIO <b>+{number(delta.flavio)}</b><small>{pct(100-lulaShare)}</small></div></div></div></section>

      <section className="pa-zeros" id="zeradas"><div className="pa-section-intro"><div><span className="pa-eyebrow">02 / SEÇÕES ELEITORAIS</span><h2>Quem teve <em>zero voto?</em></h2></div><p>Contagem de seções em que o candidato não recebeu nenhum voto. Mesma regra para os dois turnos e os dois candidatos.</p></div><div className="pa-zero-grid"><ZeroComparison item={contenders[0]}/><ZeroComparison item={contenders[1]}/></div><div className="pa-zero-insight"><Database size={17}/><span>No arquivo por seção do TSE: <b>{number(zeros.sections_first)}</b> seções identificadas no 1º turno e <b>{number(zeros.sections_second)}</b> no 2º. As linhas de zero voto não aparecem no CSV: elas foram identificadas por ausência do candidato em cada seção.</span></div></section>

      <section className="pa-scenario" id="cenario"><div className="pa-scenario-text"><span className="pa-eyebrow">03 / UM CENÁRIO FIXO</span><h2>E os votos<br/>dos <em>eliminados?</em></h2><p>Se metade do aumento de comparecimento e metade da redução de brancos/nulos fossem atribuídos a Lula, quanto ainda precisaria vir dos candidatos eliminados?</p><small>Modelo de saldo líquido, sem troca direta entre finalistas.</small></div><div className="pa-scenario-result"><span>EXIGÊNCIA NESSA HIPÓTESE</span><strong>{pct(scenarioPercent)}</strong><p>dos <b>{number(one.others)}</b> votos dos candidatos eliminados teriam de ir para Lula.</p><div className="pa-scenario-bar"><span style={{ width:`${scenarioPercent}%` }}/></div><div className="pa-scenario-mini">≈ 8,6 em cada 10 votos dos eliminados.</div></div></section>

      <footer className="pa-footer"><div><span className="pa-eyebrow">FONTES E MÉTODO</span><p>Comparações nacionais e seções eleitorais: arquivos oficiais do TSE. Contagem por UF, município, zona, seção e turno; votos positivos de Lula (13) e Flávio (22). Variação percentual = (2º − 1º) ÷ 1º × 100. Percentuais de ganhos líquidos não identificam eleitores individuais.</p></div><div className="pa-links"><a href="https://dadosabertos.tse.jus.br/dataset/resultados-2026" target="_blank" rel="noreferrer">CSV POR SEÇÃO <ArrowUpRight size={14}/></a><a href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6257/uf/br/cargo/1/vis/nominal/resultados" target="_blank" rel="noreferrer">TSE · 1º TURNO <ArrowUpRight size={14}/></a><a href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados" target="_blank" rel="noreferrer">TSE · 2º TURNO <ArrowUpRight size={14}/></a></div><a className="pa-top" href="#topo">VOLTAR AO TOPO ↑</a></footer>
    </main>
  </div>;
}
