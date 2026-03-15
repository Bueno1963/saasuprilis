import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search, Download, Printer, Share2, ArrowLeft,
  AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, User, FileText, Calendar,
  Beaker, Activity, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateLaudoPDF } from "@/lib/generate-laudo-pdf";
import logoDraDielem from "@/assets/logo-dra-dielem.png";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ─────────────────────────────────────────── */
interface ResultItem {
  id: string;
  exam: string;
  value: string;
  unit: string;
  reference_range: string;
  flag: string;
  released_at: string;
  sector?: string;
}

interface PatientData {
  name: string;
  cpf_masked: string;
}

interface OrderData {
  order_number: string;
  doctor_name: string;
  created_at: string;
}

interface LabData {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  technical_responsible: string;
  crm_responsible: string;
}

export interface PortalResultsData {
  patient: PatientData;
  order: OrderData;
  results: ResultItem[];
  lab: LabData | null;
  history?: Array<{
    exam: string;
    date: string;
    value: string;
    unit: string;
    flag: string;
  }>;
}

/* ── Flag helpers ──────────────────────────────────── */
const FLAG_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle; bg: string }> = {
  normal: { label: "Normal", color: "text-emerald-600", icon: CheckCircle, bg: "bg-emerald-50 border-emerald-200" },
  high: { label: "Alto", color: "text-amber-600", icon: TrendingUp, bg: "bg-amber-50 border-amber-200" },
  low: { label: "Baixo", color: "text-blue-600", icon: TrendingDown, bg: "bg-blue-50 border-blue-200" },
  critical: { label: "Crítico", color: "text-red-600", icon: AlertTriangle, bg: "bg-red-50 border-red-200" },
  critical_high: { label: "Crítico Alto", color: "text-red-600", icon: AlertTriangle, bg: "bg-red-50 border-red-200" },
  critical_low: { label: "Crítico Baixo", color: "text-red-600", icon: AlertTriangle, bg: "bg-red-50 border-red-200" },
};

const getFlag = (flag: string) => FLAG_CONFIG[flag] || FLAG_CONFIG.normal;

/* ── Sector categories ─────────────────────────────── */
const SECTOR_ICONS: Record<string, typeof Beaker> = {
  "Bioquímica": Beaker,
  "Hematologia": Activity,
  "Imunologia": Activity,
  "Hormônios": Activity,
};

/* ── Mini Trend Chart ──────────────────────────────── */
const TrendChart = ({ data, unit, referenceRange }: {
  data: Array<{ date: string; value: number }>;
  unit: string;
  referenceRange: string;
}) => {
  // Try to extract numeric reference bounds
  const refMatch = referenceRange.match(/([\d.,]+)\s*(?:a|-|–)\s*([\d.,]+)/);
  const refMin = refMatch ? parseFloat(refMatch[1].replace(",", ".")) : undefined;
  const refMax = refMatch ? parseFloat(refMatch[2].replace(",", ".")) : undefined;

  return (
    <div className="h-36 w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(215 12% 50%)" }}
            tickLine={false}
            axisLine={{ stroke: "hsl(214 20% 88%)" }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(215 12% 50%)" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(0 0% 100%)",
              border: "1px solid hsl(214 20% 88%)",
              borderRadius: 8,
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
            formatter={(v: number) => [`${v} ${unit}`, "Resultado"]}
          />
          {refMin !== undefined && (
            <ReferenceLine y={refMin} stroke="hsl(170 55% 40%)" strokeDasharray="4 4" strokeOpacity={0.5} />
          )}
          {refMax !== undefined && (
            <ReferenceLine y={refMax} stroke="hsl(170 55% 40%)" strokeDasharray="4 4" strokeOpacity={0.5} />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(205 78% 28%)"
            strokeWidth={2}
            dot={{ r: 4, fill: "hsl(205 78% 28%)", strokeWidth: 2, stroke: "white" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ── Result Card ───────────────────────────────────── */
const ResultCard = ({ result, history }: {
  result: ResultItem;
  history?: Array<{ date: string; value: string; unit: string; flag: string }>;
}) => {
  const [expanded, setExpanded] = useState(false);
  const flag = getFlag(result.flag);
  const FlagIcon = flag.icon;

  const trendData = useMemo(() => {
    if (!history?.length) return [];
    return history
      .filter((h) => !isNaN(parseFloat(h.value.replace(",", "."))))
      .map((h) => ({
        date: new Date(h.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        value: parseFloat(h.value.replace(",", ".")),
      }))
      .reverse();
  }, [history]);

  // Add current value to trend if numeric
  const currentNumeric = parseFloat(result.value.replace(",", "."));
  const fullTrend = useMemo(() => {
    if (isNaN(currentNumeric)) return trendData;
    const current = {
      date: result.released_at
        ? new Date(result.released_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        : "Atual",
      value: currentNumeric,
    };
    return [...trendData, current];
  }, [trendData, currentNumeric, result.released_at]);

  const isAltered = result.flag !== "normal";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={cn(
          "transition-all cursor-pointer hover:shadow-md border",
          isAltered ? "border-l-4" : "",
          isAltered && result.flag.includes("critical") ? "border-l-destructive" : "",
          isAltered && result.flag === "high" ? "border-l-amber-400" : "",
          isAltered && result.flag === "low" ? "border-l-blue-400" : "",
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-4">
          {/* Main row */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm text-foreground truncate">{result.exam}</h4>
                {isAltered && (
                  <Badge variant="outline" className={cn("text-[10px] font-medium border", flag.bg, flag.color)}>
                    <FlagIcon className="w-3 h-3 mr-1" />
                    {flag.label}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ref: {result.reference_range || "—"} {result.unit && `(${result.unit})`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={cn(
                  "font-bold text-lg tabular-nums font-mono",
                  isAltered ? flag.color : "text-foreground"
                )}>
                  {result.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{result.unit}</p>
              </div>
              <div className="text-muted-foreground">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* Expanded section */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
                  {/* Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <FlagIcon className={cn("w-3.5 h-3.5", flag.color)} />
                        <span className={cn("font-medium", flag.color)}>{flag.label}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor de Referência</span>
                      <p className="font-medium mt-0.5">{result.reference_range || "—"}</p>
                    </div>
                    {result.released_at && (
                      <div>
                        <span className="text-muted-foreground">Liberado em</span>
                        <p className="font-medium mt-0.5">
                          {new Date(result.released_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Trend chart */}
                  {fullTrend.length >= 2 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" />
                        Histórico Evolutivo
                      </p>
                      <TrendChart data={fullTrend} unit={result.unit} referenceRange={result.reference_range} />
                    </div>
                  )}

                  {/* History table */}
                  {history && history.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Resultados Anteriores</p>
                      <div className="space-y-1">
                        {history.map((h, i) => {
                          const hf = getFlag(h.flag);
                          return (
                            <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/40">
                              <span className="text-muted-foreground">
                                {new Date(h.date).toLocaleDateString("pt-BR")}
                              </span>
                              <span className={cn("font-mono font-medium", hf.color)}>
                                {h.value} {h.unit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/* ── Main Page ─────────────────────────────────────── */
const PortalResultados = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("all");

  // Data passed via location state or stored
  const storedData = sessionStorage.getItem("portal-results");
  const data: PortalResultsData | null = storedData ? JSON.parse(storedData) : null;

  const results = data?.results || [];
  const patient = data?.patient;
  const order = data?.order;
  const lab = data?.lab;
  const history = data?.history;

  // Build history map
  const historyByExam = useMemo(() => {
    const map = new Map<string, typeof history>();
    if (history) {
      for (const h of history) {
        if (!map.has(h.exam)) map.set(h.exam, []);
        map.get(h.exam)!.push(h);
      }
    }
    return map;
  }, [history]);

  // Get sectors
  const sectors = useMemo(() => {
    const s = new Set(results.map((r) => r.sector || "Geral"));
    return ["all", ...Array.from(s).sort()];
  }, [results]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchSearch = !searchQuery || r.exam.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSector = selectedSector === "all" || (r.sector || "Geral") === selectedSector;
      return matchSearch && matchSector;
    });
  }, [results, searchQuery, selectedSector]);

  // Stats
  const alteredCount = results.filter((r) => r.flag !== "normal").length;
  const criticalCount = results.filter((r) => r.flag.includes("critical")).length;

  if (!data || !patient || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
            <h2 className="text-lg font-semibold">Nenhum resultado disponível</h2>
            <p className="text-sm text-muted-foreground">
              Faça a consulta primeiro no portal do paciente.
            </p>
            <Button onClick={() => navigate("/portal-paciente")} className="bg-primary text-primary-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PDF download
  const handleDownloadPDF = () => {
    const laudoData = {
      orderNumber: order.order_number,
      patientName: patient.name,
      patientCpf: patient.cpf_masked,
      patientBirthDate: "",
      patientGender: "",
      doctorName: order.doctor_name,
      insurance: "",
      collectedAt: new Date(order.created_at).toLocaleDateString("pt-BR"),
      releasedAt: results[0]?.released_at
        ? new Date(results[0].released_at).toLocaleDateString("pt-BR")
        : "",
      results: results.map((r) => ({
        exam: r.exam,
        value: r.value,
        unit: r.unit,
        referenceRange: r.reference_range,
        flag: r.flag,
        sector: r.sector,
      })),
      analystName: lab?.technical_responsible || "",
      analystCrm: lab?.crm_responsible || "",
      history: history,
    };
    const doc = await generateLaudoPDF(laudoData);
    doc.save(`laudo-${order.order_number}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resultados - ${order.order_number}`,
          text: `Resultados de exames de ${patient.name}`,
          url: window.location.href,
        });
      } catch { /* user cancelled */ }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 print:bg-white">
      {/* Header */}
      <header className="bg-[hsl(var(--primary))] text-primary-foreground sticky top-0 z-50 print:static">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 print:hidden"
              onClick={() => navigate("/portal-paciente")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={logoDraDielem} alt="Logo" className="h-9 w-auto rounded bg-white/95 p-0.5 shadow" />
            <div>
              <h1 className="text-sm font-bold tracking-tight">Resultados de Exames</h1>
              <p className="text-[10px] text-primary-foreground/60">Portal do Paciente</p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 text-xs" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 text-xs" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir
            </Button>
            <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 text-xs" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Patient Info Panel */}
        <Card className="border-none shadow-md bg-card">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">{patient.name}</h2>
                  <p className="text-xs text-muted-foreground">CPF: {patient.cpf_masked}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Protocolo</span>
                  <p className="font-semibold text-foreground font-mono">{order.order_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Médico</span>
                  <p className="font-semibold text-foreground">Dr(a). {order.doctor_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Data do Pedido</span>
                  <p className="font-semibold text-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] mt-0.5">
                    <CheckCircle className="w-3 h-3 mr-1" /> Laudo Liberado
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{results.length}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Exames Realizados</p>
            </CardContent>
          </Card>
          <Card className={cn("border-none shadow-sm", alteredCount > 0 && "ring-1 ring-amber-200")}>
            <CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-bold", alteredCount > 0 ? "text-amber-600" : "text-foreground")}>{alteredCount}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Alterados</p>
            </CardContent>
          </Card>
          <Card className={cn("border-none shadow-sm", criticalCount > 0 && "ring-1 ring-destructive/30")}>
            <CardContent className="p-4 text-center">
              <p className={cn("text-2xl font-bold", criticalCount > 0 ? "text-destructive" : "text-foreground")}>{criticalCount}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Críticos</p>
            </CardContent>
          </Card>
        </div>

        {/* Attention Alert */}
        {criticalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200"
          >
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">Atenção — Valores Críticos</p>
              <p className="text-xs text-red-600/80">
                {criticalCount} resultado(s) com valores fora da faixa de normalidade. Consulte seu médico.
              </p>
            </div>
          </motion.div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar exame por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-border/60"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {sectors.map((sector) => {
              const SectorIcon = sector !== "all" ? (SECTOR_ICONS[sector] || Beaker) : Filter;
              return (
                <Button
                  key={sector}
                  variant={selectedSector === sector ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs h-10",
                    selectedSector === sector
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setSelectedSector(sector)}
                >
                  <SectorIcon className="w-3.5 h-3.5 mr-1" />
                  {sector === "all" ? "Todos" : sector}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum exame encontrado para o filtro selecionado.</p>
              </CardContent>
            </Card>
          ) : (
            filteredResults.map((result) => (
              <ResultCard
                key={result.id}
                result={result}
                history={historyByExam.get(result.exam)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pt-6 border-t border-border/60">
          {lab && (
            <>
              <p className="text-xs font-medium text-foreground">{lab.name}</p>
              {lab.address && (
                <p className="text-[10px] text-muted-foreground">
                  {lab.address}{lab.city ? `, ${lab.city}` : ""}{lab.state ? ` - ${lab.state}` : ""}
                  {lab.phone ? ` • Tel: ${lab.phone}` : ""}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Resp. Técnico: {lab.technical_responsible} — CRM {lab.crm_responsible}
              </p>
            </>
          )}
          <p className="text-[10px] text-muted-foreground">
            Documento digital gerado em {new Date().toLocaleString("pt-BR")} — Acesso registrado para fins de auditoria (LGPD)
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/portal-paciente")}
            className="mt-2 print:hidden"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Nova Consulta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PortalResultados;
