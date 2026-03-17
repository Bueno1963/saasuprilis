import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ALL_PARAMS = [
  { section: "Eritrograma", params: ["Eritrócitos (hemácias)", "Hemoglobina", "Hematócrito", "VCM (Volume Corpuscular Médio)", "HCM (Hemoglobina Corpuscular Média)", "CHCM (Concentração de Hemoglobina Corpuscular Média)", "RDW (Red Cell Distribution Width)", "Reticulócitos"] },
  { section: "Leucograma", params: ["Leucócitos Totais", "Neutrófilos", "Linfócitos", "Monócitos", "Eosinófilos", "Basófilos", "Bastões", "Metamielócitos"] },
  { section: "Plaquetas", params: ["Plaquetas", "VPM (Volume Plaquetário Médio)", "PDW (Platelet Distribution Width)"] },
];

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const SHEET_TYPES = [
  { value: "hemato-normal", label: "Nível Normal" },
  { value: "hemato-baixa", label: "Nível Baixo" },
  { value: "hemato-alta", label: "Nível Alto" },
];

const LeveyJenningsHematologia = () => {
  const now = new Date();
  const [selectedParam, setSelectedParam] = useState("Eritrograma-Hemoglobina");
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [selectedSheetType, setSelectedSheetType] = useState("hemato-normal");

  const month = Number(selectedMonth);
  const year = Number(selectedYear);

  // Load daily entries for this month
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["qc_daily_entries_lj", "Hematologia", selectedSheetType, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qc_daily_entries")
        .select("parameter_name, day, value")
        .eq("sector", "Hematologia")
        .eq("sheet_type", selectedSheetType)
        .eq("month", month)
        .eq("year", year)
        .order("day");
      if (error) throw error;
      return data;
    },
  });

  // Load analyte config for mean/SD targets
  const { data: analyteConfigs = [] } = useQuery({
    queryKey: ["qc_analyte_configs", "Hematologia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qc_analyte_configs")
        .select("analyte_name, target_mean, target_sd")
        .eq("sector", "Hematologia");
      if (error) throw error;
      return data;
    },
  });

  // Build param options grouped by section
  const paramOptions = useMemo(() => {
    const opts: { value: string; label: string; section: string }[] = [];
    for (const group of ALL_PARAMS) {
      for (const p of group.params) {
        opts.push({ value: `${group.section}-${p}`, label: p, section: group.section });
      }
    }
    return opts;
  }, []);

  // Filter entries for selected parameter
  const paramEntries = useMemo(() => {
    return entries
      .filter(e => e.parameter_name === selectedParam)
      .map(e => ({ day: e.day, value: parseFloat(e.value) }))
      .filter(e => !isNaN(e.value))
      .sort((a, b) => a.day - b.day);
  }, [entries, selectedParam]);

  // Get the simple param name (without section prefix) for config lookup
  const simpleParamName = selectedParam.includes("-") ? selectedParam.split("-").slice(1).join("-") : selectedParam;

  // Find config or calculate from data
  const config = analyteConfigs.find(c => c.analyte_name === simpleParamName);

  const mean = config?.target_mean ?? (paramEntries.length > 0
    ? paramEntries.reduce((s, e) => s + e.value, 0) / paramEntries.length
    : 0);

  const sd = config?.target_sd ?? (paramEntries.length > 1
    ? Math.sqrt(paramEntries.reduce((s, e) => s + Math.pow(e.value - mean, 2), 0) / (paramEntries.length - 1))
    : 1);

  const chartData = paramEntries.map(e => ({
    day: String(e.day),
    value: Number(e.value.toFixed(2)),
  }));

  const hasData = chartData.length > 0;

  // Westgard violation check
  const getPointStatus = (value: number) => {
    const z = Math.abs(value - mean) / sd;
    if (z > 3) return "rejected";
    if (z > 2) return "warning";
    return "ok";
  };

  const chartDataWithStatus = chartData.map(d => ({
    ...d,
    status: getPointStatus(d.value),
  }));

  const violations = chartDataWithStatus.filter(d => d.status !== "ok");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">Gráfico de Levey-Jennings — Hematologia</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedSheetType} onValueChange={setSelectedSheetType}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHEET_TYPES.map(st => (
                  <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedParam} onValueChange={setSelectedParam}>
              <SelectTrigger className="w-[260px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_PARAMS.map(group => (
                  <div key={group.section}>
                    <div className="px-2 py-1.5 text-[10px] font-bold text-primary uppercase tracking-wide">{group.section}</div>
                    {group.params.map(p => (
                      <SelectItem key={`${group.section}-${p}`} value={`${group.section}-${p}`}>{p}</SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[75px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Carregando dados...</span>
          </div>
        ) : !hasData ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Nenhum dado encontrado para este parâmetro/mês.</p>
            <p className="text-xs mt-1">Faça lançamentos diários primeiro.</p>
          </div>
        ) : (
          <>
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="text-xs">Média: {mean.toFixed(2)}</Badge>
              <Badge variant="outline" className="text-xs">DP: {sd.toFixed(2)}</Badge>
              <Badge variant="outline" className="text-xs">Pontos: {chartData.length}</Badge>
              {violations.length > 0 && (
                <Badge variant="destructive" className="text-xs">{violations.length} violação(ões)</Badge>
              )}
              {violations.length === 0 && chartData.length > 0 && (
                <Badge className="text-xs bg-emerald-600">Sob controle</Badge>
              )}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartDataWithStatus} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis
                  domain={[mean - 4 * sd, mean + 4 * sd]}
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  tickFormatter={v => Number(v).toFixed(1)}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  formatter={(value: number) => [value.toFixed(2), simpleParamName]}
                  labelFormatter={(label) => `Dia ${label}`}
                />

                {/* Reference lines */}
                <ReferenceLine y={mean} stroke="hsl(var(--primary))" strokeWidth={2} label={{ value: "Média", position: "right", fontSize: 10 }} />
                <ReferenceLine y={mean + sd} stroke="hsl(142 76% 36%)" strokeDasharray="5 5" label={{ value: "+1DP", position: "right", fontSize: 9 }} />
                <ReferenceLine y={mean - sd} stroke="hsl(142 76% 36%)" strokeDasharray="5 5" label={{ value: "-1DP", position: "right", fontSize: 9 }} />
                <ReferenceLine y={mean + 2 * sd} stroke="hsl(38 92% 50%)" strokeDasharray="4 4" label={{ value: "+2DP", position: "right", fontSize: 9 }} />
                <ReferenceLine y={mean - 2 * sd} stroke="hsl(38 92% 50%)" strokeDasharray="4 4" label={{ value: "-2DP", position: "right", fontSize: 9 }} />
                <ReferenceLine y={mean + 3 * sd} stroke="hsl(0 84% 60%)" strokeDasharray="3 3" label={{ value: "+3DP", position: "right", fontSize: 9 }} />
                <ReferenceLine y={mean - 3 * sd} stroke="hsl(0 84% 60%)" strokeDasharray="3 3" label={{ value: "-3DP", position: "right", fontSize: 9 }} />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const color = payload.status === "rejected" ? "hsl(0 84% 60%)" : payload.status === "warning" ? "hsl(38 92% 50%)" : "hsl(var(--primary))";
                    const r = payload.status === "ok" ? 4 : 6;
                    return <circle key={`dot-${payload.day}`} cx={cx} cy={cy} r={r} fill={color} stroke="white" strokeWidth={2} />;
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-muted-foreground justify-center">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Sob controle</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "hsl(38 92% 50%)" }} /> Alerta (±2DP)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "hsl(0 84% 60%)" }} /> Rejeição (±3DP)</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeveyJenningsHematologia;
