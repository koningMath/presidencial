"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown,
  CircleHelp, Copy, ExternalLink, GitCompareArrows, Info, Menu,
  Search, SlidersHorizontal, X,
} from "lucide-react";
import official from "@/lib/official-comparison.json";
import brazilMap from "@/lib/brazil-map.json";

const Orbit = dynamic(() => import("./investigation-orbit"), { ssr: false });
const integer = new Intl.NumberFormat("pt-BR");
const fixed = (n: number, places = 1) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: places, maximumFractionDigits: places }).format(n);
const format = (n: number) => integer.format(Math.round(n));
const short = (n: number) => `${fixed(Math.abs(n) / 1_000_000, 2)} mi`;

const first = official.national_1;
const second = official.national_2;
const change = official.national_change;
const finalistGrowth = change.lula + change.flavio;
const firstMargin = first.flavio - first.lula;
const secondMargin = second.lula - second.flavio;
const swing = firstMargin + secondMargin;
const lulaGrowthShare = (100 * change.lula) / finalistGrowth;

const names: Record<string, string> = Object.fromEntries(brazilMap.map((s) => [s.uf, s.name]));
names.ZZ = "Exterior";

type Row = (typeof official.rows)[number];
const rows = official.rows as Row[];
const byUF = Object.fromEntries(rows.map((r) => [r.uf, r])) as Record<string, Row>;

const pseudos = [
  { year: "1989", first: "Collor", second: "Collor" },
  { year: "2002", first: "Lula", second: "Lula" },
  { year: "2006", first: "Lula", second: "Lula" },
  { year: "2010", first: "Dilma", second: "Dilma" },
  { year: "2014", first: "Dilma", second: "Dilma" },
  { year: "2018", first: "Bolsonaro", second: "Bolsonaro" },
  { year: "2022", first: "Lula", second: "Lula" },
  { year: "2026", first: "Flávio", second: "Lula", changed: true },
];

function Brand() {
  return (
    <div className="inv-brand" aria-label="Pulso, edição especial análise">
      <span className="inv-signal"><i /><i /><i /><i /></span>
      <span>pulso<span className="inv-brand-period">.</span></span>
      <span className="inv-brand-edition">ANÁLISE DE DADOS<br />ELEIÇÃO 2026</span>
    </div>
  );
}

function Kicker({ children, color = "default" }: { children: React.ReactNode; color?: "default" | "red" | "blue" }) {
  return <span className={`inv-kicker inv-kicker-${color}`}><span className="inv-kicker-dot" />{children}</span>;
}

function Footnote({ children }: { children: React.ReactNode }) {
  return <p className="inv-footnote"><Info size={12} />{children}</p>;
}

function Count({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [shown, setShown] = useState(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { setShown(value); return; }
    let frame = 0;
    const from = shown;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 720);
      setShown(from + (value - from) * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);
  return <span className="inv-tabular">{prefix}{fixed(shown, decimals)}{suffix}</span>;
}

function PercentageBar({ value, tone, label }: { value: number; tone: "red" | "blue" | "gray"; label?: string }) {
  return (
    <div className="inv-bar-wrap" title={`${label || "Participação"}: ${fixed(value, 2)}%`}>
      <motion.div className={`inv-bar inv-bar-${tone}`} initial={false} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ type: "spring", stiffness: 70, damping: 20 }} />
    </div>
  );
}

function RoundRace() {
  const [round, setRound] = useState<1 | 2>(1);
  const isFirst = round === 1;
  const candidates = [
    { name: "FLÁVIO BOLSONARO", party: "PL · 22", votes: isFirst ? first.flavio : second.flavio, percentage: isFirst ? byUF.BR?.flavio_pct_1 ?? 100 * first.flavio / first.valid : 100 * second.flavio / second.valid, tone: "blue" as const, image: "/flavio.jpg" },
    { name: "LULA", party: "PT · 13", votes: isFirst ? first.lula : second.lula, percentage: 100 * (isFirst ? first.lula / first.valid : second.lula / second.valid), tone: "red" as const, image: "/lula-new.webp" },
  ];
  const leader = candidates[0].votes > candidates[1].votes ? candidates[0] : candidates[1];
  return (
    <section className="inv-race-section" id="placar">
      <div className="inv-section-title" data-reveal>
        <div><Kicker>01 / O PLACAR</Kicker><h2>O mesmo eleitorado.<br /><em>Outro resultado.</em></h2></div>
        <p>Toque nos turnos. Veja a dimensão exata do que mudou em apenas quatro semanas.</p>
      </div>
      <div className="inv-round-toolbar">
        <div className="inv-segments" role="group" aria-label="Selecionar turno">
          <button className={isFirst ? "on" : ""} onClick={() => setRound(1)} aria-pressed={isFirst}>1º TURNO <span>04 OUT</span></button>
          <button className={!isFirst ? "on" : ""} onClick={() => setRound(2)} aria-pressed={!isFirst}>2º TURNO <span>25 OUT</span></button>
        </div>
        <span className="inv-small-muted">2026 · PRESIDENTE · BRASIL</span>
      </div>
      <div className="inv-race-grid">
        {candidates.map((candidate) => (
          <motion.article key={candidate.name} layout className={`inv-candidate inv-candidate-${candidate.tone} ${leader.name === candidate.name ? "inv-candidate-leading" : ""}`}>
            <div className="inv-candidate-photo" style={{ backgroundImage: `linear-gradient(180deg, transparent 15%, #0e0e10 100%), url('${candidate.image}')` }} aria-hidden="true" />
            <span className="inv-candidate-id">{candidate.party} <span className="inv-candidate-dot" /></span>
            <div className="inv-candidate-data">
              <span className="inv-candidate-caption">{leader.name === candidate.name ? "MAIOR VOTAÇÃO DO TURNO" : "SEGUNDO COLOCADO"}</span>
              <h3>{candidate.name}</h3>
              <div className="inv-candidate-percent"><Count value={candidate.percentage} decimals={2} suffix="%" /></div>
              <PercentageBar value={candidate.percentage} tone={candidate.tone} />
              <span className="inv-candidate-votes">{format(candidate.votes)} VOTOS</span>
            </div>
          </motion.article>
        ))}
        <div className="inv-race-detail">
          <div className="inv-detail-top"><Kicker>VANTAGEM DO LÍDER</Kicker><GitCompareArrows size={18} /></div>
          <strong className="inv-race-margin">{short(isFirst ? firstMargin : secondMargin)}</strong>
          <p>{isFirst ? "Flávio chega à frente do primeiro turno." : "Lula termina o segundo turno à frente."}</p>
          <div className="inv-race-divider" />
          <span>VOTOS VÁLIDOS</span><strong>{format(isFirst ? first.valid : second.valid)}</strong>
          <span>COMPARECIMENTO</span><strong>{format(isFirst ? first.attended : second.attended)}</strong>
          <span>BRANCOS + NULOS</span><strong>{format(isFirst ? first.blank + first.null : second.blank + second.null)}</strong>
          <div className="inv-turnout-chip"><span className="inv-pulse-dot" />100% DAS SEÇÕES TOTALIZADAS</div>
        </div>
      </div>
      <div className="inv-swing-strip"><span>UMA MUDANÇA DE MARGEM DE</span><strong>{short(swing)}</strong><span>ENTRE OS DOIS TURNOS</span><ArrowRight size={18} /></div>
    </section>
  );
}

function FlowAccounting() {
  return (
    <section className="inv-account-section" id="equacao">
      <div className="inv-section-title" data-reveal>
        <div><Kicker>02 / A EQUAÇÃO</Kicker><h2>De onde saíram<br /><em>14,1 milhões?</em></h2></div>
        <p>Os finalistas somaram 14.098.232 votos a mais no segundo turno. A identidade contábil abaixo fecha exatamente.</p>
      </div>
      <div className="inv-equation-card" data-reveal>
        <div className="inv-equation-label">A ORIGEM DO ACRÉSCIMO LÍQUIDO <span>VOTOS / 1º → 2º TURNO</span></div>
        <div className="inv-flow-sources">
          <div className="inv-source-block inv-source-main" style={{ flex: first.others }}>
            <span>01 / CANDIDATOS ELIMINADOS</span><strong>{short(first.others)}</strong><small>{fixed(100 * first.others / finalistGrowth, 1)}% DA SOMA</small>
          </div>
          <div className="inv-source-block inv-source-medium" style={{ flex: change.attended }}>
            <span>02 / COMPARECIMENTO LÍQUIDO</span><strong>{short(change.attended)}</strong><small>{fixed(100 * change.attended / finalistGrowth, 1)}%</small>
          </div>
          <div className="inv-source-block inv-source-last" style={{ flex: first.blank + first.null - second.blank - second.null }}>
            <span>03 / MENOS VOTOS INVÁLIDOS</span><strong>{short(first.blank + first.null - second.blank - second.null)}</strong><small>{fixed(100 * (first.blank + first.null - second.blank - second.null) / finalistGrowth, 1)}%</small>
          </div>
        </div>
        <div className="inv-equation-equals"><span /><span>IGUAL A</span><span /></div>
        <div className="inv-flow-targets">
          <div className="inv-target inv-target-red" style={{ flex: change.lula }}><span>GANHO LÍQUIDO · LULA</span><strong>+{short(change.lula)}</strong><small>{fixed(lulaGrowthShare, 2)}% DO ACRÉSCIMO DOS FINALISTAS</small></div>
          <div className="inv-target inv-target-blue" style={{ flex: change.flavio }}><span>GANHO LÍQUIDO · FLÁVIO</span><strong>+{short(change.flavio)}</strong><small>{fixed(100 - lulaGrowthShare, 2)}%</small></div>
        </div>
        <div className="inv-formula"><code>9.316.747 + 2.960.239 + 1.821.246 = 10.376.694 + 3.721.538</code><span>14.098.232 = 14.098.232 <Check size={14} /></span></div>
      </div>
      <div className="inv-big-translation" data-reveal>
        <div><Kicker>EM LINGUAGEM DIRETA</Kicker><h3><span>3 em 4</span> votos líquidos adicionais dos dois finalistas foram para Lula.</h3></div>
        <div className="inv-quarters" aria-label="Aproximadamente três quartos dos votos líquidos adicionais ficaram com Lula"><span /><span /><span /><span /></div>
      </div>
      <Footnote>“3 em 4” descreve a distribuição do <strong>ganho líquido de votos dos finalistas</strong>, não uma medição individual de como cada novo eleitor votou. A urna registra totais, não uma trilha de migração entre turnos.</Footnote>
    </section>
  );
}

function ScenarioLab() {
  const [attendShare, setAttendShare] = useState(100);
  const [invalidShare, setInvalidShare] = useState(100);
  const [showMath, setShowMath] = useState(false);
  const expectedFromNew = change.attended * attendShare / 100 + (first.blank + first.null - second.blank - second.null) * invalidShare / 100;
  const neededOther = change.lula - expectedFromNew;
  const neededPct = 100 * neededOther / first.others;
  const remainingFlavio = first.others - neededOther;
  const within = neededPct >= 0 && neededPct <= 100;
  const preset = (a: number, b: number) => { setAttendShare(a); setInvalidShare(b); };
  return (
    <section className="inv-lab-section" id="simulador">
      <div className="inv-section-title" data-reveal>
        <div><Kicker>03 / SIMULADOR DE FLUXOS</Kicker><h2>Faça a conta.<br /><em>Mova as hipóteses.</em></h2></div>
        <p>Escolha quanto do aumento líquido de participação e da redução de votos inválidos você atribui a Lula. O sistema calcula a fatia necessária dos eliminados.</p>
      </div>
      <div className="inv-lab-grid">
        <div className="inv-lab-controls">
          <div className="inv-lab-top"><span className="inv-live-tag"><SlidersHorizontal size={12} /> LABORATÓRIO INTERATIVO</span><button onClick={() => preset(100, 100)} className="inv-reset">REDEFINIR ↺</button></div>
          <label htmlFor="inv-attendance"><span>01. Ganho líquido de comparecimento</span><strong>{attendShare}% <small>→ LULA</small></strong></label>
          <input id="inv-attendance" className="inv-range" type="range" min="0" max="100" step="1" value={attendShare} onChange={(e) => setAttendShare(Number(e.target.value))} style={{ "--range-fill": `${attendShare}%` } as React.CSSProperties} />
          <div className="inv-range-scale"><span>0% PARA LULA</span><span>{short(change.attended)} DE VOTOS</span><span>100%</span></div>
          <label htmlFor="inv-invalid"><span>02. Redução de brancos e nulos</span><strong>{invalidShare}% <small>→ LULA</small></strong></label>
          <input id="inv-invalid" className="inv-range" type="range" min="0" max="100" step="1" value={invalidShare} onChange={(e) => setInvalidShare(Number(e.target.value))} style={{ "--range-fill": `${invalidShare}%` } as React.CSSProperties} />
          <div className="inv-range-scale"><span>0% PARA LULA</span><span>{short(first.blank + first.null - second.blank - second.null)} DE VOTOS</span><span>100%</span></div>
          <div className="inv-presets"><span>TESTE RÁPIDO</span><button onClick={() => preset(100, 100)}>100% / 100%</button><button onClick={() => preset(75, 75)}>75% / 75%</button><button onClick={() => preset(50, 50)}>50% / 50%</button><button onClick={() => preset(0, 0)}>0% / 0%</button></div>
          <button onClick={() => setShowMath((v) => !v)} className="inv-explain-button" aria-expanded={showMath}><CircleHelp size={15} /> COMO O CÁLCULO FUNCIONA <ChevronDown size={15} className={showMath ? "rotated" : ""} /></button>
          <AnimatePresence>{showMath && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="inv-explain-text">Necessidade entre eliminados = [10.376.694 − (2.960.239 × taxa A) − (1.821.246 × taxa B)] ÷ 9.316.747. É um cenário de ganhos líquidos: supõe que não há troca direta de votos entre os dois finalistas nem mudanças compensatórias ocultas.</motion.p>}</AnimatePresence>
        </div>
        <div className="inv-lab-outcome">
          <span className="inv-result-eyebrow">PARA RECONCILIAR O GANHO DE LULA, SERIA NECESSÁRIO...</span>
          <div className="inv-result-number"><Count value={neededPct} decimals={1} suffix="%" /></div>
          <h3>dos votos de candidatos eliminados destinados a Lula.</h3>
          <div className="inv-spectrum"><motion.div animate={{ width: `${Math.min(100, Math.max(0, neededPct))}%` }} transition={{ type: "spring", stiffness: 80, damping: 20 }} /></div>
          <div className="inv-spectrum-labels"><span>LULA · {neededPct < 0 ? "—" : short(neededOther)}</span><span>FLÁVIO · {remainingFlavio < 0 ? "—" : short(remainingFlavio)}</span></div>
          <div className={`inv-model-status ${within ? "inv-model-valid" : "inv-model-warning"}`}><span>{within ? <Check size={15} /> : <Info size={15} />}</span>{within ? "A hipótese fecha a identidade numérica sob essas premissas." : "Essa combinação ultrapassa o universo de votos eliminados. O modelo exigiria outros fluxos, como mudanças diretas entre finalistas."}</div>
          <span className="inv-model-legend">MODELO CONDICIONAL · NÃO É INFERÊNCIA SOBRE ELEITORES IDENTIFICÁVEIS</span>
        </div>
      </div>
      <div className="inv-poll-note"><div><Kicker>O QUE A PESQUISA INDICAVA</Kicker><h3>Transferência declarada<br /><em>não é voto observado.</em></h3></div><p>Na pesquisa Quaest de 21/10, as preferências declaradas entre grupos dos três principais eliminados eram divergentes. Aplicadas literalmente em um cenário sem outras migrações, as taxas não explicariam sozinhas todo o ganho líquido de Lula.</p><a href="#pesquisas">EXAMINAR PESQUISAS <ArrowRight size={15} /></a></div>
    </section>
  );
}

function StateExplorer() {
  const [round, setRound] = useState<1 | 2>(2);
  const [selected, setSelected] = useState("MG");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"swing" | "lula" | "flavio" | "name">("swing");
  const current = byUF[selected] ?? byUF.MG;
  const ordered = useMemo(() => rows.filter((r) => (`${r.uf} ${names[r.uf] || ""}`).toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))).sort((a, b) => {
    if (sort === "name") return (names[a.uf] || "").localeCompare(names[b.uf] || "", "pt-BR");
    if (sort === "lula") return b.lula_gain - a.lula_gain;
    if (sort === "flavio") return b.flavio_gain - a.flavio_gain;
    return (b.margin_2_lula - b.margin_1_lula) - (a.margin_2_lula - a.margin_1_lula);
  }), [search, sort]);
  const l1 = current.lula_1; const l2 = current.lula_2; const f1 = current.flavio_1; const f2 = current.flavio_2;
  const currentSwing = current.margin_2_lula - current.margin_1_lula;
  return (
    <section id="estados" className="inv-states-section">
      <div className="inv-section-title" data-reveal><div><Kicker>04 / O MAPA DA VIRADA</Kicker><h2>27 unidades.<br /><em>Uma virada de estado.</em></h2></div><p>Em Minas Gerais, Flávio liderou no primeiro turno. Lula venceu no segundo. Selecione outras UFs para investigar cada diferença.</p></div>
      <div className="inv-map-grid">
        <div className="inv-map-panel">
          <div className="inv-map-top"><span>BRASIL / VITÓRIA POR UF</span><div className="inv-map-switch" role="group" aria-label="Turno do mapa"><button className={round === 1 ? "on" : ""} onClick={() => setRound(1)}>1º</button><button className={round === 2 ? "on" : ""} onClick={() => setRound(2)}>2º</button></div></div>
          <div className="inv-map-display"><svg viewBox="-25 -12 665 650" role="group" aria-label="Mapa interativo do Brasil com resultados estaduais"><defs><pattern id="inv-map-grid" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".45" fill="#fff" opacity=".12" /></pattern></defs>{brazilMap.map((state) => {
            const item = byUF[state.uf];
            const leader = round === 1 ? item.winner1 : item.winner2;
            return <g key={state.uf} role="button" tabIndex={0} aria-label={`${state.name}, ${leader === "L" ? "Lula" : "Flávio"} à frente`} aria-pressed={selected === state.uf} onClick={() => setSelected(state.uf)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(state.uf); } }} className={`inv-map-uf ${selected === state.uf ? "selected" : ""}`}><path d={state.path} fill={leader === "L" ? "#e86070" : "#5378d4"} /><path d={state.path} fill="url(#inv-map-grid)" /><text x={state.x} y={state.y} textAnchor="middle">{state.uf}</text></g>;
          })}</svg></div>
          <div className="inv-map-legend"><span><i className="red" />LULA</span><span><i className="blue" />FLÁVIO</span><span className="inv-map-hint">SELECIONE UM ESTADO</span></div>
        </div>
        <div className="inv-state-detail" key={selected}>
          <div className="inv-state-header"><span>{current.uf} / {names[current.uf]?.toUpperCase()}</span><span className="inv-state-flag">{current.winner1 !== current.winner2 ? "VIRADA ENTRE TURNOS" : "MESMO LÍDER"}</span></div>
          <h3>{names[current.uf]}</h3><p className="inv-state-sub">Comparação do primeiro com o segundo turno</p>
          <div className="inv-state-score"><span>1º TURNO</span><strong className={current.winner1 === "F" ? "blue" : "red"}>{current.winner1 === "F" ? "FLÁVIO" : "LULA"} À FRENTE</strong><small>{current.margin_1_lula < 0 ? "−" : "+"}{format(Math.abs(current.margin_1_lula))} margem de Lula</small></div>
          <div className="inv-state-score"><span>2º TURNO</span><strong className={current.winner2 === "F" ? "blue" : "red"}>{current.winner2 === "F" ? "FLÁVIO" : "LULA"} À FRENTE</strong><small>{current.margin_2_lula < 0 ? "−" : "+"}{format(Math.abs(current.margin_2_lula))} margem de Lula</small></div>
          <div className="inv-state-swing"><span>MUDANÇA NA MARGEM PARA LULA</span><strong>{currentSwing >= 0 ? "+" : "−"}{format(Math.abs(currentSwing))}</strong></div>
          <div className="inv-state-candidate-rows"><div><span>LULA · GANHO</span><strong className="red">{current.lula_gain >= 0 ? "+" : "−"}{format(Math.abs(current.lula_gain))}</strong></div><div><span>FLÁVIO · GANHO</span><strong className="blue">{current.flavio_gain >= 0 ? "+" : "−"}{format(Math.abs(current.flavio_gain))}</strong></div></div>
          <div className="inv-state-microbar"><span>1º TURNO <b>{format(l1)}</b> LULA <b>{format(f1)}</b> FLÁVIO</span><PercentageBar value={100 * l1 / (l1 + f1)} tone="red" /></div>
          <div className="inv-state-microbar"><span>2º TURNO <b>{format(l2)}</b> LULA <b>{format(f2)}</b> FLÁVIO</span><PercentageBar value={100 * l2 / (l2 + f2)} tone="red" /></div>
        </div>
      </div>
      <div className="inv-state-table-header"><div><Kicker>QUADRO GERAL</Kicker><h3>Todos os estados.<em> Todos os movimentos.</em></h3></div><div className="inv-table-tools"><div className="inv-table-search"><Search size={15} /><input aria-label="Buscar unidade federativa" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar estado ou UF" /></div><select aria-label="Ordenar estados" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="swing">Maior mudança</option><option value="lula">Ganho de Lula</option><option value="flavio">Ganho de Flávio</option><option value="name">Nome A–Z</option></select></div></div>
      <div className="inv-table-scroll"><table className="inv-state-table"><thead><tr><th>UF / LOCAL</th><th>LÍDER 1º</th><th>LÍDER 2º</th><th>GANHO LULA</th><th>GANHO FLÁVIO</th><th>VIRADA DA MARGEM</th><th /></tr></thead><tbody>{ordered.map((r) => <tr key={r.uf} className={selected === r.uf ? "active" : ""} onClick={() => { setSelected(r.uf); document.querySelector(".inv-map-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><td><span className="inv-uf-pill">{r.uf}</span><strong>{names[r.uf]}</strong></td><td><span className={r.winner1 === "L" ? "inv-text-red" : "inv-text-blue"}>● {r.winner1 === "L" ? "LULA" : "FLÁVIO"}</span></td><td><span className={r.winner2 === "L" ? "inv-text-red" : "inv-text-blue"}>● {r.winner2 === "L" ? "LULA" : "FLÁVIO"}</span>{r.winner1 !== r.winner2 && <span className="inv-flip-tag">VIRADA</span>}</td><td>{r.lula_gain >= 0 ? "+" : "−"}{format(Math.abs(r.lula_gain))}</td><td>{r.flavio_gain >= 0 ? "+" : "−"}{format(Math.abs(r.flavio_gain))}</td><td><span className="inv-delta-bar" style={{ width: `${Math.max(4, Math.min(100, Math.abs(r.margin_2_lula - r.margin_1_lula) / 14000))}%`, background: (r.margin_2_lula - r.margin_1_lula) > 0 ? "#ec7181" : "#6d92e9" }} /><span> {r.margin_2_lula - r.margin_1_lula >= 0 ? "+" : "−"}{format(Math.abs(r.margin_2_lula - r.margin_1_lula))}</span></td><td><ArrowUpRight size={14} /></td></tr>)}</tbody></table></div>
      <Footnote>“Margem de Lula” é votos de Lula menos votos de Flávio. A mudança de margem é a diferença entre as duas rodadas. A tabela inclui o eleitorado no exterior (ZZ); o mapa mostra as 27 UFs.</Footnote>
    </section>
  );
}

function HistoryAndPolls() {
  return (
    <section id="historia" className="inv-history-section">
      <div className="inv-section-title" data-reveal><div><Kicker>05 / O PRECEDENTE</Kicker><h2>Sete disputas.<br /><em>Uma quebra de sequência.</em></h2></div><p>Entre os sete segundos turnos presidenciais anteriores, o candidato mais votado na primeira etapa também venceu a última.</p></div>
      <div className="inv-history-hero"><div><span>1989 — 2022</span><strong>7<span>/7</span></strong><p>LÍDERES DO 1º TURNO<br />VENCEDORES DO 2º</p></div><div className="inv-history-hero-2026"><span>2026</span><strong>01</strong><p>REVERSÃO DA LIDERANÇA<br />NACIONAL NESTA SÉRIE</p></div></div>
      <div className="inv-timeline">{pseudos.map((item) => <div key={item.year} className={item.changed ? "inv-historical-flip" : ""}><span>{item.year}</span><i /><strong>{item.first}</strong><ArrowRight size={12} /><strong>{item.second}</strong></div>)}</div>
      <div className="inv-participation-grid"><div className="inv-participation-card"><Kicker>ABSTENÇÃO / 2026</Kicker><strong>−{short(-change.absent)}</strong><span>ELEITORES AUSENTES A MENOS</span><p>O comparecimento aumentou {format(change.attended)} votos entre as etapas.</p></div><div className="inv-participation-card"><Kicker>BRANCOS E NULOS / 2026</Kicker><strong>−{short(first.blank + first.null - second.blank - second.null)}</strong><span>VOTOS INVÁLIDOS A MENOS</span><p>Brancos caíram {format(first.blank - second.blank)}; nulos, {format(first.null - second.null)}.</p></div><div className="inv-participation-card inv-participation-card-history"><Kicker>COMPARAÇÃO / 2022</Kicker><strong>−570 mil</strong><span>ABSTENÇÕES, APROXIMADAMENTE</span><p>A abstenção também recuou entre turnos em 2022; naquele ano, brancos e nulos somados aumentaram cerca de 248 mil.</p></div></div>
      <Footnote>Esta sequência histórica conta apenas pleitos com segundo turno nacional; ela é uma comparação de padrões, não uma regra da legislação ou uma identidade algébrica.</Footnote>
      <div id="pesquisas" className="inv-poll-section"><div className="inv-section-title"><div><Kicker>06 / A LEITURA DAS PESQUISAS</Kicker><h2>O que apontavam<br /><em>antes da votação.</em></h2></div><p>Os levantamentos da reta final e as entrevistas de transferência de voto fornecem parâmetros para testar hipóteses.</p></div>
        <div className="inv-poll-grid"><div className="inv-poll-card"><span>INTENÇÃO DE VOTO VÁLIDO · RETA FINAL</span><div><strong>51<span>%</span></strong><span>FLÁVIO · DATAFOLHA / QUAEST</span></div><div><strong>49<span>%</span></strong><span>LULA · DATAFOLHA / QUAEST</span></div><p>A apuração terminou em 51,79% para Lula e 48,21% para Flávio — uma inversão em relação à estimativa central das duas pesquisas.</p></div><div className="inv-poll-card"><span>QUAEST · MIGRAÇÃO DECLARADA / 21 OUT</span><div className="inv-poll-row"><span>ELEITORES DE CURY</span><strong>48% <small>LULA</small> · 33% <small>FLÁVIO</small></strong></div><div className="inv-poll-row"><span>ELEITORES DE RENAN</span><strong>25% <small>LULA</small> · 51% <small>FLÁVIO</small></strong></div><div className="inv-poll-row"><span>ELEITORES DE CAIADO</span><strong>25% <small>LULA</small> · 51% <small>FLÁVIO</small></strong></div><p>Percentuais de subgrupos da pesquisa, sujeitos a erro amostral maior que o da amostra total.</p></div></div>
        <div className="inv-poll-bottom"><span>O RESULTADO OFICIAL</span><strong>51,79% LULA</strong><span>×</span><strong>48,21% FLÁVIO</strong><span>AMOSTRA ≠ CONTAGEM DE VOTOS</span></div>
        <Footnote>As pesquisas amostram intenções declaradas em momentos específicos. O simulador acima permite investigar o quanto as transferências assumidas teriam de variar; resultados de pesquisas não são entradas da soma oficial.</Footnote>
        <div className="inv-poll-sources">
          <a href="https://www1.folha.uol.com.br/poder/2026/10/datafolha-flavio-bolsonaro-tem-51-dos-votos-validos-e-lula-49-em-empate-tecnico.shtml" target="_blank" rel="noreferrer">DATAFOLHA · 24/10 <ExternalLink size={12} /></a>
          <a href="https://www1.folha.uol.com.br/poder/2026/10/quaest-flavio-bolsonaro-marca-51-dos-votos-validos-e-lula-tem-49-na-vespera-da-eleicao.shtml" target="_blank" rel="noreferrer">QUAEST · 24/10 <ExternalLink size={12} /></a>
          <a href="https://noticias.uol.com.br/ultimas-noticias/agencia-estado/2026/10/21/quaest-48-dos-eleitores-de-augusto-cury-migram-para-lula-e-33-para-flavio.htm" target="_blank" rel="noreferrer">TRANSFERÊNCIA · 21/10 <ExternalLink size={12} /></a>
        </div>
      </div>
    </section>
  );
}

function Sources() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const value = `TSE 2026 | 1º: Flávio ${format(first.flavio)}, Lula ${format(first.lula)}, outros ${format(first.others)}. 2º: Lula ${format(second.lula)}, Flávio ${format(second.flavio)}. Ganhos líquidos: Lula +${format(change.lula)}, Flávio +${format(change.flavio)}; diferença na margem ${format(swing)}. Fontes: https://resultados.tse.jus.br/oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json e https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json`;
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };
  return <section className="inv-sources" id="fontes"><div className="inv-source-close"><Kicker>07 / REPRODUZA A CONTA</Kicker><h2>Os números são públicos.<br /><em>A conta é sua.</em></h2><p>Todos os dados da apuração são reproduzidos a partir dos arquivos oficiais do TSE. Simulações ficam separadas dos resultados observados.</p><div className="inv-source-actions"><a target="_blank" rel="noreferrer" href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6257/uf/br/cargo/1/vis/nominal/resultados">TSE · 1º TURNO <ArrowUpRight size={16} /></a><a target="_blank" rel="noreferrer" href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados">TSE · 2º TURNO <ArrowUpRight size={16} /></a><button onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "COPIADO" : "COPIAR RESUMO"}</button></div></div><div className="inv-source-ledger"><span>REGISTRO DA AUDITORIA / 2026</span><div><span>ARQUIVOS CONFERIDOS</span><strong>56 <small>28 locais × 2 turnos</small></strong></div><div><span>IDENTIDADES CONTÁBEIS</span><strong>100,00%</strong></div><div><span>MUNICÍPIOS E SEÇÕES</span><strong>VERIFICAÇÃO SEPARADA</strong></div><p>O cruzamento oficial por UF e exterior soma exatamente aos totais nacionais. Este painel não contém dados pessoais de eleitores, nem mede trocas individuais de voto.</p></div></section>;
}

export default function Investigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [orbital, setOrbital] = useState(false);
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 20, restDelta: 0.001 });
  useEffect(() => {
    if (reduced) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const update = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((item) => {
        gsap.fromTo(item, { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: "power2.out", scrollTrigger: { trigger: item, start: "top 87%", once: true } });
      });
    }, root);
    return () => { ctx.revert(); gsap.ticker.remove(update); lenis.destroy(); };
  }, [reduced]);
  return <div className="investigation-page" ref={root}>
    <motion.div className="inv-reading-line" style={{ scaleX: progress }} aria-hidden="true" />
    <header className="inv-nav"><a href="/" aria-label="Voltar à apuração do Pulso"><Brand /></a><nav className={menuOpen ? "open" : ""} aria-label="Navegação da análise"><a href="#placar" onClick={() => setMenuOpen(false)}>PLACAR</a><a href="#equacao" onClick={() => setMenuOpen(false)}>A EQUAÇÃO</a><a href="#simulador" onClick={() => setMenuOpen(false)}>SIMULADOR <span>LIVE</span></a><a href="#estados" onClick={() => setMenuOpen(false)}>ESTADOS</a><a href="#historia" onClick={() => setMenuOpen(false)}>HISTÓRIA</a><a href="#fontes" onClick={() => setMenuOpen(false)}>FONTES</a></nav><div className="inv-nav-actions"><a className="inv-return" href="/"><ArrowLeft size={14} /> APURAÇÃO</a><button className="inv-menu-toggle" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div></header>
    <main>
      <section className="inv-hero" id="inicio"><div className="inv-hero-grid" aria-hidden="true" /><div className="inv-hero-top"><Kicker color="red">DOS ARQUIVOS DO TSE / ELEIÇÃO 2026</Kicker><span>EDIÇÃO ESPECIAL — 27.10.2026</span></div><div className="inv-hero-layout"><div className="inv-hero-copy"><p className="inv-hero-serial">PULSO / INVESTIGAÇÃO Nº 01</p><h1>A conta<br />da <em>virada.</em></h1><p className="inv-hero-lead">De uma vantagem de <strong>2,2 milhões</strong> para Flávio a uma vitória de <strong>4,43 milhões</strong> para Lula. O que precisou mudar entre os dois turnos?</p><div className="inv-hero-ctas"><a className="inv-cta-primary" href="#equacao">EXPLORAR OS NÚMEROS <ArrowDown size={15} /></a><a className="inv-cta-text" href="#simulador">TESTAR CENÁRIOS <ArrowUpRight size={15} /></a></div></div><div className="inv-hero-stage"><div className="inv-orbit-container">{!reduced && orbital ? <Orbit /> : <div className="inv-orbit-static" />}</div><span className="inv-orbit-index">Δ / 6.655.156</span><div className="inv-orbit-caption"><span>VARIAÇÃO DA MARGEM</span><strong>+{short(swing)}</strong><span>EM FAVOR DE LULA</span></div><button className="inv-orbit-button" onClick={() => setOrbital(!orbital)}>{orbital ? "PAUSAR VISUAL 3D" : "ATIVAR VISUAL 3D"}</button></div></div><div className="inv-hero-bottom"><div><span>01 / PRIMEIRO TURNO</span><strong>FLÁVIO <b>+{short(firstMargin)}</b></strong></div><div><span>02 / SEGUNDO TURNO</span><strong>LULA <b>+{short(secondMargin)}</b></strong></div><div className="inv-hero-down"><span>ROLE PARA INVESTIGAR</span><ArrowDown size={18} /></div></div></section>
      <div className="inv-marquee" aria-hidden="true"><div>{Array.from({ length: 4 }, (_, i) => <span key={i}>VOTOS OFICIAIS <i /> DIFERENÇA ENTRE TURNOS <i /> SIMULAÇÕES AUDITÁVEIS <i /></span>)}</div></div>
      <RoundRace /><FlowAccounting /><ScenarioLab /><StateExplorer /><HistoryAndPolls /><Sources />
    </main>
    <footer className="inv-footer"><Brand /><span>UMA ANÁLISE INDEPENDENTE SOBRE DADOS PÚBLICOS DO TSE</span><a href="#inicio">VOLTAR AO TOPO ↑</a><span>© PULSO · 2026</span></footer>
  </div>;
}
