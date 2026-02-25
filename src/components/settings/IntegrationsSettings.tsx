import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, List, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IntegrationDetailPage from "./IntegrationDetailPage";

interface Props { onBack: () => void; }

const IntegrationsSettings = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const [detailId, setDetailId] = useState<string | null | undefined>(undefined);
  const [showEquipList, setShowEquipList] = useState(false);
  const [filterProtocol, setFilterProtocol] = useState<string>("all");
  const [filterSector, setFilterSector] = useState<string>("all");

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment-integrated"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("integrations").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("integrations").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["integrations"] }); toast.success("Integração removida!"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Show detail page
  if (detailId !== undefined) {
    return <IntegrationDetailPage integrationId={detailId} onBack={() => setDetailId(undefined)} />;
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEquipList(true)}><List className="h-4 w-4 mr-2" />Lista Equipamentos Integrados</Button>
          <Button onClick={() => setDetailId(null)}><Plus className="h-4 w-4 mr-2" />Nova Integração</Button>
        </div>
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Protocolo</TableHead>
                <TableHead>Endpoint</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow> :
              items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma integração</TableCell></TableRow> :
              items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailId(item.id)}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.protocol}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{item.endpoint_url}</TableCell>
                  <TableCell><Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDetailId(item.id); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); remove.mutate(item.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Lista Equipamentos Integrados */}
      <Dialog open={showEquipList} onOpenChange={(open) => { setShowEquipList(open); if (!open) { setFilterProtocol("all"); setFilterSector("all"); } }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Equipamentos Integrados</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 pb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterProtocol} onValueChange={setFilterProtocol}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Protocolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Protocolos</SelectItem>
                  {[...new Set(equipment.map(e => e.protocol).filter(Boolean))].map(p => (
                    <SelectItem key={p} value={p!}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Setores</SelectItem>
                {[...new Set(equipment.map(e => e.sector).filter(Boolean))].map(s => (
                  <SelectItem key={s} value={s!}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterProtocol !== "all" || filterSector !== "all") && (
              <Button variant="ghost" size="sm" className="text-xs h-9" onClick={() => { setFilterProtocol("all"); setFilterSector("all"); }}>Limpar</Button>
            )}
          </div>
          {(() => {
            const filtered = equipment.filter(eq =>
              (filterProtocol === "all" || eq.protocol === filterProtocol) &&
              (filterSector === "all" || eq.sector === filterSector)
            );
            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum equipamento encontrado</TableCell></TableRow>
                  ) : filtered.map((eq) => (
                    <TableRow key={eq.id}>
                      <TableCell className="font-medium">{eq.name}</TableCell>
                      <TableCell className="text-sm">{eq.manufacturer || "—"}</TableCell>
                      <TableCell className="text-sm">{eq.model || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{eq.protocol || "—"}</Badge></TableCell>
                      <TableCell className="text-sm">{eq.sector || "—"}</TableCell>
                      <TableCell><Badge variant={eq.status === "active" ? "default" : "secondary"}>{eq.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsSettings;
