import { mockQCData } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, Dot } from "recharts";

const QualityControl = () => {
  const mean = mockQCData[0].mean;
  const sd = mockQCData[0].sd;

  const chartData = mockQCData.map(d => ({
    date: d.date.slice(5),
    value: Number(d.value.toFixed(2)),
    status: d.status,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Controle de Qualidade</h1>
        <p className="text-sm text-muted-foreground">Gráfico de Levey-Jennings — Monitoramento de precisão analítica</p>
      </div>

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
              {/* Reference lines for ±1SD, ±2SD, ±3SD */}
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
                  return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={2} />;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* QC Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico de Controle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {mockQCData.map(qc => (
              <div key={qc.id} className="flex flex-col items-center gap-1 p-2 rounded-md bg-muted/50">
                <span className="text-[10px] text-muted-foreground">{qc.date.slice(5)}</span>
                <span className="text-sm font-mono font-medium">{qc.value.toFixed(1)}</span>
                <StatusBadge status={qc.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityControl;
