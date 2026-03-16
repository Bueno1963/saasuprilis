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
import { ArrowLeft, Save, Wifi, WifiOff, Plus, Trash2, GripVertical } from "lucide-react";
import IntegrationLogsTab from "./IntegrationLogsTab";
import { useForm, Controller } from "react-hook-form";

interface Props {
  integrationId: string | null;
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

const DEFAULT_MAPPINGS = [
  { lis_field: "patient_id", remote_field: "PID.3", description: "Identificador do paciente" },
  { lis_field: "patient_name", remote_field: "PID.5", description: "Nome do paciente" },
  { lis_field: "order_number", remote_field: "ORC.2", description: "Número do pedido" },
  { lis_field: "exam_code", remote_field: "OBR.4", description: "Código do exame" },
  { lis_field: "result_value", remote_field: "OBX.5", description: "Valor do resultado" },
  { lis_field: "result_unit", remote_field: "OBX.6", description: "Unidade do resultado" },
  { lis_field: "reference_range", remote_field: "OBX.7", description: "Faixa de referência" },
  { lis_field: "result_flag", remote_field: "OBX.8", description: "Flag (normal/alto/baixo)" },
];

const IntegrationDetailPage = ({ integrationId, onBack }: Props) => {
  const qc = useQueryClient();
  const isNew = !integrationId;
  const { register, handleSubmit, reset, control, watch } = useForm<IntForm>({ defaultValues });
  const currentName = watch("name");
  const [loaded, setLoaded] = useState(false);

  const currentStatus = watch("status");
  const currentType = watch("type");

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
        <Badge variant={currentStatus === "active" ? "default" : "secondary"} className="gap-1">
          {currentStatus === "active" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {currentStatus === "active" ? "Ativo" : "Inativo"}
        </Badge>
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

                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Informações de Conexão — {currentType}</h3>
                  {currentType === "HL7" && /dymind|maxcell|maxbio/i.test(currentName || integrationData?.name || "") && (<>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Protocolo: <strong className="text-foreground">MLLP sobre TCP/IP persistente</strong> — Framing: SB(0x0B) + Data + EB(0x1C) + CR(0x0D)</li>
                      <li>Versão: <strong className="text-foreground">HL7 v2.3.1</strong> — Character Set: <strong className="text-foreground">UTF-8 (UNICODE)</strong></li>
                      <li>Resultados/QC: <strong className="text-foreground">ORU^R01</strong> (envio) → <strong className="text-foreground">ACK^R01</strong> (confirmação)</li>
                      <li>Consulta bidirecional: <strong className="text-foreground">ORM^O01</strong> (query) → <strong className="text-foreground">ORR^O02</strong> (resposta com PID/PV1/ORC/OBR/OBX)</li>
                      <li>MSH-11: <strong className="text-foreground">P</strong>=Amostra/Pedido, <strong className="text-foreground">Q</strong>=QC</li>
                      <li>Segmentos: MSH, MSA, PID, PV1, OBR, OBX, ORC</li>
                      <li>OBR-4 tipos: <strong className="text-foreground">01001</strong>=CBC Auto, <strong className="text-foreground">01002</strong>=Manual, <strong className="text-foreground">01003</strong>=LJ QC, <strong className="text-foreground">01004</strong>=XB QC</li>
                      <li>Flags OBX-8: <strong className="text-foreground">N</strong>=Normal, <strong className="text-foreground">H</strong>=Alto, <strong className="text-foreground">L</strong>=Baixo, <strong className="text-foreground">A</strong>=Anormal (separados por ~)</li>
                      <li>Suporta histogramas/scattergramas em <strong className="text-foreground">BMP/PNG Base64</strong> (OBX tipo ED)</li>
                      <li>ACK timeout: reconexão automática se sem resposta no tempo configurado</li>
                    </ul>
                    <div className="mt-3 rounded border border-border bg-background p-3 space-y-2">
                      <h4 className="text-xs font-semibold text-foreground">Processo de Envio de Dados de Teste (Sending Test Data)</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        O analisador bioquímico envia as informações de amostra e os resultados dos exames ao servidor LIS <strong className="text-foreground">em unidades de amostras</strong>. 
                        Ou seja, uma amostra e seus respectivos resultados são enviados juntos como uma única mensagem. 
                        Após determinar (validar) a mensagem, o servidor LIS responde com o ACK apropriado.
                      </p>
                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">Fluxo de comunicação:</p>
                        <ol className="list-decimal ml-4 space-y-0.5">
                          <li>Analisador estabelece conexão TCP/IP com o servidor LIS</li>
                          <li>Analisador envia mensagem <strong className="text-foreground">ORU^R01</strong> contendo segmentos MSH + PID + OBR + OBX (1 amostra + N resultados)</li>
                          <li>LIS valida a mensagem e responde com <strong className="text-foreground">ACK^R01</strong> (AA=aceito, AE=erro, AR=rejeitado)</li>
                          <li>Próxima amostra é enviada somente após receber o ACK da anterior</li>
                        </ol>
                      </div>
                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">Estrutura da mensagem ORU^R01:</p>
                        <pre className="bg-muted rounded p-2 text-[10px] font-mono overflow-x-auto whitespace-pre">
{`MSH|^~\\&|MaxBIO200B|LAB|LIS|HOST|...|ORU^R01|...|P|2.3.1||||||UNICODE UTF-8
PID|||<patient_id>||<patient_name>||<DOB>|<sex>|...
OBR|1|<sample_barcode>||<test_code>^<test_name>||<collection_dt>|...
OBX|1|NM|<analyte_code>^<analyte_name>||<value>|<unit>|<ref_range>|<flag>|||F
OBX|2|NM|...`}
                        </pre>
                      </div>
                    </div>
                  )}
                  {currentType === "HL7" && !/dymind|maxcell|maxbio/i.test(currentName || integrationData?.name || "") && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Protocolo: <strong className="text-foreground">MLLP sobre TCP/IP</strong> — Framing: SB(0x0B) + Data + EB(0x1C) + CR(0x0D)</li>
                      <li>Versão: <strong className="text-foreground">HL7 v2.3.1</strong> — Character Set: ASCII</li>
                      <li>Mensagens de resultados: <strong className="text-foreground">ORU^R01</strong> (envio) → <strong className="text-foreground">ACK^R01</strong> (confirmação)</li>
                      <li>Consulta de amostras: <strong className="text-foreground">QRY^Q02</strong> → <strong className="text-foreground">QCK^Q02</strong> + <strong className="text-foreground">DSR^Q03</strong> → <strong className="text-foreground">ACK^Q03</strong></li>
                      <li>Segmentos: MSH, PID, OBR, OBX, MSA, ERR, QRD, QRF, QAK, DSP, DSC</li>
                    </ul>
                  )}
                  {currentType === "ASTM" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Protocolo: <strong className="text-foreground">ASTM E1381/E1394</strong> ou LIS2-A2</li>
                      <li>Comunicação via Serial (RS-232) ou TCP/IP</li>
                    </ul>
                  )}
                  {currentType === "FHIR" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Resources: DiagnosticReport, Observation, ServiceRequest</li>
                      <li>Auth: OAuth 2.0 / SMART on FHIR</li>
                    </ul>
                  )}
                  {currentType === "POCT" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Padrão: <strong className="text-foreground">CLSI POCT1-A2</strong></li>
                      <li>Camadas: Device → Access Point → LIS Gateway</li>
                    </ul>
                  )}
                  {currentType === "API" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>API REST — Content-Type: application/json</li>
                      <li>Métodos: GET, POST, PUT</li>
                    </ul>
                  )}
                  {currentType === "Portal" && (
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li>Portal web para laudos — webhook ou polling</li>
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
          <FieldMappingTab integrationId={integrationId} protocolType={currentType} />
        </TabsContent>

        {/* Tab 4: Logs / Histórico */}
        <TabsContent value="logs">
          <IntegrationLogsTab
            integrationId={integrationId}
            lastSync={integrationData?.last_sync}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Field Mapping Tab (editable) ───────────────────────────────────

interface MappingRow {
  id?: string;
  lis_field: string;
  remote_field: string;
  description: string;
  sort_order: number;
}

function FieldMappingTab({ integrationId, protocolType }: { integrationId: string | null; protocolType: string }) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MappingRow>({ lis_field: "", remote_field: "", description: "", sort_order: 0 });
  const [adding, setAdding] = useState(false);

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ["field-mappings", integrationId],
    queryFn: async () => {
      if (!integrationId) return [];
      const { data, error } = await supabase
        .from("integration_field_mappings" as any)
        .select("*")
        .eq("integration_id", integrationId)
        .order("sort_order");
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!integrationId,
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      if (!integrationId) return;
      const rows = DEFAULT_MAPPINGS.map((m, i) => ({
        integration_id: integrationId,
        lis_field: m.lis_field,
        remote_field: m.remote_field,
        description: m.description,
        sort_order: i,
      }));
      const { error } = await supabase.from("integration_field_mappings" as any).insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["field-mappings", integrationId] });
      toast.success("Mapeamento padrão carregado");
    },
    onError: () => toast.error("Erro ao carregar mapeamento padrão"),
  });

  const saveMutation = useMutation({
    mutationFn: async (row: MappingRow) => {
      if (row.id) {
        const { error } = await supabase
          .from("integration_field_mappings" as any)
          .update({ lis_field: row.lis_field, remote_field: row.remote_field, description: row.description, sort_order: row.sort_order })
          .eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("integration_field_mappings" as any)
          .insert({ integration_id: integrationId, lis_field: row.lis_field, remote_field: row.remote_field, description: row.description, sort_order: row.sort_order });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["field-mappings", integrationId] });
      setEditingId(null);
      setAdding(false);
      setDraft({ lis_field: "", remote_field: "", description: "", sort_order: 0 });
      toast.success("Mapeamento salvo");
    },
    onError: () => toast.error("Erro ao salvar mapeamento"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("integration_field_mappings" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["field-mappings", integrationId] });
      toast.success("Mapeamento removido");
    },
    onError: () => toast.error("Erro ao remover mapeamento"),
  });

  const startEdit = (m: any) => {
    setEditingId(m.id);
    setDraft({ id: m.id, lis_field: m.lis_field, remote_field: m.remote_field, description: m.description, sort_order: m.sort_order });
    setAdding(false);
  };

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    setDraft({ lis_field: "", remote_field: "", description: "", sort_order: mappings.length });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAdding(false);
    setDraft({ lis_field: "", remote_field: "", description: "", sort_order: 0 });
  };

  if (!integrationId) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Salve a integração primeiro para configurar o mapeamento de campos.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Mapeamento de Campos LIS ↔ Sistema Externo</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Correspondência entre campos internos do LIS e segmentos do protocolo ({protocolType})
            </p>
          </div>
          <div className="flex items-center gap-2">
            {mappings.length === 0 && !adding && (
              <Button size="sm" variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                Carregar Padrão
              </Button>
            )}
            <Button size="sm" onClick={startAdd} disabled={adding}>
              <Plus className="h-4 w-4 mr-1" /> Novo Campo
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Campo LIS</TableHead>
              <TableHead>Campo Remoto</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : mappings.length === 0 && !adding ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhum mapeamento configurado. Clique em "Carregar Padrão" ou "Novo Campo".
              </TableCell></TableRow>
            ) : (
              mappings.map((m: any, i: number) => (
                editingId === m.id ? (
                  <TableRow key={m.id} className="bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <Input
                        value={draft.lis_field}
                        onChange={(e) => setDraft(d => ({ ...d, lis_field: e.target.value }))}
                        className="h-8 text-xs font-mono"
                        placeholder="ex: patient_id"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.remote_field}
                        onChange={(e) => setDraft(d => ({ ...d, remote_field: e.target.value }))}
                        className="h-8 text-xs font-mono"
                        placeholder="ex: PID.3"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.description}
                        onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                        className="h-8 text-xs"
                        placeholder="Descrição do campo"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" className="h-7 text-xs px-2" onClick={() => saveMutation.mutate(draft)} disabled={!draft.lis_field || !draft.remote_field}>
                          <Save className="h-3 w-3 mr-1" />OK
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={cancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50" onClick={() => startEdit(m)}>
                    <TableCell className="text-xs text-muted-foreground">
                      <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.lis_field}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{m.remote_field}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.description}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(m.id); }}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              ))
            )}
            {/* Add new row */}
            {adding && (
              <TableRow className="bg-muted/30">
                <TableCell className="text-xs text-muted-foreground">+</TableCell>
                <TableCell>
                  <Input
                    value={draft.lis_field}
                    onChange={(e) => setDraft(d => ({ ...d, lis_field: e.target.value }))}
                    className="h-8 text-xs font-mono"
                    placeholder="ex: patient_id"
                    autoFocus
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={draft.remote_field}
                    onChange={(e) => setDraft(d => ({ ...d, remote_field: e.target.value }))}
                    className="h-8 text-xs font-mono"
                    placeholder="ex: PID.3"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={draft.description}
                    onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="Descrição do campo"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="default" className="h-7 text-xs px-2" onClick={() => saveMutation.mutate(draft)} disabled={!draft.lis_field || !draft.remote_field}>
                      <Save className="h-3 w-3 mr-1" />OK
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="p-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 Clique em uma linha para editar. Os mapeamentos definem como os dados são traduzidos entre o LIS e o sistema externo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default IntegrationDetailPage;
