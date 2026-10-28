"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Database, MoveRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import official from "@/lib/official-comparison.json";
import history2022 from "@/lib/official-2022-reference.json";
import zeros from "@/lib/zero-sections-2026.json";

const one = official.national_1;
const two = official.national_2;
const delta = official.national_change;
const marginOne = one.flavio - one.lula;
const marginTwo = two.lula - two.flavio;
const marginShift = marginOne + marginTwo;
const gained = delta.lula + delta.flavio;
const lulaShare = (delta.lula / gained) * 100;
const invalidDrop = one.blank + one.null - two.blank - two.null;
const openTotal = one.others + delta.attended + invalidDrop;
const otherNeed = delta.lula - delta.attended - invalidDrop;
const scenarioPercent = 100 * otherNeed / one.others;
const otherFlavio = one.others - otherNeed;
const historicalTurnout = history2022.second.attended - history2022.first.attended;
const historicalInvalidChange = (history2022.second.blank + history2022.second.null) - (history2022.first.blank + history2022.first.null);
const historicalLulaGain = history2022.second.lula - history2022.first.lula;
const slideTotal = 7;
const number = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const pct = (value: number, digits = 2) => `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}%`;

function HundredDots({ value }: { value: number }) {
  const filled = Math.round(value);
  return <div className="pa-hundred-dots" role="img" aria-label={`${pct(value)} de 100 votos líquidos adicionais`}>
    {Array.from({ length: 100 }, (_, index) => <i key={index} className={index < filled ? "is-on" : ""} />)}
  </div>;
}

function TwoTurnPlot() {
  const plotY = (votes: number) => 194 - ((votes - 50_000_000) / 16_000_000) * 155;
  const lulaStart = plotY(one.lula);
  const lulaEnd = plotY(two.lula);
  const flavioStart = plotY(one.flavio);
  const flavioEnd = plotY(two.flavio);

  return <div className="pa-turn-plot-wrap">
    <div className="pa-plot-top"><span>EVOLUÇÃO DOS VOTOS</span><b>1º → 2º TURNO</b></div>
    <svg className="pa-turn-plot" viewBox="0 0 980 230" role="img" aria-label={`Lula: ${number(one.lula)} para ${number(two.lula)}. Flávio: ${number(one.flavio)} para ${number(two.flavio)} votos.`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="pa-lula-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff787e"/><stop offset="1" stopColor="#ff455c"/></linearGradient>
        <linearGradient id="pa-flavio-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4871e8"/><stop offset="1" stopColor="#41b8ff"/></linearGradient>
        <linearGradient id="pa-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff586f" stopOpacity=".14"/><stop offset="1" stopColor="#ff586f" stopOpacity="0"/></linearGradient>
      </defs>
      {[52,105,158,211].map(y => <path key={y} d={`M 24 ${y} H 956`} className="pa-plot-grid"/>)}
      <path d={`M 60 ${lulaStart} L 920 ${lulaEnd} L 920 211 L 60 211 Z`} fill="url(#pa-chart-fill)"/>
      <path d={`M 60 ${flavioStart} L 920 ${flavioEnd}`} stroke="url(#pa-flavio-gradient)" className="pa-plot-line"/>
      <path d={`M 60 ${lulaStart} L 920 ${lulaEnd}`} stroke="url(#pa-lula-gradient)" className="pa-plot-line"/>
      <circle cx="60" cy={flavioStart} r="6" fill="#5f8aff"/><circle cx="920" cy={flavioEnd} r="7" fill="#46b4ff"/>
      <circle cx="60" cy={lulaStart} r="6" fill="#ff787e"/><circle cx="920" cy={lulaEnd} r="7" fill="#ff4c61"/>
      <text x="60" y="225" className="pa-plot-tick" textAnchor="middle">1º TURNO</text>
      <text x="920" y="225" className="pa-plot-tick" textAnchor="middle">2º TURNO</text>
    </svg>
  </div>;
}

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
  const storyRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<ScrollTrigger | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(min-width: 981px) and (prefers-reduced-motion: no-preference)", () => {
      if (!storyRef.current || !railRef.current) return;
      const rail = railRef.current;
      const tween = gsap.to(rail, {
        x: () => -(rail.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: storyRef.current,
          start: "top 76px",
          end: () => `+=${rail.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setActiveSlide(Math.min(slideTotal - 1, Math.round(self.progress * (slideTotal - 1)))),
        },
      });
      pinnedRef.current = tween.scrollTrigger ?? null;
      return () => { pinnedRef.current = null; };
    });
    return () => media.revert();
  }, []);

  const jumpTo = (event: React.MouseEvent<HTMLAnchorElement>, slide: number) => {
    const trigger = pinnedRef.current;
    event.preventDefault();
    if (trigger) {
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * (slide / (slideTotal - 1)), behavior: "smooth" });
    } else {
      const target = storyRef.current?.querySelectorAll<HTMLElement>(".pa-slide")[slide];
      target?.scrollIntoView({ block: "nearest", inline: "start", behavior: "smooth" });
    }
  };

  return <div className="pulse-audit">
    <header className="pa-nav"><a className="pa-brand" href="/" aria-label="Voltar ao Pulso">▥ <b>pulso<span>.</span></b><small>ANÁLISE / 2026</small></a><nav aria-label="Navegação"><a href="#saldos" onClick={e => jumpTo(e, 1)}>VOTOS</a><a href="#zeradas" onClick={e => jumpTo(e, 2)}>SEÇÕES ZERO</a><a href="#abertos" onClick={e => jumpTo(e, 3)}>2022 × 2026</a><a href="#cenario" onClick={e => jumpTo(e, 4)}>O CENÁRIO</a></nav><a className="pa-back" href="/"><ArrowLeft size={14}/> APURAÇÃO</a></header>
    <main>
      <section ref={storyRef} className="pa-story" aria-label="Relatório eleitoral em painéis horizontais">
        <div className="pa-story-progress" aria-label={`Painel ${activeSlide + 1} de ${slideTotal}`}>
          <span>{String(activeSlide + 1).padStart(2, "0")} <i>/</i> 0{slideTotal}</span>
          <div className="pa-story-dashes">{Array.from({ length: slideTotal }, (_, i) => <span key={i} className={i <= activeSlide ? "on" : ""} />)}</div>
          <span className="pa-scroll-hint">AVANCE PARA A DIREITA <MoveRight size={16}/></span>
        </div>
        <div ref={railRef} className="pa-story-rail">
          <section className="pa-hero pa-slide" id="topo">
            <div className="pa-hero-copy">
              <span className="pa-eyebrow"><span className="pa-tiny-dot"/>DADOS DO TSE · 1º × 2º TURNO</span>
              <motion.h1 initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7 }}>A conta<br/>da <em>virada.</em></motion.h1>
              <p>Flávio abriu <b>{number(marginOne)}</b> votos de vantagem. Lula terminou com <b>{number(marginTwo)}</b> votos de vantagem.</p>
              <div className="pa-swing"><small>MUDANÇA NA MARGEM</small><strong>{number(marginShift)}</strong><span>votos a favor de Lula entre os turnos</span></div>
              <a className="pa-jump" href="#saldos" onClick={e => jumpTo(e, 1)}>EXPLORE OS NÚMEROS <MoveRight size={18}/></a>
            </div>
            <div className="pa-hero-photos"><CandidatePortrait item={contenders[0]} index={0}/><CandidatePortrait item={contenders[1]} index={1}/><div className="pa-hero-rounds"><span>1º TURNO <b>FLÁVIO LIDERA</b></span><ArrowRight size={19}/><span>2º TURNO <b>LULA VENCE</b></span></div></div>
          </section>

          <section className="pa-gains pa-slide" id="saldos">
            <span className="pa-eyebrow">01 / VOTOS ADICIONAIS</span>
            <div className="pa-gains-top"><div><h2>O salto dos <em>finalistas.</em></h2><p>De todos os votos líquidos adicionais dos dois finalistas, quase três quartos ficaram com Lula.</p></div><div className="pa-gain-callout"><strong>3 em 4</strong><span>votos líquidos adicionais dos finalistas foram para Lula.</span></div></div>
            <div className="pa-gains-visual"><TwoTurnPlot/><div className="pa-gains-matrix"><span>VOTOS LÍQUIDOS ADICIONAIS</span><strong>{pct(lulaShare)}</strong><HundredDots value={lulaShare}/><small>dos ganhos de ambos os finalistas ficaram com Lula</small></div></div>
            <div className="pa-gains-figure"><div className="pa-gains-track"><div className="pa-track-lula" style={{ width:`${lulaShare}%` }}/><div className="pa-track-flavio" style={{ width:`${100-lulaShare}%` }}/></div><div className="pa-gains-legend"><div><span className="pa-key red"/>LULA <b>+{number(delta.lula)}</b><small>{pct(lulaShare)}</small></div><div><span className="pa-key blue"/>FLÁVIO <b>+{number(delta.flavio)}</b><small>{pct(100-lulaShare)}</small></div></div></div>
            <div className="pa-secondary-note">TOTAL DOS GANHOS LÍQUIDOS: <strong>{number(gained)} votos</strong></div>
          </section>

          <section className="pa-zeros pa-slide" id="zeradas"><div className="pa-section-intro"><div><span className="pa-eyebrow">02 / SEÇÕES ELEITORAIS</span><h2>Quem teve <em>zero voto?</em></h2></div><p>Seções em que um dos candidatos não recebeu nenhum voto, pelo mesmo critério nos dois turnos.</p></div><div className="pa-zero-grid"><ZeroComparison item={contenders[0]}/><ZeroComparison item={contenders[1]}/></div><div className="pa-zero-insight"><Database size={17}/><span>Universo analisado no CSV do TSE: <b>{number(zeros.sections_first)}</b> seções no 1º turno e <b>{number(zeros.sections_second)}</b> no 2º. Ausência de registro positivo equivale a zero voto.</span></div></section>

          <section className="pa-open pa-slide" id="abertos">
            <span className="pa-eyebrow">03 / O QUE FICOU EM ABERTO</span>
            <div className="pa-open-head"><h2>Três grupos.<br/><em>Uma conta.</em></h2><div><small>VOTOS LÍQUIDOS A REDISTRIBUIR</small><strong>{number(openTotal)}</strong><span>entre os dois finalistas</span></div></div>
            <div className="pa-open-trackbar"><span style={{width:`${one.others/openTotal*100}%`}}/><span style={{width:`${delta.attended/openTotal*100}%`}}/><span style={{width:`${invalidDrop/openTotal*100}%`}}/></div>
            <div className="pa-open-groups">
              <div className="pa-group-violet"><span className="pa-dot violet"/>VOTOS DOS ELIMINADOS <strong>{number(one.others)}</strong><small>{pct(one.others/openTotal*100)} do total</small><div className="pa-group-column"><i style={{height:`${one.others/openTotal*100}%`}}/></div></div>
              <div className="pa-group-forest"><span className="pa-dot forest"/>MENOS ABSTENÇÃO <strong>+{number(delta.attended)}</strong><small>{pct(delta.attended/openTotal*100)} do total</small><div className="pa-group-column"><i style={{height:`${delta.attended/openTotal*100}%`}}/></div></div>
              <div className="pa-group-amber"><span className="pa-dot amber"/>MENOS BRANCOS/NULOS <strong>+{number(invalidDrop)}</strong><small>{pct(invalidDrop/openTotal*100)} do total</small><div className="pa-group-column"><i style={{height:`${invalidDrop/openTotal*100}%`}}/></div></div>
            </div>
            <div className="pa-history"><div className="pa-history-title"><span>COMPARAÇÃO HISTÓRICA</span><b>2022 <ArrowRight size={15}/> 2026</b></div><div className="pa-history-row"><span>Aumento de comparecimento</span><b>+{number(historicalTurnout)}</b><strong>+{number(delta.attended)}</strong><em>5,19×</em></div><div className="pa-history-row"><span>Variação de brancos/nulos</span><b>+{number(historicalInvalidChange)}</b><strong>−{number(invalidDrop)}</strong><em>inverteu</em></div><div className="pa-history-row"><span>Ganho líquido de Lula</span><b>+{number(historicalLulaGain)}</b><strong>+{number(delta.lula)}</strong><em>3,36×</em></div></div>
          </section>

          <section className="pa-scenario pa-slide" id="cenario">
            <div className="pa-scenario-text"><span className="pa-eyebrow">03 / UM ÚNICO CENÁRIO FIXO</span><h2>100%.<br/>100%.<br/><em>60,06%.</em></h2><p>O que acontece se todo o aumento líquido de comparecimento e toda a redução de brancos/nulos forem para Lula?</p><small>Hipótese contábil extrema, com votos dos finalistas do primeiro turno preservados.</small></div>
            <div className="pa-waterfall"><div className="pa-waterfall-head"><span>MONTANDO O GANHO DE LULA</span><strong>+{number(delta.lula)}</strong></div>
              <div className="pa-waterfall-row"><span><b>100%</b><small>do comparecimento adicional</small></span><strong>+{number(delta.attended)}</strong><i style={{width:`${delta.attended/delta.lula*100}%`}}/></div>
              <div className="pa-waterfall-row"><span><b>100%</b><small>da redução de brancos/nulos</small></span><strong>+{number(invalidDrop)}</strong><i style={{width:`${invalidDrop/delta.lula*100}%`}}/></div>
              <div className="pa-waterfall-row"><span><b>{pct(scenarioPercent)}</b><small>dos votos dos eliminados</small></span><strong>+{number(otherNeed)}</strong><i style={{width:`${otherNeed/delta.lula*100}%`}}/></div>
              <div className="pa-waterfall-total"><span>SOMA EXATA</span><b>+{number(delta.lula)}</b></div>
              <p>Os outros <b>{number(otherFlavio)}</b> votos dos eliminados compõem, nessa hipótese, o crescimento líquido de Flávio.</p>
            </div>
          </section>

          <section className="pa-close pa-slide" id="videos">
            <span className="pa-eyebrow">04 / AS DISCUSSÕES EM VÍDEO</span><h2>Questione tudo.<br/><em>Exija o método.</em></h2>
            <div className="pa-voices"><div><span>MARCELO TRINDADE · ALEGAÇÃO EM VÍDEO</span><blockquote>“Tenho a certeza de que fomos roubados em 2022.”</blockquote><p>O vídeo apresentado pelo usuário atribui a Trindade a tese de um padrão artificial na ordem de totalização. Essa é a conclusão do autor do vídeo.</p></div><div><span>J. ALEX HALDERMAN · PESQUISA NOS EUA</span><blockquote>Uma máquina de votação de teste foi manipulada para produzir um resultado diferente dos votos lançados.</blockquote><p>Halderman demonstrou uma vulnerabilidade em equipamento norte-americano num teste controlado, conforme seu depoimento público. <a href="https://nsarchive.gwu.edu/media/19980/ocr" target="_blank" rel="noreferrer">Ver o depoimento <ArrowUpRight size={13}/></a></p></div></div>
            <div className="pa-closer">Uma auditoria convincente começa com dados reproduzíveis, premissas visíveis e contas que qualquer pessoa pode conferir.</div>
          </section>

          <footer className="pa-footer pa-slide" id="fontes">
            <div className="pa-sources-wrap"><span className="pa-eyebrow">05 / FONTES PRIMÁRIAS</span><h2>Confira cada <em>número.</em></h2><p>Os saldos são diferenças entre totalizações agregadas, não rastreamento de eleitores. O cenário de 100% é uma hipótese fixa, não uma medição direta de transferência de votos. Percentual de variação das seções zeradas = (2º − 1º) ÷ 1º × 100.</p><div className="pa-links"><a href="https://dadosabertos.tse.jus.br/dataset/resultados-2026" target="_blank" rel="noreferrer">TSE · ARQUIVO NACIONAL POR SEÇÃO <ArrowUpRight size={15}/></a><a href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6257/uf/br/cargo/1/vis/nominal/resultados" target="_blank" rel="noreferrer">TSE · RESULTADOS 2026 · 1º TURNO <ArrowUpRight size={15}/></a><a href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados" target="_blank" rel="noreferrer">TSE · RESULTADOS 2026 · 2º TURNO <ArrowUpRight size={15}/></a><a href={history2022.source_first} target="_blank" rel="noreferrer">TSE · TOTALIZAÇÃO 2022 · 1º TURNO <ArrowUpRight size={15}/></a><a href={history2022.source_second} target="_blank" rel="noreferrer">TSE · TOTALIZAÇÃO 2022 · 2º TURNO <ArrowUpRight size={15}/></a></div><a className="pa-top" href="#topo" onClick={e => jumpTo(e, 0)}>← VOLTAR AO INÍCIO</a></div>
          </footer>
        </div>
      </section>
    </main>
  </div>;
}
