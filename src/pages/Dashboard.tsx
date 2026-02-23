import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { dashboardStats, mockOrders, mockSamples, mockResults } from "@/lib/mock-data";
import { TestTubes, FileCheck, AlertTriangle, Activity, Cpu, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Dashboard = () => {
  const recentOrders = mockOrders.slice(0, 5);
  const criticalResults = mockResults.filter(r => r.flag === "critical" || r.flag === "high");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do laboratório — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Amostras Hoje" value={dashboardStats.totalSamplesToday} icon={TestTubes} variant="info" />
        <StatCard title="Resultados Pendentes" value={dashboardStats.pendingResults} icon={AlertTriangle} variant="warning" />
        <StatCard title="Liberados Hoje" value={dashboardStats.releasedToday} icon={FileCheck} variant="success" />
        <StatCard title="Pedidos Urgentes" value={dashboardStats.urgentOrders} icon={Activity} variant="critical" />
        <StatCard title="Equipamentos" value={`${dashboardStats.equipmentOnline}/${dashboardStats.equipmentTotal}`} subtitle="Online" icon={Cpu} variant="default" />
        <StatCard title="CQ Aprovação" value={`${dashboardStats.qcPassRate}%`} icon={TrendingUp} variant="success" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
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
                {recentOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="text-xs font-mono">{order.id}</TableCell>
                    <TableCell className="text-sm">{order.patientName}</TableCell>
                    <TableCell><StatusBadge status={order.status} /></TableCell>
                    <TableCell><StatusBadge status={order.priority} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Resultados com Alerta</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <TableCell className="text-sm">{result.patientName}</TableCell>
                    <TableCell className="text-sm">{result.exam}</TableCell>
                    <TableCell className="text-sm font-mono">{result.value} {result.unit}</TableCell>
                    <TableCell><StatusBadge status={result.flag} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Pipeline de Amostras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { label: "Coletadas", count: mockSamples.filter(s => s.status === "collected").length, color: "bg-warning" },
              { label: "Triadas", count: mockSamples.filter(s => s.status === "triaged").length, color: "bg-info" },
              { label: "Processando", count: mockSamples.filter(s => s.status === "processing").length, color: "bg-phase-analytical" },
              { label: "Analisadas", count: mockSamples.filter(s => s.status === "analyzed").length, color: "bg-accent" },
              { label: "Liberadas", count: mockSamples.filter(s => s.status === "released").length, color: "bg-success" },
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
