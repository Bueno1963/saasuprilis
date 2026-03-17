import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { mockQCData } from "@/lib/mock-data";
import QCManagementSettings from "@/components/settings/QCManagementSettings";
import BioquimicaDailySheet from "@/components/qc/BioquimicaDailySheet";
import NovoAnalitoSheet from "@/components/qc/NovoAnalitoSheet";
import { ChevronDown, FlaskConical } from "lucide-react";

const QualityControl = () => {
  const [activeView, setActiveView] = useState<string>("main");

  const { data: qcData = [] } = useQuery({
    queryKey: ["qc_data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qc_data")
        .select("*")
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const displayData = qcData.length > 0 ? qcData : mockQCData.map(d => ({
    ...d,
    recorded_at: d.date,
    recorded_by: null,
    equipment: d.equipment,
  }));

  const mean = displayData.length > 0 ? displayData[0].mean : 95;
  const sd = displayData.length > 0 ? displayData[0].sd : 3;

  const chartData = displayData.map(d => ({
    date: (d.recorded_at || "").slice(5, 10),
    value: Number(Number(d.value).toFixed(2)),
    status: d.status,
  }));

  const dailySheetViews: Record<string, string> = {
    "bioq-normal": "Bioquímica Normal",
    "bioq-patologica": "Bioquímica Patológica",
    "pro-ex": "Pró Ex",
    "hemato-normal": "Hematologia Nível Normal",
    "hemato-baixa": "Hematologia Baixa",
    "hemato-alta": "Hematologia Alta",
  };

  if (activeView === "novo-analito-pro-in" || activeView === "novo-analito-niveis") {
    const sheetTitle = activeView === "novo-analito-pro-in" ? "Lançar Parâmetros Pro IN" : "Lançar Parâmetros Controle Qualidade";
    return (
      <div className="p-6">
        <NovoAnalitoSheet onBack={() => setActiveView("gestao-cq")} title={sheetTitle} />
      </div>
    );
  }

  if (activeView !== "main" && activeView !== "gestao-cq") {
    return (
      <div className="p-6">
        <BioquimicaDailySheet
          onBack={() => setActiveView("main")}
          title={dailySheetViews[activeView] || activeView}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Controle de Qualidade</h1>
        <p className="text-sm text-muted-foreground">Monitoramento de precisão analítica e gestão de controles</p>
      </div>

      <Tabs defaultValue={activeView === "gestao-cq" ? "gestao" : "levey-jennings"} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="levey-jennings">Levey-Jennings</TabsTrigger>
            <TabsTrigger value="gestao">Gestão CQ</TabsTrigger>
          </TabsList>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <FlaskConical className="h-4 w-4" />
                Lançamentos Diários
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveView("bioq-normal")}>Bioquímica Normal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("bioq-patologica")}>Bioquímica Patológica</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("pro-ex")}>Pró Ex</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("hemato-normal")}>Hematologia Nível Normal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("hemato-baixa")}>Hematologia Baixa</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView("hemato-alta")}>Hematologia Alta</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="levey-jennings" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Glicose — Nível 1 — Cobas c311</CardTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Média: <strong className="text-foreground">{mean} mg/dL</strong></span>
                  <span>DP: <strong className="text-foreground">{sd}</strong></span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[mean - 4 * sd, mean + 4 * sd]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <ReferenceLine y={mean} stroke="hsl(var(--success))" strokeDasharray="5 5" label={{ value: "Média", position: "right", fontSize: 10 }} />
                  <ReferenceLine y={mean + sd} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: "+1DP", position: "right", fontSize: 10 }} />
                  <ReferenceLine y={mean - sd} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: "-1DP", position: "right", fontSize: 10 }} />
                  <ReferenceLine y={mean + 2 * sd} stroke="hsl(var(--critical))" strokeDasharray="3 3" label={{ value: "+2DP", position: "right", fontSize: 10 }} />
                  <ReferenceLine y={mean - 2 * sd} stroke="hsl(var(--critical))" strokeDasharray="3 3" label={{ value: "-2DP", position: "right", fontSize: 10 }} />
                  <ReferenceLine y={mean + 3 * sd} stroke="hsl(var(--critical))" strokeWidth={2} label={{ value: "+3DP", position: "right", fontSize: 10 }} />
                  <ReferenceLine y={mean - 3 * sd} stroke="hsl(var(--critical))" strokeWidth={2} label={{ value: "-3DP", position: "right", fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={({ cx, cy, payload }: any) => {
                      const color = payload.status === "fail" ? "hsl(var(--critical))" : payload.status === "warning" ? "hsl(var(--warning))" : "hsl(var(--success))";
                      return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={2} />;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Histórico de Controle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-2">
                {displayData.slice(0, 20).map((qc, i) => (
                  <div key={qc.id || i} className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/50">
                    <span className="text-[10px] text-muted-foreground">{(qc.recorded_at || "").slice(5, 10)}</span>
                    <span className="text-sm font-mono font-medium">{Number(qc.value).toFixed(1)}</span>
                    <StatusBadge status={qc.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gestao">
          <QCManagementSettings onBack={() => {}} embedded onNovoAnalitoProIn={() => setActiveView("novo-analito-pro-in")} onNovoAnalitoNiveis={() => setActiveView("novo-analito-niveis")} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QualityControl;
