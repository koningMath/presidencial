"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Pause, Play, Radio, Volume2, VolumeX } from "lucide-react";
import type { Result } from "@/lib/results";
import { percent } from "@/lib/utils";

type Props = { result: Result | null | undefined; demo: boolean; territory: string };

function bulletin(result: Result | null | undefined, demo: boolean, territory: string) {
  const mode = demo ? "Atenção: este é um boletim de demonstração com números fictícios. " : "";
  if (!result?.released || result.progress == null || result.counted === 0)
    return mode + `Pulso Eleitoral. Ainda aguardamos a primeira parcial validada para ${territory}. A atualização por voz estará disponível assim que houver dados.`;
  const [first, second] = result.candidates;
  const lead = first?.votes != null && second?.votes != null && first.votes !== second.votes
    ? `${first.name} aparece à frente de ${second.name} nesta parcial.`
    : "As candidaturas estão empatadas nesta parcial.";
  return mode + `Boletim Pulso. Em ${territory}, ${percent(result.progress)} por cento das seções foram totalizadas. ${lead} Os números podem mudar. Fonte: Tribunal Superior Eleitoral.`;
}

export function AudioBulletins({result,demo,territory}:Props) {
  const [enabled,setEnabled] = useState(false);
  const [speaking,setSpeaking] = useState(false);
  const [speed,setSpeed] = useState(1);
  const [supported,setSupported] = useState(true);
  const milestoneRef = useRef<number | null>(null);
  const text = useMemo(() => bulletin(result,demo,territory),[result,demo,territory]);
  const progress = result?.released && result.progress != null ? result.progress : null;
  const milestone = progress === null ? null : Math.floor(progress / 2) * 2;

  const speak = (content:string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = "pt-BR";
    utterance.rate = speed;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith("pt-br"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };
  const toggle = () => {
    if (enabled) {
      setEnabled(false);
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    } else {
      setEnabled(true);
      milestoneRef.current = milestone;
      speak(text);
    }
  };
  useEffect(() => {
    if (!enabled || milestone === null || milestoneRef.current === null) return;
    if (milestone > milestoneRef.current) {
      milestoneRef.current = milestone;
      speak(text);
    } else if (milestone < milestoneRef.current) {
      milestoneRef.current = milestone;
    }
    // Only a new 2%-milestone triggers automatic narration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[enabled,milestone]);
  useEffect(() => () => { if (typeof window !== "undefined") window.speechSynthesis?.cancel(); },[]);
  return <div className="radio-experience">
    <div className="view-heading">
      <span className="view-eyebrow">PULSO / ÁUDIO</span>
      <h2>A apuração <em>que fala com você.</em></h2>
      <p>Uma rádio eleitoral pessoal para acompanhar os dados sem olhar para a tela.</p>
    </div>
    <div className="radio-console">
      <div className="radio-topline"><span><Radio size={15}/> BOLETIM DINÂMICO</span><span>{demo ? "FICTÍCIO" : "DADOS OFICIAIS QUANDO DISPONÍVEIS"}</span></div>
      <div className="radio-center">
        <div className="radio-art" aria-hidden="true"><div className={speaking ? "radio-orbit is-speaking" : "radio-orbit"}><Headphones size={58}/></div></div>
        <div className="radio-copy">
          <span>TRANSMISSÃO POR VOZ / PT-BR</span>
          <h3>{speaking ? "No ar." : enabled ? "Pronto para o próximo boletim." : "Sua rádio. Seu ritmo."}</h3>
          <p>{text}</p>
          <div className="radio-actions">
            <button className="radio-primary" type="button" onClick={toggle}>{enabled ? <><Pause size={16}/> Desativar rádio</> : <><Play size={16}/> Ativar rádio</>}</button>
            <button className="radio-secondary" type="button" onClick={() => speak(text)} aria-label="Ouvir boletim agora"><Volume2 size={18}/> Ouvir agora</button>
            <button className="radio-secondary" type="button" onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); }} aria-label="Parar narração"><VolumeX size={18}/></button>
          </div>
        </div>
      </div>
      <div className="radio-bottomline">
        <div><strong>GATILHO</strong><span>A cada 2 pontos percentuais de seções totalizadas</span></div>
        <div><strong>PRÓXIMO MARCO</strong><span>{milestone === null ? "Aguardando apuração" : `${Math.min(100,milestone+2)}%`}</span></div>
        <label><strong>VELOCIDADE</strong><select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value=".9">0,9×</option><option value="1">1,0×</option><option value="1.1">1,1×</option></select></label>
      </div>
    </div>
    <p className="radio-disclaimer">{!supported ? "Seu navegador não oferece síntese de voz." : "A voz usa síntese nativa do navegador, ativada somente com seu consentimento. O texto do boletim é composto a partir de dados validados — não é IA generativa nem áudio espacial multicanal. Nunca são anunciadas lideranças de municípios sem fonte municipal."}</p>
  </div>;
}
