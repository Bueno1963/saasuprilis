import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TableProperties } from "lucide-react";
import IntegrationsListPage from "./IntegrationsListPage";

interface Props { onBack: () => void; }

const IntegrationsSettings = ({ onBack }: Props) => {
  const [showListPage, setShowListPage] = useState(false);

  if (showListPage) {
    return <IntegrationsListPage onBack={() => setShowListPage(false)} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
            <p className="text-sm text-muted-foreground">HL7, ASTM, APIs externas</p>
          </div>
        </div>
        <Button onClick={() => setShowListPage(true)}><TableProperties className="h-4 w-4 mr-2" />Integrações Cadastradas</Button>
      </div>

      {/* Padrões Técnicos */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Padrões Técnicos Utilizados</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Para garantir que diferentes marcas de equipamentos (espectrofotômetros, analisadores bioquímicos) se comuniquem com o LIS, utilizam-se protocolos padronizados:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold">ASTM</Badge>
                <span className="text-xs text-muted-foreground">American Society for Testing and Materials</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Padrão para conexão direta entre analisadores clínicos e LIS:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                <li><strong className="text-foreground">E1381</strong> — Camada de transporte (low-level protocol): controle de fluxo, handshake e checksums entre equipamento e host.</li>
                <li><strong className="text-foreground">E1394</strong> — Estrutura de mensagens (high-level): define campos como ID do paciente, resultados, flags e unidades.</li>
                <li><strong className="text-foreground">LIS2-A2 (CLSI)</strong> — Evolução do ASTM E1394, mantida pelo CLSI, amplamente adotada por analisadores modernos.</li>
              </ul>
              <a href="https://clsi.org/standards/products/automation-and-informatics/documents/lis02/" target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-primary hover:underline mt-1">
                📄 Documentação CLSI LIS2-A2 →
              </a>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold">HL7</Badge>
                <span className="text-xs text-muted-foreground">Health Level Seven International</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Padrão internacional de interoperabilidade em saúde. Versões relevantes:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                <li><strong className="text-foreground">HL7 v2.x</strong> — Versão mais utilizada em laboratórios. Mensagens delimitadas por pipe (|) nos segmentos ORM (pedidos), ORU (resultados) e ADT (admissão).</li>
                <li><strong className="text-foreground">HL7 v3 / CDA</strong> — Baseado em XML, utilizado em documentos clínicos estruturados (Clinical Document Architecture).</li>
                <li><strong className="text-foreground">FHIR (R4/R5)</strong> — Padrão moderno baseado em REST/JSON. Resources como <em>DiagnosticReport</em>, <em>Observation</em> e <em>ServiceRequest</em> facilitam integração com EMRs e portais.</li>
              </ul>
              <div className="flex flex-wrap gap-3 mt-1">
                <a href="https://www.hl7.org/implement/standards/product_brief.cfm?product_id=185" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                  📄 HL7 v2.x Spec →
                </a>
                <a href="https://hl7.org/fhir/" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                  🔥 FHIR Documentation →
                </a>
              </div>
            </div>
          </div>
          {/* POCT1-A */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-bold">POCT1-A</Badge>
              <span className="text-xs text-muted-foreground">Point-of-Care Testing Connectivity</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Padrão CLSI para conectividade de dispositivos <strong className="text-foreground">point-of-care</strong> (glicosímetros, gasômetros, coagulômetros portáteis) ao LIS e EMR:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
              <li><strong className="text-foreground">Device Interface</strong> — Define como dispositivos POCT transmitem resultados, IDs de paciente e operador ao concentrador (middleware).</li>
              <li><strong className="text-foreground">Observation Reviewer</strong> — Camada de revisão e aprovação de resultados antes da liberação ao LIS.</li>
              <li><strong className="text-foreground">Access Point / LIS Gateway</strong> — Integração bidirecional: recebe worklists do LIS e devolve resultados validados com rastreabilidade completa.</li>
            </ul>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Arquitetura em camadas (Device → Access Point → LIS) garante <strong className="text-foreground">rastreabilidade</strong>, <strong className="text-foreground">controle de qualidade</strong> e conformidade regulatória para testes realizados à beira do leito.
            </p>
            <a href="https://clsi.org/standards/products/automation-and-informatics/documents/poct01/" target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-primary hover:underline mt-1">
              📄 Documentação CLSI POCT1-A →
            </a>
          </div>
          {/* IHE */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-bold">IHE</Badge>
              <span className="text-xs text-muted-foreground">Integrating the Healthcare Enterprise</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Iniciativa que define <strong className="text-foreground">perfis de integração</strong> baseados em padrões existentes (HL7, DICOM) para garantir interoperabilidade real entre sistemas de saúde. Perfis laboratoriais relevantes:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
              <li><strong className="text-foreground">LAW (Laboratory Analytical Workflow)</strong> — Gerencia o fluxo analítico: recebimento de worklists, execução de testes, transmissão de resultados e controle de qualidade entre analisadores e LIS.</li>
              <li><strong className="text-foreground">LTW (Laboratory Testing Workflow)</strong> — Cobre o fluxo completo do pedido ao laudo: solicitação médica → coleta → triagem → análise → validação → liberação de resultados.</li>
              <li><strong className="text-foreground">LPOCT (Laboratory Point-of-Care Testing)</strong> — Perfil específico para gestão de dispositivos POCT dentro do contexto IHE, complementando o POCT1-A.</li>
              <li><strong className="text-foreground">LDA (Laboratory Device Automation)</strong> — Integração com esteiras e sistemas de automação pré/pós-analítica (track systems).</li>
            </ul>
            <div className="flex flex-wrap gap-3 mt-1">
              <a href="https://www.ihe.net/resources/profiles/#pathology" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                📄 IHE Pathology & Lab Profiles →
              </a>
              <a href="https://wiki.ihe.net/index.php/Laboratory_Testing_Workflow" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                🔬 LTW Wiki →
              </a>
            </div>
          </div>
          {/* TISS */}
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-bold">TISS</Badge>
              <span className="text-xs text-muted-foreground">Troca de Informação em Saúde Suplementar — ANS</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Padrão obrigatório da <strong className="text-foreground">ANS (Agência Nacional de Saúde Suplementar)</strong> para troca eletrônica de informações entre prestadores de serviços de saúde e operadoras de planos:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
              <li><strong className="text-foreground">TISS 4.x</strong> — Versão atual do padrão, com schemas XML para guias de autorização, faturamento e demonstrativos.</li>
              <li><strong className="text-foreground">Guia SP/SADT</strong> — Guia de Serviço Profissional / Serviço Auxiliar de Diagnóstico e Terapia, principal formulário para laboratórios clínicos.</li>
              <li><strong className="text-foreground">Tabela TUSS</strong> — Terminologia Unificada da Saúde Suplementar: códigos padronizados para procedimentos, materiais e medicamentos.</li>
              <li><strong className="text-foreground">Lote de Guias (XML)</strong> — Envio eletrônico de lotes de faturamento às operadoras via web service ou portal.</li>
              <li><strong className="text-foreground">Demonstrativo de Análise</strong> — Retorno da operadora com glosas, pagamentos e justificativas.</li>
            </ul>
            <div className="flex flex-wrap gap-3 mt-1">
              <a href="https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                📄 TISS — Portal ANS →
              </a>
              <a href="https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/padrao-tiss-tabelas-relacionadas" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                📋 Tabela TUSS →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsSettings;
