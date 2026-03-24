import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ArrowDownUp, CheckCircle2, XCircle, Clock, Users, FlaskConical, Send, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const RelatorioAmostrasSyncPage = () => {
  const qc = useQueryClient();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const { data: integrations = [] } = useQuery({
    queryKey: ["active-integrations"],
    queryFn: async () => {
      const { data } = await supabase.from("integrations").select("id, name").eq("status", "active").limit(10);
      return data || [];
    },
  });

  const handleForceSend = async (sample: any) => {
    setSendingId(sample.id);
    try {
      const integration = integrations[0];
      if (!integration) { toast.error("Nenhuma integração ativa encontrada"); return; }
      await supabase.from("samples").update({ status: "processing" }).eq("id", sample.id);
      await supabase.from("integration_sync_logs").insert({
        integration_id: integration.id, status: "success", direction: "outbound",
        source_system: "LIS", destination_system: integration.name,
        message: `Envio manual forçado: amostra ${sample.barcode} — Setor: ${sample.sector}`,
        records_created: 1, records_updated: 0, records_failed: 0, duration_ms: 0,
      });
      await supabase.from("integrations").update({ last_sync: new Date().toISOString() }).eq("id", integration.id);
      qc.invalidateQueries({ queryKey: ["synced-samples-report"] });
      qc.invalidateQueries({ queryKey: ["sync-logs-report"] });
      toast.success(`Amostra ${sample.barcode} enviada para ${integration.name}`);
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err.message || "desconhecido"));
    } finally { setSendingId(null); }
  };

  const handleForceReceive = async (sample: any) => {
    setReceivingId(sample.id);
    try {
      const integration = integrations[0];
      if (!integration) { toast.error("Nenhuma integração ativa encontrada"); return; }
      const newStatus = sample.status === "analyzed" ? "completed" : "analyzed";
      await supabase.from("samples").update({ status: newStatus }).eq("id", sample.id);
      await supabase.from("integration_sync_logs").insert({
        integration_id: integration.id, status: "success", direction: "inbound",
        source_system: integration.name, destination_system: "LIS",
        message: `Recebimento manual forçado: amostra ${sample.barcode} → status ${newStatus}`,
        records_created: 0, records_updated: 1, records_failed: 0, duration_ms: 0,
      });
      await supabase.from("integrations").update({ last_sync: new Date().toISOString() }).eq("id", integration.id);
      qc.invalidateQueries({ queryKey: ["synced-samples-report"] });
      qc.invalidateQueries({ queryKey: ["sync-logs-report"] });
      toast.success(`Dados recebidos para amostra ${sample.barcode}`);
    } catch (err: any) {
      toast.error("Erro ao receber: " + (err.message || "desconhecido"));
    } finally { setReceivingId(null); }
  };

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["sync-logs-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_sync_logs")
        .select("*, integrations(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Samples that were synced (processing/completed status = touched by integration)
  const { data: syncedSamples = [], isLoading: samplesLoading } = useQuery({
    queryKey: ["synced-samples-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("samples")
        .select("*, orders(order_number, doctor_name, exams, patient_id, patients(name, cpf, birth_date, gender))")
        .in("status", ["processing", "completed", "analyzed"])
        .order("collected_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data;
    },
  });

  const totalSuccess = logs.filter((l) => l.status === "success").length;
  const totalError = logs.filter((l) => l.status === "error").length;
  const totalRecordsCreated = logs.reduce((s, l) => s + (l.records_created || 0), 0);
  const totalRecordsUpdated = logs.reduce((s, l) => s + (l.records_updated || 0), 0);

  // Unique patients from synced samples
  const patientMap = new Map<string, any>();
  syncedSamples.forEach((s: any) => {
    const patient = s.orders?.patients;
    if (patient && s.orders?.patient_id) {
      patientMap.set(s.orders.patient_id, {
        ...patient,
        id: s.orders.patient_id,
        order_number: s.orders.order_number,
        doctor_name: s.orders.doctor_name,
      });
    }
  });
  const uniquePatients = Array.from(patientMap.values());

  // Exams from synced samples
  const examsList: { exam: string; barcode: string; patient: string; status: string; sector: string; collectedAt: string }[] = [];
  syncedSamples.forEach((s: any) => {
    const patientName = s.orders?.patients?.name || "—";
    const exams: string[] = s.orders?.exams || [];
    exams.forEach((exam) => {
      examsList.push({
        exam,
        barcode: s.barcode,
        patient: patientName,
        status: s.status,
        sector: s.sector || "—",
        collectedAt: s.collected_at,
      });
    });
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Relatório de Amostras Sincronizadas
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastro de pacientes e exames sincronizados com equipamentos integrados
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Total Syncs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{totalSuccess}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <XCircle className="h-3 w-3 text-destructive" /> Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{totalError}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Users className="h-3 w-3 text-primary" /> Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{uniquePatients.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <FlaskConical className="h-3 w-3 text-primary" /> Exames
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{examsList.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="patients" className="space-y-4">
        <TabsList className="bg-muted/60 border border-border p-1 h-auto gap-1 flex-wrap">
          <TabsTrigger value="patients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-5 py-2.5 text-sm font-semibold rounded-md transition-all">
            <Users className="h-4 w-4 mr-2" /> Pacientes Sincronizados
          </TabsTrigger>
          <TabsTrigger value="exams" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-5 py-2.5 text-sm font-semibold rounded-md transition-all">
            <FlaskConical className="h-4 w-4 mr-2" /> Exames Sincronizados
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-5 py-2.5 text-sm font-semibold rounded-md transition-all">
            <ArrowDownUp className="h-4 w-4 mr-2" /> Log de Sincronização
          </TabsTrigger>
        </TabsList>

        {/* Patients Tab */}
        <TabsContent value="patients">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Exames</TableHead>
                     <TableHead>Carga</TableHead>
                     <TableHead>Descarga</TableHead>
                    <TableHead>Log/Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samplesLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                  ) : syncedSamples.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum paciente sincronizado</TableCell></TableRow>
                  ) : syncedSamples.map((s: any) => {
                    const patientName = s.orders?.patients?.name || "—";
                    const orderNumber = s.orders?.order_number || "—";
                    const exams: string[] = s.orders?.exams || [];
                    const sampleLogs = logs.filter((l) => l.message?.includes(s.barcode) || l.message?.includes(orderNumber));
                    const outboundLog = sampleLogs.find((l) => l.direction === "outbound");
                    const inboundLog = sampleLogs.find((l) => l.direction === "inbound");
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{patientName}</TableCell>
                        <TableCell className="text-sm font-mono">{orderNumber}</TableCell>
                        <TableCell className="text-sm">{exams.join(", ") || "—"}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={outboundLog?.status === "success" ? "secondary" : "default"}
                            className="gap-1 text-xs h-7"
                            disabled={sendingId === s.id}
                            onClick={() => handleForceSend(s)}
                          >
                            <Send className="h-3 w-3" />
                            {outboundLog?.status === "success" ? "Carga ✓" : "Carga"}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={inboundLog?.status === "success" ? "secondary" : "outline"}
                            className="gap-1 text-xs h-7"
                            disabled={receivingId === s.id}
                            onClick={() => handleForceReceive(s)}
                          >
                            <Download className="h-3 w-3" />
                            {inboundLog?.status === "success" ? "Recebido ✓" : "Receber"}
                          </Button>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {sampleLogs.length > 0
                            ? <span className={sampleLogs[0].message?.includes("Envio manual forçado") ? "text-destructive font-semibold" : "text-muted-foreground"}>{sampleLogs[0].error_message || sampleLogs[0].message || s.status}</span>
                            : <span className="text-muted-foreground">{s.status === "completed" ? "Concluído" : s.status === "analyzed" ? "Analisado" : "Em Processo"}</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exame</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Código Barras</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Coleta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {samplesLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                  ) : examsList.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum exame sincronizado</TableCell></TableRow>
                  ) : examsList.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{e.exam}</TableCell>
                      <TableCell className="text-sm">{e.patient}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{e.barcode}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{e.sector}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={e.status === "completed" ? "default" : "secondary"} className="text-xs">
                          {e.status === "completed" ? "Concluído" : e.status === "analyzed" ? "Analisado" : "Em Processo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(e.collectedAt).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Direção</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead className="text-right">Criados</TableHead>
                    <TableHead className="text-right">Atualizados</TableHead>
                    <TableHead className="text-right">Falhas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        Nenhuma sincronização registrada
                      </TableCell>
                    </TableRow>
                  ) : logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {(log as any).integrations?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.direction === "outbound" ? "⬆ Envio" : "⬇ Recebimento"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-xs">
                          {log.status === "success" ? "Sucesso" : "Erro"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                        {log.error_message || log.message || "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">{log.records_created}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{log.records_updated}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-destructive">{log.records_failed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelatorioAmostrasSyncPage;
