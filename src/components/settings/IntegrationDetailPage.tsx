import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Save, Wifi, WifiOff, Clock } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";

interface Props {
  integrationId: string | null; // null = new
  onBack: () => void;
}

interface IntForm {
  name: string;
  type: string;
  endpoint_url: string;
  api_key_name: string;
  protocol: string;
  status: string;
  notes: string;
}

const defaultValues: IntForm = {
  name: "",
  type: "API",
  endpoint_url: "",
  api_key_name: "",
  protocol: "REST",
  status: "inactive",
  notes: "",
};

// Sample field mapping data (static for now)
const fieldMappings = [
  { lis: "patient_id", remote: "PID.3", desc: "Identificador do paciente" },
  { lis: "patient_name", remote: "PID.5", desc: "Nome do paciente" },
  { lis: "order_number", remote: "ORC.2", desc: "Número do pedido" },
  { lis: "exam_code", remote: "OBR.4", desc: "Código do exame" },
  { lis: "result_value", remote: "OBX.5", desc: "Valor do resultado" },
  { lis: "result_unit", remote: "OBX.6", desc: "Unidade do resultado" },
  { lis: "reference_range", remote: "OBX.7", desc: "Faixa de referência" },
  { lis: "result_flag", remote: "OBX.8", desc: "Flag (normal/alto/baixo)" },
];

const IntegrationDetailPage = ({ integrationId, onBack }: Props) => {
  const qc = useQueryClient();
  const isNew = !integrationId;
  const { register, handleSubmit, reset, control, watch } = useForm<IntForm>({ defaultValues });
  const [loaded, setLoaded] = useState(false);

  const currentStatus = watch("status");
  const currentType = watch("type");

  // Load existing integration
  const { isLoading } = useQuery({
    queryKey: ["integration-detail", integrationId],
    queryFn: async () => {
      if (!integrationId) return null;
      const { data, error } = await supabase.from("integrations").select("*").eq("id", integrationId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!integrationId && !loaded,
    meta: {
      onSuccess: (data: any) => {
        if (data) {
          reset(data);
          setLoaded(true);
        }
      },
    },
  });

  // Manual load via effect-like approach
  const { data: integrationData } = useQuery({
    queryKey: ["integration-detail", integrationId],
    queryFn: async () => {
      if (!integrationId) return null;
      const { data, error } = await supabase.from("integrations").select("*").eq("id", integrationId).single();
      if (error) throw error;
      if (!loaded) {
        reset(data);
        setLoaded(true);
      }
      return data;
    },
    enabled: !!integrationId,
  });

  const save = useMutation({
    mutationFn: async (values: IntForm) => {
      if (integrationId) {
        const { error } = await supabase.from("integrations").update(values).eq("id", integrationId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("integrations").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integração salva com sucesso!");
      if (isNew) onBack();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? "Nova Integração" : "Editar Integração"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? "Configure uma nova integração com sistema externo" : "Gerencie configurações, mapeamentos e logs"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={currentStatus === "active" ? "default" : "secondary"} className="gap-1">
            {currentStatus === "active" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {currentStatus === "active" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Dados Gerais</TabsTrigger>
          <TabsTrigger value="technical">Configuração Técnica</TabsTrigger>
          <TabsTrigger value="mapping">Mapeamento de Campos</TabsTrigger>
          <TabsTrigger value="logs">Logs / Histórico</TabsTrigger>
        </TabsList>

        {/* Tab 1: Dados Gerais */}
        <TabsContent value="general">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nome da Integração *</Label>
                    <Input {...register("name", { required: true })} placeholder="Ex: Analisador Bioquímico XYZ" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Controller name="type" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="API">API Externa</SelectItem>
                          <SelectItem value="HL7">HL7</SelectItem>
                          <SelectItem value="ASTM">ASTM</SelectItem>
                          <SelectItem value="FHIR">FHIR</SelectItem>
                          <SelectItem value="POCT">POCT1-A</SelectItem>
                          <SelectItem value="Portal">Portal de Resultados</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Protocolo de Comunicação</Label>
                    <Controller name="protocol" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REST">REST / HTTP</SelectItem>
                          <SelectItem value="SOAP">SOAP / XML</SelectItem>
                          <SelectItem value="TCP">TCP/IP</SelectItem>
                          <SelectItem value="Serial">Serial (RS-232)</SelectItem>
                          <SelectItem value="MLLP">MLLP (HL7)</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Controller name="status" control={control} render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <Label>Observações</Label>
                    <Textarea {...register("notes")} placeholder="Notas, instruções ou detalhes adicionais..." rows={3} />
                  </div>
                </div>
                <Button type="submit" disabled={save.isPending} className="gap-2">
                  <Save className="h-4 w-4" /> Salvar Dados Gerais
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Configuração Técnica */}
        <TabsContent value="technical">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <Label>Endpoint URL</Label>
                    <Input {...register("endpoint_url")} placeholder="https://api.example.com/v1 ou 192.168.1.100:9100" />
                    <p className="text-xs text-muted-foreground">URL da API, endereço IP:porta para TCP/Serial, ou caminho MLLP</p>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <Label>Nome da Secret (API Key)</Label>
                    <Input {...register("api_key_name")} placeholder="Ex: ANALYZER_API_KEY" />
                    <p className="text-xs text-muted-foreground">Nome do segredo armazenado no cofre de secrets do backend</p>
                  </div>
                </div>

                {/* Connection info based on type */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Informações de Conexão — {currentType}</h3>
                  {currentType === "HL7" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Protocolo de transporte: <strong className="text-foreground">MLLP</strong> (Minimal Lower Layer Protocol)</li>
                      <li>Mensagens suportadas: ORM (pedidos), ORU (resultados), ADT (admissão), ACK</li>
                      <li>Versão recomendada: <strong className="text-foreground">HL7 v2.5.1</strong></li>
                      <li>Encoding: UTF-8 com delimitadores padrão (|^~\&amp;)</li>
                    </ul>
                  )}
                  {currentType === "ASTM" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Protocolo: <strong className="text-foreground">ASTM E1381/E1394</strong> ou LIS2-A2</li>
                      <li>Comunicação via Serial (RS-232) ou TCP/IP</li>
                      <li>Frames: ENQ → STX [dados] ETX [checksum] CR LF → EOT</li>
                      <li>Records: H (Header), P (Patient), O (Order), R (Result), L (Terminator)</li>
                    </ul>
                  )}
                  {currentType === "FHIR" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Base URL do servidor FHIR (R4 ou R5)</li>
                      <li>Resources: DiagnosticReport, Observation, ServiceRequest, Patient</li>
                      <li>Autenticação: OAuth 2.0 / SMART on FHIR</li>
                      <li>Formato: application/fhir+json</li>
                    </ul>
                  )}
                  {currentType === "POCT" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Padrão: <strong className="text-foreground">CLSI POCT1-A2</strong></li>
                      <li>Camadas: Device → Access Point → LIS Gateway</li>
                      <li>Suporte a worklists bidirecionais e controle de QC</li>
                    </ul>
                  )}
                  {currentType === "API" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>API REST com autenticação via header Authorization</li>
                      <li>Content-Type: application/json</li>
                      <li>Métodos: GET (consulta), POST (envio), PUT (atualização)</li>
                    </ul>
                  )}
                  {currentType === "Portal" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Portal web para disponibilização de laudos ao paciente/médico</li>
                      <li>Integração via webhook ou polling de resultados liberados</li>
                    </ul>
                  )}
                </div>

                <Button type="submit" disabled={save.isPending} className="gap-2">
                  <Save className="h-4 w-4" /> Salvar Configuração Técnica
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Mapeamento de Campos */}
        <TabsContent value="mapping">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Mapeamento de Campos LIS ↔ Sistema Externo</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Correspondência entre campos internos do LIS e segmentos/fields do protocolo ({currentType})
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campo LIS</TableHead>
                    <TableHead>Campo Remoto</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldMappings.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{m.lis}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{m.remote}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  ⚠️ O mapeamento de campos customizado estará disponível em versão futura. Atualmente os campos seguem o padrão do protocolo selecionado.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Logs / Histórico */}
        <TabsContent value="logs">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Histórico de Sincronização</h3>
                {integrationData?.last_sync && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    Última sync: {format(new Date(integrationData.last_sync), "dd/MM/yyyy HH:mm")}
                  </Badge>
                )}
              </div>

              {!integrationId ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Salve a integração primeiro para visualizar logs.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Simulated log entries */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Nenhum log registrado ainda para esta integração.</p>
                    <p className="text-xs text-muted-foreground">
                      Os logs de comunicação (envio/recebimento de mensagens, erros, timeouts) serão exibidos aqui após a primeira sincronização.
                    </p>
                  </div>
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      📋 Funcionalidades futuras: filtro por data, exportação de logs, alertas automáticos de falha de conexão.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationDetailPage;
