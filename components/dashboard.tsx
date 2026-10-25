"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Expand,
  Globe2,
  Info,
  Layers3,
  MapPin,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Vote,
  X,
} from "lucide-react";
import {
  demoResult,
  placeholderCandidates,
  retainLast,
  type ApiResponse,
  type Candidate,
  type Result,
} from "@/lib/results";
import { integer, percent, cn } from "@/lib/utils";
import states from "@/lib/brazil-map.json";
import { InfoDialog } from "./dialog";
import { MathematicalDecision } from "./mathematical";
import { MunicipalityExplorer } from "./municipalities";
import { AnimatedMetric } from "./animated-metric";
const PHOTO: Record<string, string> = {
  "13": "/lula-new.webp",
  "22": "/flavio.jpg",
};
const LOGO: Record<string, string> = { "13": "/pt.png", "22": "/pl.png" };
const SELECTED_REFRESH_MS = 15000;
const MAP_REFRESH_MS = 60000;
function color(c?: Candidate) {
  return c?.number === "13"
    ? "#db5361"
    : c?.number === "22"
      ? "#4274db"
      : "#8c9aae";
}
function Photo({ candidate }: { candidate: Candidate }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="portrait"
      style={{
        background: `linear-gradient(145deg,${color(candidate)}44,${color(candidate)}12)`,
      }}
    >
      {!failed && PHOTO[candidate.number] ? (
        <img
          src={PHOTO[candidate.number]}
          alt={candidate.name}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>
          {candidate.name
            .split(" ")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")}
        </span>
      )}
      <i style={{ background: color(candidate) }}>{candidate.number}</i>
    </div>
  );
}
function PartyLogo({ candidate }: { candidate: Candidate }) {
  const [failed, setFailed] = useState(false);
  return LOGO[candidate.number] && !failed ? (
    <img
      className="party-logo"
      src={LOGO[candidate.number]}
      alt={`Símbolo ${candidate.party}`}
      onError={() => setFailed(true)}
    />
  ) : null;
}
function CandidateSpotlight({ candidate, side, demo, available }: {
  candidate: Candidate;
  side: "left" | "right";
  demo: boolean;
  available: boolean;
}) {
  return (
    <article
      className={cn("candidate-spotlight", side)}
      style={{ "--candidate-color": color(candidate) } as React.CSSProperties}
      aria-label={`Candidato ${candidate.name}`}
    >
      <div className="spotlight-top">
        <span className="spotlight-party"><span className="spotlight-party-logo"><PartyLogo candidate={candidate}/></span>{candidate.party} / {candidate.number}</span>
        <span className="spotlight-ranking">PRESIDÊNCIA · 2026</span>
      </div>
      <div className="spotlight-portrait" aria-hidden="true">
        {PHOTO[candidate.number] && <img src={PHOTO[candidate.number]} alt="" />}
      </div>
      <div className="spotlight-content">
        <span className="spotlight-label">{demo ? "CENÁRIO FICTÍCIO" : available ? "PARCIAL OFICIAL" : "AGUARDANDO DADOS"}</span>
        <h2>{candidate.name}</h2>
        <div className="spotlight-percentage"><AnimatedMetric value={candidate.percent} decimals={2}/><small>%</small></div>
        <div className="spotlight-track"><span style={{ width: `${candidate.percent ?? 0}%` }} /></div>
        <div className="spotlight-votes"><span>VOTOS VÁLIDOS</span><strong><AnimatedMetric value={candidate.votes}/></strong></div>
      </div>
    </article>
  );
}
export default function Dashboard() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const readingProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.35,
  });
  const demo = false;
  const [uf, setUf] = useState("BR");
  const [data, setData] = useState<Record<string, ApiResponse>>({});
  const [history, setHistory] = useState<Record<string, Result[]>>({});
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"leader" | "progress">("leader");
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [seconds, setSeconds] = useState(15);
  const [expanded, setExpanded] = useState(false);
  const [relief, setRelief] = useState(false);
  const last = useRef<Record<string, number>>({});
  const inFlight = useRef(new Set<string>());
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initial = params.get("uf")?.toUpperCase();
    if (
      initial &&
      (initial === "BR" ||
        initial === "ZZ" ||
        states.some((s) => s.uf === initial))
    )
      setUf(initial);
  }, []);
  useEffect(() => {
    if (reduced) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    let raf: number;
    function frame(time: number) {
      lenis.raf(time);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const ctx = gsap.context(
      () =>
        gsap.from(".reveal", {
          y: 20,
          duration: 0.7,
          stagger: 0.08,
          scrollTrigger: { trigger: ".details-section", start: "top 92%" },
        }),
      container,
    );
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      ctx.revert();
    };
  }, [reduced]);
  const refresh = useCallback(async (target: string, foreground = false) => {
    if (
      inFlight.current.has(target) ||
      Date.now() - (last.current[target] || 0) < SELECTED_REFRESH_MS
    )
      return;
    inFlight.current.add(target);
    last.current[target] = Date.now();
    if (foreground) { setLoading(true); setSeconds(15); }
    try {
      const res = await fetch(`/api/results?uf=${target}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error("HTTP");
      const payload: ApiResponse = await res.json();
      setData((d) => ({ ...d, [target]: retainLast(d[target], payload) }));
      if (
        payload.result?.released &&
        (payload.result.counted || 0) > 0 &&
        payload.status === "live"
      )
        setHistory((h) => {
          const items = h[target] || [];
          if (items.at(-1)?.updatedAt === payload.result!.updatedAt) return h;
          return { ...h, [target]: [...items, payload.result!].slice(-120) };
        });
    } catch {
      setData((d) => ({
        ...d,
        [target]: {
          status: d[target]?.result ? "stale" : "unavailable",
          result: d[target]?.result || null,
          message:
            "Conexão indisponível. Tentaremos novamente na próxima atualização.",
          checkedAt: new Date().toISOString(),
        },
      }));
    } finally {
      inFlight.current.delete(target);
      if (foreground) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (demo || paused) return;
    void refresh(uf, true);
    const tick = setInterval(() => {
      if (!document.hidden) {
        setSeconds(
          Math.max(
            0,
            15 - Math.floor((Date.now() - (last.current[uf] || 0)) / 1000),
          ),
        );
        void refresh(uf, true);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [demo, uf, paused, refresh]);
  useEffect(() => {
    if (demo || paused) return;
    let cancelled = false;
    let active = false;
    const updateMap = async () => {
      if (active || document.hidden) return;
      active = true;
      const queue = states.map((s) => s.uf);
      await Promise.all(
        Array.from({ length: 3 }, async () => {
          while (queue.length && !cancelled) {
            const code = queue.shift();
            if (code) await refresh(code);
          }
        }),
      );
      active = false;
    };
    void updateMap();
    const timer = setInterval(() => void updateMap(), MAP_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [demo, paused, refresh]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const select = (next: string) => {
    setUf(next);
    const u = new URL(location.href);
    next === "BR"
      ? u.searchParams.delete("uf")
      : u.searchParams.set("uf", next);
    window.history.replaceState(null, "", u);
  };
  const response = data[uf];
  const result = demo ? demoResult(uf) : response?.result;
  const candidates = result?.candidates.length
    ? result.candidates
    : placeholderCandidates;
  const locationName =
    uf === "BR"
      ? "Brasil"
      : uf === "ZZ"
        ? "Exterior"
        : states.find((s) => s.uf === uf)?.name || uf;
  const available = !!result?.released;
  const historyItems = history[uf] || [];
  const chartValues = historyItems.flatMap((r) =>
    r.candidates.map((c) => c.percent ?? 50),
  );
  const chartMin = demo
    ? 40
    : Math.max(0, Math.floor(Math.min(50, ...chartValues) / 5) * 5 - 5);
  const chartMax = demo
    ? 60
    : Math.min(100, Math.ceil(Math.max(50, ...chartValues) / 5) * 5 + 5);
  const stateResult = (code: string) =>
    demo ? demoResult(code) : data[code]?.result;
  const stateColor = (code: string) => {
    const r = stateResult(code);
    if (!r?.released || r.candidates[0]?.votes === r.candidates[1]?.votes)
      return "#292b30";
    return tab === "progress"
      ? `hsl(211 42% ${23 + (r.progress || 0) * 0.24}%)`
      : color(r.candidates[0]);
  };
  const stateHasVotes = (code: string) =>
    stateResult(code)?.candidates.some((candidate) => (candidate.votes || 0) > 0) ?? false;
  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setToast("Link copiado para compartilhar.");
    } catch {
      setToast("Não foi possível copiar. Compartilhe o endereço do navegador.");
    }
  };
  const download = () => {
    if (!result) return;
    const safe = (s: unknown) =>
      '"' +
      String(s ?? "")
        .replace(/^[=+\-@]/, "'")
        .replace(/"/g, '""') +
      '"';
    const lines = [
      [
        "modo",
        "abrangencia",
        "atualizacao",
        "candidato",
        "partido",
        "numero",
        "votos",
        "percentual",
        "fonte",
      ],
      ...result.candidates.map((c) => [
        demo ? "DEMONSTRACAO FICTICIA" : response?.status,
        uf,
        result.updatedAt,
        c.name,
        c.party,
        c.number,
        c.votes,
        c.percent,
        result.source,
      ]),
    ];
    const blob = new Blob(
      ["\ufeff" + lines.map((row) => row.map(safe).join(";")).join("\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulso-${demo ? "DEMO-" : ""}${uf.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const difference =
    available && candidates.length === 2
      ? Math.abs((candidates[0].percent || 0) - (candidates[1].percent || 0))
      : null;
  return (
    <div ref={container} className="app-shell">
      <motion.div className="reading-progress" style={{ scaleX: readingProgress }} aria-hidden="true" />
      <a className="skip-link" href="#apuracao">
        Ir para os resultados
      </a>
      <header className="site-header">
        <a href="/" className="brand" aria-label="Pulso início">
          <span className="brand-symbol">
            <i />
            <i />
            <i />
            <i />
          </span>
          pulso<span className="brand-dot">.</span>
          <span className="brand-edition">
            ELEIÇÕES GERAIS
            <br />
            2026
          </span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#apuracao" className="nav-active">Apuração <span>AO VIVO</span></a>
          <a href="#matematica">Matemática</a>
          <a href="#estados">Por estado</a>
          <button onClick={() => setInfo(true)}>
            Entenda os dados <ArrowUpRight size={13} />
          </button>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button share-header"
            aria-label="Compartilhar página"
            onClick={share}
          >
            <Share2 size={17} />
          </button>
        </div>
      </header>
      <main id="apuracao">
        <div className="experience-view">
        <section className="edition-heading" aria-labelledby="edition-title">
          <div className="edition-identity">
            <div className="edition-kicker">
              <span className="edition-live-point" />
              ELEIÇÕES BRASILEIRAS
              <span className="edition-kicker-divider" />
              2º TURNO · 2026
            </div>
            <h1 id="edition-title">
              Apuração <span>presidencial.</span>
            </h1>
          </div>
          <div className="edition-context">
            <span className="edition-context-label">DADOS PÚBLICOS / BRASIL</span>
            <p>
              Uma leitura clara dos resultados oficiais.
              Do país inteiro até cada estado.
            </p>
            <a href="#resultados">
              Explorar resultados <ArrowUpRight size={15} />
            </a>
          </div>
        </section>
        {response?.status === "stale" ? (
          <div className="status-banner warning" role="status">
            <span>
              <Info size={15} />
              Última parcial preservada. A conexão com o TSE está indisponível.
            </span>
          </div>
        ) : (
          <div className="status-banner" role="status">
            <span>
              <span className={cn("status-dot", available && "live")} />
              <strong>
                {available
                  ? result?.counted === 0
                    ? "Aguardando início da apuração"
                    : "Fonte oficial conectada"
                  : loading
                    ? "Consultando o TSE"
                    : "Aguardando dados oficiais"}
              </strong>
              <span>
                {available
                  ? "Resultados sujeitos às atualizações da Justiça Eleitoral."
                  : response?.message ||
                    "Somente resultados validados serão exibidos."}
              </span>
            </span>
            <button onClick={() => setInfo(true)}>
              Nossa metodologia <ArrowUpRight size={14} />
            </button>
          </div>
        )}
        <div id="resultados" className="workspace-toolbar">
          <div className="scope-tabs">
            <button className="selected" onClick={() => select("BR")}>
              <Globe2 size={15} /> Presidência <span>2º TURNO</span>
            </button>
          </div>
          <div className="toolbar-actions">
            <span className="source-label">
              <ShieldCheck size={14} /> {demo ? "Dados fictícios" : "Fonte: TSE"}
            </span>
            <button
              className="icon-button"
              aria-label="Baixar resultados em CSV"
              disabled={!available}
              onClick={download}
            >
              <ArrowDownToLine size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Sobre os dados"
              onClick={() => setInfo(true)}
            >
              <Info size={16} />
            </button>
          </div>
        </div>
        <section className={cn("dashboard-grid", expanded && "map-expanded")}>
          <CandidateSpotlight candidate={candidates.find(c => c.number === "13") ?? placeholderCandidates[0]} side="left" demo={demo} available={available}/>
          <aside className="results-sidebar">
            <div className="results-panel">
              <div className="panel-heading">
                <span>
                  <MapPin size={14} /> {locationName}
                </span>
                <span className="small-tag">
                  {uf === "BR" ? "NACIONAL" : uf}
                </span>
              </div>
              <div className="race-heading">
                <h2>
                  A escolha de
                  <br />
                  <span>um país inteiro.</span>
                </h2>
                <span className="round-number">02</span>
              </div>
              <div className="progress-heading">
                <span>Seções totalizadas</span>
                <strong>
                  <AnimatedMetric value={result?.progress} decimals={2}/>
                  <small>%</small>
                </strong>
              </div>
              <div className="progress-track">
                <motion.div
                  animate={{ width: `${result?.progress || 0}%` }}
                  transition={{ duration: reduced ? 0 : 0.8 }}
                />
              </div>
              <div className="sections-meta">
                <AnimatedMetric value={result?.counted}/> de {integer(result?.sections)} seções
              </div>
              <div className="candidates">
                {candidates.map((c, i) => (
                  <motion.article
                    layout={!reduced}
                    key={c.number}
                    className="candidate-card"
                    style={
                      { "--candidate-color": color(c) } as React.CSSProperties
                    }
                  >
                    <div className="candidate-top">
                      <Photo candidate={c} />
                      <div>
                        <span className="party">
                          <PartyLogo candidate={c} />
                          {c.party} <span>· {c.number}</span>
                        </span>
                        <h3>
                          {c.name
                            .toLowerCase()
                            .replace(/(^|\s)\S/g, (letter) =>
                              letter.toUpperCase(),
                            )}
                        </h3>
                        {c.elected ? (
                          <span className="elected">
                            <Check size={11} /> Eleito pelo TSE
                          </span>
                        ) : (
                          <span className="candidate-status">
                            {!available
                              ? "Referência visual"
                              : demo
                                ? "Cenário fictício"
                                : (result?.counted || 0) === 0
                                  ? "Aguardando apuração"
                                  : i === 0 && difference !== 0
                                    ? "À frente na parcial"
                                    : "Parcial oficial"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="candidate-numbers">
                      <strong>
                        <AnimatedMetric value={c.percent} decimals={2}/>
                        <small>%</small>
                      </strong>
                      <span>
                        <AnimatedMetric value={c.votes}/>
                        <small>votos válidos</small>
                      </span>
                    </div>
                    <div className="candidate-track">
                      <motion.div
                        animate={{ width: `${c.percent || 0}%` }}
                        transition={{ duration: reduced ? 0 : 0.8 }}
                      />
                    </div>
                  </motion.article>
                ))}
              </div>
              {!available && (
                <p className="reference-note">
                  Nomes de referência solicitados para o layout. A composição
                  oficial será exibida quando validada pelo TSE.
                </p>
              )}
              <div className="difference">
                <span>Diferença entre candidatos</span>
                <strong>
                  {percent(difference)} <small>p.p.</small>
                </strong>
              </div>
              <div className="vote-totals">
                <div>
                  <span>Votos válidos</span>
                  <strong>{integer(result?.valid)}</strong>
                </div>
                <div>
                  <span>Brancos + nulos</span>
                  <strong>
                    {result?.blank != null && result?.nullVotes != null
                      ? integer(result.blank + result.nullVotes)
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>
            <div className="transparency-card">
              <ShieldCheck size={21} />
              <div>
                <strong>
                  {demo ? "Um ensaio visual." : "O dado é oficial."}
                  <br />{demo ? "Nenhum voto real." : "A leitura é sua."}
                </strong>
                <p>
                  {demo ? "Conheça os recursos do painel." : "Sem projeções. Sem estimativas."}
                  <br />
                  {demo ? "Números apenas ilustrativos." : "Direto da Justiça Eleitoral."}
                </p>
              </div>
              <button
                onClick={() => setInfo(true)}
                aria-label="Ler metodologia"
              >
                <ArrowUpRight size={17} />
              </button>
            </div>
          </aside>
          <div className="map-panel">
            <div className="map-topbar">
              <div className="map-view-controls">
                <div className="segmented">
                <button
                  onClick={() => setTab("leader")}
                  className={tab === "leader" ? "active" : ""}
                >
                  Liderança
                </button>
                <button
                  onClick={() => setTab("progress")}
                  className={tab === "progress" ? "active" : ""}
                >
                  Apuração
                </button>
                </div>
                <button
                  type="button"
                  className={cn("relief-toggle", relief && "is-active")}
                  onClick={() => setRelief((value) => !value)}
                  aria-pressed={relief}
                  title="Alternar perspectiva do mapa"
                >
                  <Layers3 size={14} /> <span>3D</span>
                </button>
              </div>
              <div className="map-legend">
                {tab === "leader" ? (
                  <>
                    <span>
                      <i className="red" /> PT
                    </span>
                    <span>
                      <i className="blue" /> PL
                    </span>
                    <span className="no-data-legend">
                      <i /> Sem dados
                    </span>
                  </>
                ) : (
                  <span>
                    <span className="legend-gradient" /> 0–100% totalizado
                  </span>
                )}
              </div>
            </div>
            <div className="map-caption">
              <span>UM PAÍS. 27 UFs. UMA ESCOLHA.</span>
              <h3>{uf === "BR" ? "O Brasil, voto a voto." : locationName}</h3>
              <p>
                {demo
                  ? "Uma visão ilustrativa da disputa pelo país."
                  : "Selecione um estado para explorar a parcial oficial."}
              </p>
              {uf !== "BR" && (
                <button onClick={() => select("BR")} className="back-brazil">
                  <ArrowLeft size={13} /> Voltar ao Brasil
                </button>
              )}
            </div>
            <div className="map-container">
              <svg
                className={cn("brazil-map", relief && "is-relief")}
                viewBox="-25 -12 665 650"
                role="group"
                aria-label="Mapa interativo dos estados do Brasil"
              >
                <defs>
                  <pattern
                    id="map-dots"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="2" cy="2" r=".55" fill="#fff" opacity=".13" />
                  </pattern>
                  <filter id="map-shadow">
                    <feDropShadow
                      dx="0"
                      dy="12"
                      stdDeviation="15"
                      floodColor="#000"
                      floodOpacity=".12"
                    />
                  </filter>
                </defs>
                <g
                  transform={`translate(${310 * (1 - zoom)} ${320 * (1 - zoom)}) scale(${zoom})`}
                  className="map-shapes"
                  filter="url(#map-shadow)"
                >
                  {states.map((s) => (
                    <g
                      key={s.uf}
                      className={cn("map-state", uf === s.uf && "is-selected")}
                      onMouseEnter={() => setHover(s.uf)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(s.uf)}
                      onBlur={() => setHover(null)}
                      onClick={() => select(s.uf)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          select(s.uf);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Consultar ${s.name}`}
                      aria-pressed={uf === s.uf}
                    >
                      <path
                        d={s.path}
                        fill={stateColor(s.uf)}
                        fillOpacity={uf === s.uf ? 1 : 0.83}
                      />
                      <path
                        d={s.path}
                        fill="url(#map-dots)"
                        className="map-texture"
                      />
                      <text
                        x={s.x}
                        y={s.y}
                        textAnchor="middle"
                        style={{ fill: stateHasVotes(s.uf) && tab === "leader" ? "#fff" : "#bec3cd" }}
                        className={
                          [
                            "DF",
                            "ES",
                            "RJ",
                            "SE",
                            "AL",
                            "PB",
                            "PE",
                            "RN",
                          ].includes(s.uf)
                            ? "small-state-label"
                            : ""
                        }
                      >
                        {s.uf}
                      </text>
                      {![
                        "DF",
                        "ES",
                        "RJ",
                        "SE",
                        "AL",
                        "PB",
                        "PE",
                        "RN",
                      ].includes(s.uf) &&
                        stateResult(s.uf)?.released && (
                          <text
                            className="state-percentage"
                            x={s.x}
                            y={s.y + 13}
                            textAnchor="middle"
                            style={{ fill: stateHasVotes(s.uf) && tab === "leader" ? "#fff" : "#bec3cd" }}
                          >
                            {Math.round(
                              tab === "progress"
                                ? stateResult(s.uf)!.progress || 0
                                : stateResult(s.uf)!.candidates[0]?.percent ||
                                    0,
                            )}
                            %
                          </text>
                        )}
                    </g>
                  ))}
                </g>
              </svg>
              <AnimatePresence>
                {hover && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="map-tooltip"
                  >
                    <strong>{states.find((s) => s.uf === hover)?.name}</strong>
                    <span>
                      {stateResult(hover)?.released &&
                      (stateResult(hover)?.counted || 0) > 0
                        ? `${stateResult(hover)?.candidates[0]?.name} · ${percent(stateResult(hover)?.candidates[0]?.percent)}%`
                        : "Selecione para consultar o TSE"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="map-controls">
                <button
                  onClick={() => setZoom((z) => Math.min(1.7, z + 0.15))}
                  aria-label="Ampliar mapa"
                  disabled={zoom >= 1.7}
                >
                  <Plus size={17} />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.85, z - 0.15))}
                  aria-label="Reduzir mapa"
                  disabled={zoom <= 0.85}
                >
                  <Minus size={17} />
                </button>
                <span />
                <button
                  onClick={() => {
                    setZoom(1);
                    setExpanded((e) => !e);
                  }}
                  aria-label={expanded ? "Restaurar painel" : "Expandir mapa"}
                >
                  <Expand size={16} />
                </button>
              </div>
              <div className="map-note">
                <span className="mini-cross">+</span>
                <span>
                  {demo
                    ? "CORES E NÚMEROS ILUSTRATIVOS"
                    : "ATUALIZAÇÃO POR ESTADO"}
                  <small>
                    {demo
                      ? "Demonstração • sem valor eleitoral"
                      : "Sem votos ou dados indisponíveis: cor neutra"}
                  </small>
                </span>
              </div>
            </div>
            <div className="map-bottom">
              <div>
                <span className={cn("status-dot", !paused && "live")} />
                <strong>
                  {demo
                    ? "Demonstração"
                    : paused
                      ? "Atualizações pausadas"
                      : "Atualização automática"}
                </strong>
                <span className="refresh-period">
                  {demo
                    ? "Dados fictícios"
                    : `a cada 15s · próxima em ${seconds}s`}
                </span>
              </div>
              <div>
                <button
                  className="icon-button"
                  onClick={() => setPaused((p) => !p)}
                  aria-label={
                    paused ? "Retomar atualização" : "Pausar atualização"
                  }
                  disabled={demo}
                >
                  {paused ? <Play size={14} /> : <Pause size={14} />}
                </button>
                <button
                  className="icon-button"
                  onClick={() => void refresh(uf, true)}
                  disabled={demo || loading || seconds > 0}
                  aria-label="Atualizar agora"
                >
                  <RefreshCw size={14} className={loading ? "spinning" : ""} />
                </button>
              </div>
            </div>
            <div className="map-shortcuts" aria-label="Atalhos para estados">
              <span>IR DIRETO PARA</span>
              {(["SP", "RJ", "MG", "BA", "RS"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => select(code)}
                  aria-pressed={uf === code}
                  className={uf === code ? "is-active" : ""}
                >
                  {code} <ArrowUpRight size={12} />
                </button>
              ))}
              <button type="button" className="all-states-shortcut" onClick={() => document.getElementById("estados")?.scrollIntoView({behavior:"smooth"})}>
                27 UFs <ArrowUpRight size={12} />
              </button>
            </div>
            <MunicipalityExplorer uf={uf} demo={demo}/>
          </div>
          <CandidateSpotlight candidate={candidates.find(c => c.number === "22") ?? placeholderCandidates[1]} side="right" demo={demo} available={available}/>
        </section>
        </div>
        <MathematicalDecision result={result} demo={demo}/>
        <section className="details-section" id="historico">
          <div className="history-panel reveal">
            <div className="section-heading">
              <div>
                <span className="eyebrow">CADA PARCIAL CONTA</span>
                <h2>O caminho até aqui.</h2>
              </div>
              <span className="small-tag">
                <Clock3 size={12} /> {demo ? "ILUSTRATIVO" : "NESTA SESSÃO"}
              </span>
            </div>
            <div className="history-legend">
              {candidates.map((c) => (
                <span key={c.number}>
                  <i style={{ background: color(c) }} />
                  {c.name}
                </span>
              ))}
            </div>
            <div className="history-chart">
              {demo || historyItems.length > 1 ? (
                <>
                  <div className="chart-labels">
                    <span>{chartMax}%</span>
                    <span>{(chartMax + chartMin) / 2}%</span>
                    <span>{chartMin}%</span>
                  </div>
                  <svg
                    viewBox="0 0 600 110"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={
                      demo
                        ? "Evolução fictícia para demonstração"
                        : "Evolução das parciais recebidas nesta sessão"
                    }
                  >
                    <path
                      d="M0 10H600 M0 55H600 M0 100H600"
                      stroke="#30352e"
                      strokeDasharray="3 5"
                      fill="none"
                    />
                    {candidates.map((c) => {
                      const values = demo
                        ? c.number === "13"
                          ? [44, 45.8, 47.9, 48.4, 49.8, 50.84]
                          : [56, 54.2, 52.1, 51.6, 50.2, 49.16]
                        : historyItems.map(
                            (h) =>
                              h.candidates.find((x) => x.number === c.number)
                                ?.percent ?? 50,
                          );
                      return (
                        <polyline
                          key={c.number}
                          points={values
                            .map(
                              (n, i) =>
                                `${(i / (values.length - 1)) * 600},${100 - ((n - chartMin) / (chartMax - chartMin)) * 90}`,
                            )
                            .join(" ")}
                          fill="none"
                          stroke={color(c)}
                          strokeWidth="2.5"
                        />
                      );
                    })}
                  </svg>
                  <div className="chart-times">
                    <span>
                      {demo
                        ? "17h00"
                        : historyItems[0]?.updatedAt.split(" ")[1]}
                    </span>
                    <span>{demo ? "17h30" : ""}</span>
                    <span>{demo ? "18h00" : ""}</span>
                    <span>{demo ? "18h30" : ""}</span>
                    <span>{demo ? "19h00" : ""}</span>
                    <span>
                      {demo
                        ? "19h42"
                        : historyItems.at(-1)?.updatedAt.split(" ")[1]}
                    </span>
                  </div>
                </>
              ) : (
                <div className="chart-empty">
                  <Signal size={24} />
                  <p>O histórico começa com os dados.</p>
                  <span>
                    As próximas parciais oficiais recebidas nesta sessão
                    aparecerão aqui.
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="participation-panel reveal">
            <div className="section-heading">
              <div>
                <span className="eyebrow">ALÉM DOS VOTOS VÁLIDOS</span>
                <h2>Retrato da participação.</h2>
              </div>
              <Vote size={21} />
            </div>
            <div className="participation-grid">
              <div>
                <span>Comparecimento</span>
                <strong>{integer(result?.turnout)}</strong>
                <small>eleitores que votaram</small>
              </div>
              <div>
                <span>Abstenção</span>
                <strong>
                  {percent(result?.abstention)}
                  <small>%</small>
                </strong>
                <small>do eleitorado apurado</small>
              </div>
              <div>
                <span>
                  <i className="white-dot" /> Votos em branco
                </span>
                <strong>{integer(result?.blank)}</strong>
              </div>
              <div>
                <span>
                  <i className="gray-dot" /> Votos nulos
                </span>
                <strong>{integer(result?.nullVotes)}</strong>
              </div>
            </div>
          </div>
        </section>
        <section id="estados" className="states-section">
          <div className="states-header">
            <div>
              <span className="eyebrow">DO LOCAL AO NACIONAL</span>
              <h2>
                Todos os estados. <em>Cada realidade.</em>
              </h2>
            </div>
            <label className="search-input">
              <Search size={16} />
              <input
                aria-label="Buscar estado"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar estado ou UF"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Limpar busca">
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
          <div className="state-table-wrap">
            <table className="state-table">
              <thead>
                <tr>
                  <th>
                    Estado <ChevronDown size={12} />
                  </th>
                  <th>Liderança na parcial</th>
                  <th>Votos do líder</th>
                  <th>Seções totalizadas</th>
                  <th>
                    <span className="sr-only">Consultar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {states
                  .filter((s) =>
                    (s.name + " " + s.uf)
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase()
                      .includes(
                        search
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .toLowerCase(),
                      ),
                  )
                  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                  .map((s) => {
                    const r = stateResult(s.uf);
                    const c = r?.released ? r.candidates[0] : null;
                    const tied =
                      r?.released &&
                      r.candidates[0]?.votes === r.candidates[1]?.votes;
                    return (
                      <tr
                        key={s.uf}
                        className={uf === s.uf ? "selected-row" : ""}
                      >
                        <td>
                          <button
                            onClick={() => {
                              select(s.uf);
                              document
                                .getElementById("apuracao")
                                ?.scrollIntoView({
                                  behavior: reduced ? "instant" : "smooth",
                                });
                            }}
                          >
                            <span className="uf-icon">{s.uf}</span>
                            {s.name}
                          </button>
                        </td>
                        <td>
                          {c ? (
                            <span className="table-candidate">
                              <i
                                style={{
                                  background: tied ? "#aab1a6" : color(c),
                                }}
                              />
                              {r?.counted === 0
                                ? "Aguardando votos"
                                : tied
                                  ? "Empate"
                                  : c.name}{" "}
                              <small>{tied ? "" : c.party}</small>
                            </span>
                          ) : (
                            <span className="muted">Ainda não consultado</span>
                          )}
                        </td>
                        <td>{tied ? "—" : integer(c?.votes)}</td>
                        <td>
                          <div className="table-progress">
                            <div>
                              <i style={{ width: `${r?.progress || 0}%` }} />
                            </div>
                            <span>{percent(r?.progress)}%</span>
                          </div>
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            onClick={() => {
                              select(s.uf);
                              document
                                .getElementById("apuracao")
                                ?.scrollIntoView({
                                  behavior: reduced ? "instant" : "smooth",
                                });
                            }}
                            aria-label={`Ver resultados de ${s.name}`}
                          >
                            <ArrowUpRight size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {!states.some((s) =>
              (s.name + " " + s.uf)
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .includes(
                  search
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase(),
                ),
            ) && (
              <div className="no-results">
                Nenhum estado encontrado. Tente o nome ou a sigla.
              </div>
            )}
          </div>
          <div className="states-footnote">
            <span>
              Mapa atualizado a cada 60s; UF selecionada, a cada 15s. O total
              nacional inclui o exterior.
            </span>
            <button
              onClick={() => {
                select("ZZ");
                document
                  .getElementById("apuracao")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Consultar exterior <ArrowUpRight size={13} />
            </button>
          </div>
        </section>
        <section className="closing-card">
          <div>
            <span className="eyebrow">INFORMAÇÃO QUE APROXIMA</span>
            <h2>
              A democracia acontece.
              <br />
              <em>Acompanhe de perto.</em>
            </h2>
            <p>Compartilhe informação com fonte, contexto e transparência.</p>
          </div>
          <button onClick={share}>
            Compartilhar apuração <Share2 size={16} />
          </button>
        </section>
      </main>
      <footer>
        <a className="brand footer-brand" href="/">
          pulso<span className="brand-dot">.</span>
        </a>
        <p>
          Um olhar independente sobre os dados oficiais.
          <br />
          <span>Sem vínculo com o Tribunal Superior Eleitoral.</span>
        </p>
        <div>
          <button onClick={() => setInfo(true)}>
            Fontes e metodologia <ArrowUpRight size={12} />
          </button>
          <a
            href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados"
            target="_blank"
            rel="noreferrer"
          >
            Resultados TSE <ArrowUpRight size={12} />
          </a>
        </div>
        <span className="footer-year">BRASIL · 2026</span>
      </footer>
      <div className="live-dock">
        <span
          className={cn(
            "status-dot",
            available && !demo && response?.status === "live" && "live",
          )}
        />
        <span>
          {demo
            ? "DEMONSTRAÇÃO • NÚMEROS FICTÍCIOS"
            : response?.status === "stale"
              ? "DADOS DESATUALIZADOS"
              : available
                ? result?.counted === 0
                  ? "AGUARDANDO APURAÇÃO"
                  : "PARCIAL OFICIAL"
                : "AGUARDANDO TSE"}
        </span>
        <i />
        <span>
          {result?.updatedAt
            ? `Fonte: ${result.updatedAt}`
            : "Sem parcial validada"}
        </span>
        <button
          onClick={() => setInfo(true)}
          aria-label="Informações sobre atualização"
        >
          <Info size={13} />
        </button>
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="toast"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Check size={16} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      <InfoDialog open={info} onOpenChange={setInfo} />
    </div>
  );
}
