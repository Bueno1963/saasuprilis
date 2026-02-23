import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { TestTubes, FileCheck, AlertTriangle, Activity, Cpu, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, patients(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: samples = [] } = useQuery({
    queryKey: ["samples"],
    queryFn: async () => {
      const { data, error } = await supabase.from("samples").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: results = [] } = useQuery({
    queryKey: ["results"],
    queryFn: async () => {
      const { data, error } = await supabase.from("results").select("*, orders(order_number, patients(name))");
      if (error) throw error;
      return data;
    },
  });

  const pendingResults = results.filter(r => r.status === "pending").length;
  const releasedResults = results.filter(r => r.status === "released").length;
  const urgentOrders = orders.filter(o => o.priority === "urgent").length;
  const criticalResults = results.filter(r => r.flag === "critical" || r.flag === "high");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do laboratório — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Amostras" value={samples.length} icon={TestTubes} variant="info" />
        <StatCard title="Resultados Pendentes" value={pendingResults} icon={AlertTriangle} variant="warning" />
        <StatCard title="Liberados" value={releasedResults} icon={FileCheck} variant="success" />
        <StatCard title="Pedidos Urgentes" value={urgentOrders} icon={Activity} variant="critical" />
        <StatCard title="Pedidos Total" value={orders.length} icon={Cpu} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum pedido cadastrado ainda</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Pedido</TableHead>
                    <TableHead className="text-xs">Paciente</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Prior.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 5).map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="text-xs font-mono">{order.order_number}</TableCell>
                      <TableCell className="text-sm">{(order.patients as any)?.name}</TableCell>
                      <TableCell><StatusBadge status={order.status} /></TableCell>
                      <TableCell><StatusBadge status={order.priority} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Resultados com Alerta</CardTitle>
          </CardHeader>
          <CardContent>
            {criticalResults.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhum resultado com alerta</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Paciente</TableHead>
                    <TableHead className="text-xs">Exame</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs">Flag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalResults.map(result => (
                    <TableRow key={result.id}>
                      <TableCell className="text-sm">{(result.orders as any)?.patients?.name}</TableCell>
                      <TableCell className="text-sm">{result.exam}</TableCell>
                      <TableCell className="text-sm font-mono">{result.value} {result.unit}</TableCell>
                      <TableCell><StatusBadge status={result.flag} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Pipeline de Amostras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { label: "Coletadas", count: samples.filter(s => s.status === "collected").length, color: "bg-warning" },
              { label: "Triadas", count: samples.filter(s => s.status === "triaged").length, color: "bg-info" },
              { label: "Processando", count: samples.filter(s => s.status === "processing").length, color: "bg-phase-analytical" },
              { label: "Analisadas", count: samples.filter(s => s.status === "analyzed").length, color: "bg-accent" },
              { label: "Liberadas", count: samples.filter(s => s.status === "released").length, color: "bg-success" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center text-lg font-bold text-white`}>
                    {step.count}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1.5 font-medium">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-8 h-0.5 bg-border shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
