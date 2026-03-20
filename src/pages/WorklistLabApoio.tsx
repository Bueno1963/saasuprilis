import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, X, Printer, Building2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const WorklistLabApoio = () => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [search, setSearch] = useState("");

  const { data: samples = [], isLoading } = useQuery({
    queryKey: ["samples-lab-apoio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("samples")
        .select("*, orders(order_number, patients(name))")
        .eq("condition", "enviado_lab_apoio")
        .order("collected_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredSamples = samples.filter(s => {
    const collected = new Date(s.collected_at);
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (collected < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (collected > to) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const patientName = (s.orders as any)?.patients?.name || "";
      if (!patientName.toLowerCase().includes(q) && !s.barcode.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const hasDateFilter = !!dateFrom || !!dateTo;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const dateRange = dateFrom || dateTo
      ? `Período: ${dateFrom ? format(dateFrom, "dd/MM/yyyy") : "—"} até ${dateTo ? format(dateTo, "dd/MM/yyyy") : "—"}`
      : `Data: ${format(new Date(), "dd/MM/yyyy")}`;
    printWindow.document.write(`
      <html><head><title>Esteira Lab. Apoio</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { margin-bottom: 4px; }
        .sub { color: #666; font-size: 13px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
        th { background: #f0f0f0; font-weight: 600; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h2>Esteira Lab. Apoio</h2>
      <p class="sub">${dateRange} · ${filteredSamples.length} amostra(s)</p>
      <table>
        <thead><tr><th>Código</th><th>Paciente</th><th>Setor</th><th>Material</th><th>Status</th><th>Data da Coleta</th></tr></thead>
        <tbody>
          ${filteredSamples.map(s => `<tr>
            <td>${s.barcode}</td>
            <td>${(s.orders as any)?.patients?.name || "—"}</td>
            <td>${s.sector}</td>
            <td>${s.sample_type}</td>
            <td>${s.status}</td>
            <td>${new Date(s.collected_at).toLocaleString("pt-BR")}</td>
          </tr>`).join("")}
        </tbody>
      </table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Esteira Lab. Apoio</h1>
            <p className="text-sm text-muted-foreground">Amostras enviadas para laboratório de apoio</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Buscar paciente ou código..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-[220px]"
        />
        <span className="text-sm font-medium text-muted-foreground">Período:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("w-[150px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "De"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <span className="text-sm text-muted-foreground">até</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("w-[150px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {dateTo ? format(dateTo, "dd/MM/yyyy") : "Até"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        {hasDateFilter && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
            <X className="h-3.5 w-3.5 mr-1" /> Limpar
          </Button>
        )}
        <Button variant="outline" size="sm" className="ml-auto" disabled={filteredSamples.length === 0} onClick={handlePrint}>
          <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Amostras no Lab. Apoio — {filteredSamples.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : filteredSamples.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma amostra enviada para laboratório de apoio</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Coleta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.map(sample => (
                  <TableRow key={sample.id}>
                    <TableCell className="font-mono text-sm">{sample.barcode}</TableCell>
                    <TableCell>{(sample.orders as any)?.patients?.name || "—"}</TableCell>
                    <TableCell className="text-sm">{(sample.orders as any)?.order_number}</TableCell>
                    <TableCell>{sample.sector}</TableCell>
                    <TableCell>{sample.sample_type}</TableCell>
                    <TableCell><StatusBadge status={sample.status} /></TableCell>
                    <TableCell className="text-sm">{new Date(sample.collected_at).toLocaleString("pt-BR")}</TableCell>
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

export default WorklistLabApoio;
