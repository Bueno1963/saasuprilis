import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const DREPage = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));

  const monthStart = format(startOfMonth(new Date(selectedMonth + "-01")), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date(selectedMonth + "-01")), "yyyy-MM-dd");

  // Previous month for comparison
  const prevMonthDate = subMonths(new Date(selectedMonth + "-01"), 1);
  const prevStart = format(startOfMonth(prevMonthDate), "yyyy-MM-dd");
  const prevEnd = format(endOfMonth(prevMonthDate), "yyyy-MM-dd");

  const { data: receivables = [] } = useQuery({
    queryKey: ["dre_receivables", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receivables")
        .select("amount, net_amount, discount, payment_type, status, due_date, paid_at")
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd);
      if (error) throw error;
      return data;
    },
  });

  const { data: payables = [] } = useQuery({
    queryKey: ["dre_payables", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payables")
        .select("amount, category, status, due_date")
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd);
      if (error) throw error;
      return data;
    },
  });

  const { data: prevReceivables = [] } = useQuery({
    queryKey: ["dre_prev_receivables", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receivables")
        .select("net_amount")
        .gte("due_date", prevStart)
        .lte("due_date", prevEnd);
      if (error) throw error;
      return data;
    },
  });

  const { data: prevPayables = [] } = useQuery({
    queryKey: ["dre_prev_payables", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payables")
        .select("amount")
        .gte("due_date", prevStart)
        .lte("due_date", prevEnd);
      if (error) throw error;
      return data;
    },
  });

  // Calculate DRE values
  const receitaParticular = receivables.filter(r => r.payment_type === "particular").reduce((s, r) => s + Number(r.amount), 0);
  const receitaConvenio = receivables.filter(r => r.payment_type === "convenio").reduce((s, r) => s + Number(r.amount), 0);
  const receitaBruta = receitaParticular + receitaConvenio;

  const descontos = receivables.reduce((s, r) => s + Number(r.discount || 0), 0);
  const receitaLiquida = receitaBruta - descontos;

  // Payables by category
  const custoInsumos = payables.filter(p => p.category === "insumos").reduce((s, p) => s + Number(p.amount), 0);
  const custoFornecedores = payables.filter(p => p.category === "fornecedores").reduce((s, p) => s + Number(p.amount), 0);
  const custoManutencao = payables.filter(p => p.category === "manutencao").reduce((s, p) => s + Number(p.amount), 0);
  const custosServicos = custoInsumos + custoFornecedores + custoManutencao;

  const lucroBruto = receitaLiquida - custosServicos;

  const despSalarios = payables.filter(p => p.category === "salarios").reduce((s, p) => s + Number(p.amount), 0);
  const despAluguel = payables.filter(p => p.category === "aluguel").reduce((s, p) => s + Number(p.amount), 0);
  const despOutros = payables.filter(p => p.category === "outros").reduce((s, p) => s + Number(p.amount), 0);
  const despesasOperacionais = despSalarios + despAluguel + despOutros;

  const resultadoOperacional = lucroBruto - despesasOperacionais;
  const resultadoLiquido = resultadoOperacional;

  // Previous month totals for comparison
  const prevReceita = prevReceivables.reduce((s, r) => s + Number(r.net_amount), 0);
  const prevDespesa = prevPayables.reduce((s, p) => s + Number(p.amount), 0);
  const prevResultado = prevReceita - prevDespesa;

  // Month options (last 12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(currentDate, i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: ptBR }) };
  });

  const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0;
  const margemLiquida = receitaLiquida > 0 ? (resultadoLiquido / receitaLiquida) * 100 : 0;

  interface DRELine {
    label: string;
    value: number;
    indent?: number;
    bold?: boolean;
    highlight?: boolean;
    separator?: boolean;
  }

  const dreLines: DRELine[] = [
    { label: "RECEITA BRUTA DE SERVIÇOS", value: receitaBruta, bold: true },
    { label: "Exames Particulares", value: receitaParticular, indent: 1 },
    { label: "Exames Convênio", value: receitaConvenio, indent: 1 },
    { label: "", value: 0, separator: true },
    { label: "(-) DEDUÇÕES DA RECEITA", value: -descontos, bold: true },
    { label: "Descontos Concedidos", value: -descontos, indent: 1 },
    { label: "", value: 0, separator: true },
    { label: "(=) RECEITA LÍQUIDA", value: receitaLiquida, bold: true, highlight: true },
    { label: "", value: 0, separator: true },
    { label: "(-) CUSTOS DOS SERVIÇOS PRESTADOS", value: -custosServicos, bold: true },
    { label: "Insumos e Reagentes", value: -custoInsumos, indent: 1 },
    { label: "Fornecedores", value: -custoFornecedores, indent: 1 },
    { label: "Manutenção", value: -custoManutencao, indent: 1 },
    { label: "", value: 0, separator: true },
    { label: "(=) LUCRO BRUTO", value: lucroBruto, bold: true, highlight: true },
    { label: "", value: 0, separator: true },
    { label: "(-) DESPESAS OPERACIONAIS", value: -despesasOperacionais, bold: true },
    { label: "Salários e Encargos", value: -despSalarios, indent: 1 },
    { label: "Aluguel", value: -despAluguel, indent: 1 },
    { label: "Outras Despesas", value: -despOutros, indent: 1 },
    { label: "", value: 0, separator: true },
    { label: "(=) RESULTADO OPERACIONAL", value: resultadoOperacional, bold: true, highlight: true },
    { label: "", value: 0, separator: true },
    { label: "(=) RESULTADO LÍQUIDO DO EXERCÍCIO", value: resultadoLiquido, bold: true, highlight: true },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">DRE</h1>
          <p className="text-sm text-muted-foreground">Demonstração do Resultado do Exercício</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m.value} value={m.value} className="capitalize">{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Receita Líquida</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(receitaLiquida)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Lucro Bruto</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(lucroBruto)}</p>
            <p className="text-[10px] text-muted-foreground">Margem: {margemBruta.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Resultado Líquido</p>
            <p className={cn("text-xl font-bold", resultadoLiquido >= 0 ? "text-emerald-600" : "text-red-600")}>
              {formatCurrency(resultadoLiquido)}
            </p>
            <p className="text-[10px] text-muted-foreground">Margem: {margemLiquida.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">vs. Mês Anterior</p>
            <div className="flex items-center gap-1">
              {resultadoLiquido > prevResultado ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : resultadoLiquido < prevResultado ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
              <p className={cn("text-xl font-bold", resultadoLiquido >= prevResultado ? "text-emerald-600" : "text-red-600")}>
                {prevResultado !== 0 ? `${(((resultadoLiquido - prevResultado) / Math.abs(prevResultado)) * 100).toFixed(1)}%` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DRE Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            DRE — {monthOptions.find(m => m.value === selectedMonth)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {dreLines.map((line, i) => {
              if (line.separator) return <div key={i} className="h-1" />;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between py-2 px-3",
                    line.highlight && "bg-muted/40 rounded",
                    line.bold && "font-semibold"
                  )}
                  style={{ paddingLeft: `${(line.indent || 0) * 24 + 12}px` }}
                >
                  <span className={cn("text-sm", !line.bold && "text-muted-foreground")}>{line.label}</span>
                  <span className={cn(
                    "text-sm font-mono",
                    line.value > 0 ? "text-emerald-600" : line.value < 0 ? "text-red-600" : "text-foreground"
                  )}>
                    {formatCurrency(Math.abs(line.value))}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DREPage;
