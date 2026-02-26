import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#244294", "#258E94", "#E6A817", "#D14343", "#6B7280"];

const RelatoriosTab = () => {
  const { data: receivables = [] } = useQuery({
    queryKey: ["receivables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("receivables").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: payables = [] } = useQuery({
    queryKey: ["payables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payables").select("*");
      if (error) throw error;
      return data;
    },
  });

  const totalReceivable = receivables.reduce((s: number, r: any) => s + Number(r.net_amount || 0), 0);
  const totalPaid = receivables.filter((r: any) => r.status === "pago").reduce((s: number, r: any) => s + Number(r.paid_amount || 0), 0);
  const totalPending = receivables.filter((r: any) => r.status === "pendente").reduce((s: number, r: any) => s + Number(r.net_amount || 0), 0);
  const totalPayable = payables.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const totalPayablePaid = payables.filter((p: any) => p.status === "pago").reduce((s: number, p: any) => s + Number(p.paid_amount || 0), 0);
  const totalOverdue = payables.filter((p: any) => p.status === "pendente" && new Date(p.due_date) < new Date()).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  // Payment type distribution
  const byType = receivables.reduce((acc: any, r: any) => {
    const t = r.payment_type === "convenio" ? "Convênio" : "Particular";
    acc[t] = (acc[t] || 0) + Number(r.net_amount || 0);
    return acc;
  }, {});
  const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  // Payable categories
  const byCategory = payables.reduce((acc: any, p: any) => {
    acc[p.category] = (acc[p.category] || 0) + Number(p.amount || 0);
    return acc;
  }, {});
  const barData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalReceivable.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">R$ {totalPaid.toFixed(2)} recebido</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{receivables.filter((r: any) => r.status === "pendente").length} conta(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalPayable.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">R$ {totalPayablePaid.toFixed(2)} pago</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ {totalOverdue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Contas a pagar vencidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Receita por Tipo de Pagamento</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `R$ ${Number(v).toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => `R$ ${Number(v).toFixed(2)}`} />
                  <Bar dataKey="value" fill="#244294" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RelatoriosTab;
