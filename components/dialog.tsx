"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
export function InfoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content className="dialog-content">
          <DialogPrimitive.Title>
            Transparência, em primeiro lugar.
          </DialogPrimitive.Title>
          <DialogPrimitive.Description>
            Como os resultados chegam até você.
          </DialogPrimitive.Description>
          <div className="dialog-copy">
            <h3>Uma fonte. Nenhuma projeção.</h3>
            <p>
              O Pulso é um projeto independente, sem vínculo com o TSE. A
              integração consulta os arquivos públicos EA20 de 2026, eleição
              6258, cargo 0001, segundo turno. A compatibilidade do arquivo é
              validada antes de exibir qualquer voto.
            </p>
            <h3>Atualização a cada 45 segundos</h3>
            <p>
              A UF selecionada é consultada a cada 45 segundos e o mapa a cada
              90 segundos, com até três consultas simultâneas. As consultas são
              pausadas em abas ocultas. Em caso de falha, a última parcial
              recebida é preservada e identificada como desatualizada. O horário
              exibido é o horário informado pelo TSE.
            </p>
            <h3>O que significa “eleito”?</h3>
            <p>
              A indicação só aparece quando fornecida pelo TSE. Uma liderança,
              mesmo com 100% das seções, não é usada para declarar um vencedor
              por conta própria.
            </p>
            <h3>Demonstração e histórico</h3>
            <p>
              O modo de demonstração usa números inteiramente fictícios, sem
              valor eleitoral. O histórico oficial reúne apenas parciais
              recebidas enquanto esta página está aberta. Sem dados por UF, o
              mapa permanece neutro.
            </p>
            <h3>Imagens e cartografia</h3>
            <p>
              Imagens dos candidatos: links fornecidos pelo solicitante
              (Valor/Globo e Google). Nomes e fotos de referência não confirmam
              candidaturas. Malha estadual: Click That ’Hood / Code for America,
              licença dos dados conforme a fonte.
            </p>
            <a
              href="https://resultados.tse.jus.br/oficial/app/index.html#/eleicao/6258/uf/br/cargo/1/vis/nominal/resultados"
              target="_blank"
              rel="noreferrer"
            >
              Consultar o portal oficial do TSE ↗
            </a>
          </div>
          <DialogPrimitive.Close
            className="dialog-close"
            aria-label="Fechar informações"
          >
            <X size={20} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
