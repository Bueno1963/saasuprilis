import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, Shield, AlertTriangle, Thermometer, Activity, Calendar } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const STATUS_LABELS: Record<string, string> = {
  collected: "Coletado",
  triaged: "Triado",
  processing: "Processando",
  analyzed: "Analisado",
};

const SEVERITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

const ComplianceReportTab = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: samples = [] } = useQuery({
    queryKey: ["compliance-samples", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("samples")
        .select("*, orders(order_number, patients(name))")
        .gte("collected_at", `${startDate}T00:00:00`)
        .lte("collected_at", `${endDate}T23:59:59`)
        .order("collected_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: trackingEvents = [] } = useQuery({
    queryKey: ["compliance-tracking", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sample_tracking_events")
        .select("*")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: nonconformities = [] } = useQuery({
    queryKey: ["compliance-nc", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sample_nonconformities")
        .select("*, samples(barcode)")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tempLogs = [] } = useQuery({
    queryKey: ["compliance-temp", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sample_temperature_logs")
        .select("*, samples(barcode)")
        .gte("recorded_at", `${startDate}T00:00:00`)
        .lte("recorded_at", `${endDate}T23:59:59`)
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: labSettings } = useQuery({
    queryKey: ["lab-settings-report"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const totalSamples = samples.length;
  const rejectedSamples = samples.filter(s => s.is_rejected).length;
  const rejectionRate = totalSamples > 0 ? ((rejectedSamples / totalSamples) * 100).toFixed(1) : "0";
  const totalNC = nonconformities.length;
  const resolvedNC = nonconformities.filter(nc => nc.resolved).length;
  const tempDeviations = tempLogs.filter(t => !t.is_within_range).length;
  const totalTempLogs = tempLogs.length;

  const generatePDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const labName = labSettings?.name || "Laboratório";
    const labCnpj = labSettings?.cnpj || "";

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 55, 90);
    doc.text("RELATÓRIO DE CONFORMIDADE", pw / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text("RDC 978/2025 — ANVISA", pw / 2, 27, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(labName, pw / 2, 34, { align: "center" });
    if (labCnpj) doc.text(`CNPJ: ${labCnpj}`, pw / 2, 39, { align: "center" });

    doc.setDrawColor(20, 55, 90);
    doc.setLineWidth(0.5);
    doc.line(14, 43, pw - 14, 43);

    // Period
    let y = 50;
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.setFont("helvetica", "bold");
    doc.text("Período: ", 14, y);
    doc.setFont("helvetica", "normal");
    const periodText = `${new Date(startDate).toLocaleDateString("pt-BR")} a ${new Date(endDate).toLocaleDateString("pt-BR")}`;
    doc.text(periodText, 14 + doc.getTextWidth("Período: "), y);
    y += 5;
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, y);
    y += 10;

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 55, 90);
    doc.text("1. RESUMO EXECUTIVO", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: [
        ["Total de Amostras", String(totalSamples)],
        ["Amostras Rejeitadas", `${rejectedSamples} (${rejectionRate}%)`],
        ["Eventos de Rastreabilidade", String(trackingEvents.length)],
        ["Não-Conformidades Registradas", String(totalNC)],
        ["Não-Conformidades Resolvidas", `${resolvedNC} de ${totalNC}`],
        ["Registros de Temperatura", String(totalTempLogs)],
        ["Desvios de Temperatura", String(tempDeviations)],
      ],
      theme: "grid",
      headStyles: { fillColor: [20, 55, 90], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable?.finalY + 10 || y + 50;

    // Non-conformities detail
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 55, 90);
    doc.text("2. NÃO-CONFORMIDADES", 14, y);
    y += 6;

    if (nonconformities.length === 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text("Nenhuma não-conformidade registrada no período.", 14, y);
      y += 8;
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Amostra", "Motivo", "Severidade", "Resolvida", "Ação Corretiva"]],
        body: nonconformities.map(nc => [
          (nc.samples as any)?.barcode || "—",
          nc.reason,
          SEVERITY_LABELS[nc.severity] || nc.severity,
          nc.resolved ? "Sim" : "Não",
          nc.corrective_action || "—",
        ]),
        theme: "grid",
        headStyles: { fillColor: [20, 55, 90], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 4: { cellWidth: 45 } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable?.finalY + 10 || y + 30;
    }

    // Check if need new page
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = 20;
    }

    // Temperature deviations
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 55, 90);
    doc.text("3. CONTROLE DE TEMPERATURA", 14, y);
    y += 6;

    const deviationLogs = tempLogs.filter(t => !t.is_within_range);
    if (deviationLogs.length === 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text("Nenhum desvio de temperatura registrado no período.", 14, y);
      y += 8;
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Amostra", "Temperatura (°C)", "Faixa Aceitável", "Local", "Data/Hora"]],
        body: deviationLogs.map(t => [
          (t.samples as any)?.barcode || "—",
          `${t.temperature_celsius}°C`,
          `${t.min_acceptable}–${t.max_acceptable}°C`,
          t.location || "—",
          new Date(t.recorded_at).toLocaleString("pt-BR"),
        ]),
        theme: "grid",
        headStyles: { fillColor: [180, 50, 50], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable?.finalY + 10 || y + 30;
    }

    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = 20;
    }

    // Rejected samples
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 55, 90);
    doc.text("4. AMOSTRAS REJEITADAS", 14, y);
    y += 6;

    const rejected = samples.filter(s => s.is_rejected);
    if (rejected.length === 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text("Nenhuma amostra rejeitada no período.", 14, y);
      y += 8;
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Código", "Pedido", "Paciente", "Material", "Motivo Rejeição"]],
        body: rejected.map(s => [
          s.barcode,
          (s.orders as any)?.order_number || "—",
          (s.orders as any)?.patients?.name || "—",
          s.sample_type,
          s.rejection_reason || "—",
        ]),
        theme: "grid",
        headStyles: { fillColor: [20, 55, 90], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const ph = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Relatório de Conformidade RDC 978/2025 — ${labName} — Página ${i} de ${totalPages}`,
        pw / 2, ph - 8, { align: "center" }
      );
      doc.text(
        "Documento gerado eletronicamente para fins de auditoria e fiscalização ANVISA.",
        pw / 2, ph - 4, { align: "center" }
      );
    }

    doc.save(`relatorio-rdc978-${startDate}-a-${endDate}.pdf`);
    toast.success("Relatório PDF gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Data Início</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data Fim</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
        </div>
        <Button onClick={generatePDF} className="gap-2">
          <FileDown className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Activity className="w-3.5 h-3.5" /> Total de Amostras
            </div>
            <p className="text-2xl font-bold text-foreground">{totalSamples}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Taxa de Rejeição
            </div>
            <p className="text-2xl font-bold text-foreground">{rejectionRate}%</p>
            <p className="text-xs text-muted-foreground">{rejectedSamples} rejeitadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Shield className="w-3.5 h-3.5" /> Não-Conformidades
            </div>
            <p className="text-2xl font-bold text-foreground">{totalNC}</p>
            <p className="text-xs text-muted-foreground">{resolvedNC} resolvidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Thermometer className="w-3.5 h-3.5" /> Desvios Temperatura
            </div>
            <p className="text-2xl font-bold text-foreground">{tempDeviations}</p>
            <p className="text-xs text-muted-foreground">de {totalTempLogs} registros</p>
          </CardContent>
        </Card>
      </div>

      {/* Non-conformities summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Não-Conformidades no Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nonconformities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma não-conformidade no período selecionado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amostra</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação Corretiva</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonconformities.slice(0, 10).map(nc => (
                  <TableRow key={nc.id}>
                    <TableCell className="font-mono text-xs">{(nc.samples as any)?.barcode || "—"}</TableCell>
                    <TableCell className="text-sm">{nc.reason}</TableCell>
                    <TableCell>
                      <Badge variant={nc.severity === "critica" || nc.severity === "alta" ? "destructive" : "secondary"} className="text-xs">
                        {SEVERITY_LABELS[nc.severity] || nc.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={nc.resolved ? "default" : "outline"} className="text-xs">
                        {nc.resolved ? "Resolvida" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{nc.corrective_action || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Temperature deviations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-destructive" />
            Desvios de Temperatura no Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tempDeviations === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum desvio de temperatura no período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amostra</TableHead>
                  <TableHead>Temperatura</TableHead>
                  <TableHead>Faixa Aceitável</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tempLogs.filter(t => !t.is_within_range).slice(0, 10).map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{(t.samples as any)?.barcode || "—"}</TableCell>
                    <TableCell className="text-sm font-semibold text-destructive">{t.temperature_celsius}°C</TableCell>
                    <TableCell className="text-sm">{t.min_acceptable}–{t.max_acceptable}°C</TableCell>
                    <TableCell className="text-sm">{t.location || "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(t.recorded_at).toLocaleString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceReportTab;
