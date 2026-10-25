"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import type { ApiResponse } from "@/lib/results";
import type { Municipality } from "@/lib/municipalities";
import { integer } from "@/lib/utils";
import { AnimatedMetric } from "./animated-metric";
import states from "@/lib/brazil-map.json";

export function MunicipalityExplorer({ uf, demo }: { uf: string; demo: boolean }) {
  const [state, setState] = useState(uf === "BR" || uf === "ZZ" ? "SP" : uf);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [snapshot, setSnapshot] = useState<ApiResponse | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (uf !== "BR" && uf !== "ZZ") setState(uf);
  }, [uf]);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogStatus("loading");
    setMunicipalities([]);
    setSearch("");
    setCity("");
    setSnapshot(null);
    fetch(`/api/municipalities?uf=${state}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw Error("Falha no catálogo");
        return response.json() as Promise<{ municipalities: Municipality[] }>;
      })
      .then(data => { setMunicipalities(data.municipalities); setCatalogStatus("ready"); })
      .catch(() => { if (!controller.signal.aborted) setCatalogStatus("error"); });
    return () => controller.abort();
  }, [state]);

  useEffect(() => {
    if (!city || demo) { setSnapshot(null); return; }
    let stopped = false;
    let busy = false;
    const update = async () => {
      if (stopped || busy || document.hidden) return;
      busy = true;
      setUpdating(true);
      try {
        const response = await fetch(`/api/results?uf=${state}&city=${city}`, { cache: "no-store", signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw Error("Falha ao consultar resultado municipal");
        const next: ApiResponse = await response.json();
        if (!stopped) setSnapshot(previous => !next.result && previous?.result ? { ...next, status: "stale", result: previous.result } : next);
      } catch {
        if (!stopped) setSnapshot(previous => previous?.result ? { ...previous, status: "stale" } : { status: "unavailable", result: null, message: "Consulta municipal indisponível", checkedAt: new Date().toISOString() });
      } finally { busy = false; if (!stopped) setUpdating(false); }
    };
    void update();
    const timer = setInterval(() => void update(), 15000);
    return () => { stopped = true; clearInterval(timer); };
  }, [city, state, demo]);

  const filtered = useMemo(() => search.trim().length < 2 ? [] : municipalities.filter(item => item.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))).slice(0, 12), [municipalities, search]);
  const municipality = municipalities.find(item => item.code === city);
  const result = snapshot?.result;

  return <section className="municipality-explorer" aria-label="Apuração por município">
    <div className="municipality-heading">
      <div><span className="small-kicker">DETALHAMENTO TERRITORIAL</span><h3>Do Brasil à sua cidade.</h3><p>Resultados municipais diretos do TSE, com verificação a cada 15 segundos.</p></div>
      <span className="municipality-source"><MapPin size={13}/> EA12 + EA20 · TSE</span>
    </div>
    <div className="municipality-controls">
      <label>ESTADO
        <select value={state} onChange={event => setState(event.target.value)}>
          {states.map(item => <option key={item.uf} value={item.uf}>{item.name}</option>)}
        </select>
      </label>
      <label>MUNICÍPIO
        <span className="municipality-search"><Search size={14}/><input value={search} onChange={event => {setSearch(event.target.value);setCity("");}} placeholder={catalogStatus === "loading" ? "Carregando cidades…" : "Busque pelo nome da cidade"} disabled={catalogStatus !== "ready"}/></span>
      </label>
    </div>
    {catalogStatus === "error" && <p className="municipality-note">O catálogo oficial de municípios está temporariamente indisponível.</p>}
    {catalogStatus === "ready" && !city && (search.trim().length < 2
      ? <p className="municipality-empty">Pesquise pelo menos duas letras para encontrar uma das {integer(municipalities.length)} cidades de {state}.</p>
      : <div className="municipality-options" role="listbox" aria-label="Escolher município">
          {filtered.map(item => <button role="option" aria-selected={false} type="button" key={item.code} onClick={() => {setCity(item.code);setSearch(item.name);}}>{item.name}<ArrowUpRight size={13}/></button>)}
          {filtered.length === 0 && <p>Nenhuma cidade encontrada.</p>}
        </div>)}
    {city && <div className="municipality-result">
      <div className="municipality-result-title"><div><span className="small-kicker">{municipality?.name} / {state}</span><h4>{demo ? "Dados oficiais indisponíveis em demonstração" : updating && !result ? "Consultando TSE…" : snapshot?.status === "stale" ? "Última parcial disponível" : result?.released ? "Apuração municipal" : "Aguardando divulgação"}</h4></div><button type="button" onClick={() => {setCity("");setSnapshot(null);}} aria-label="Escolher outra cidade">Trocar cidade</button></div>
      {!demo && result?.released && <><div className="municipality-progress"><strong><AnimatedMetric value={result.progress} decimals={2}/>%</strong><span>seções totalizadas · <AnimatedMetric value={result.counted}/> de {integer(result.sections)}</span></div><div className="municipality-candidates">{result.candidates.map(candidate => <div key={candidate.number}><span>{candidate.name}</span><strong><AnimatedMetric value={candidate.percent} decimals={2}/>%</strong><small><AnimatedMetric value={candidate.votes}/> votos</small></div>)}</div></>}
      <p className="municipality-note">{demo ? "Desative a demonstração para consultar a cidade." : snapshot?.status === "stale" ? "Conexão indisponível; os números podem estar desatualizados." : result?.released ? `Fonte oficial: ${result.updatedAt}.` : "Sem votos oficialmente divulgados. Nenhum resultado é inferido."} {result?.source && !demo && <a href={result.source} target="_blank" rel="noreferrer">Conferir JSON do TSE ↗</a>}</p>
    </div>}
  </section>;
}
