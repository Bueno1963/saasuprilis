import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, CheckCircle, ArrowLeft, Search, Save, AlertTriangle, ChevronDown, X } from "lucide-react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getParamKey, resolveParamValue } from "@/lib/param-key-utils";

// Morphology options for Observações (ERITROGRAMA)
const ERITROGRAMA_OBS_OPTIONS = [
  "Microcitose",
  "Macrocitose",
  "Hipocromia",
  "Hipercromia",
  "Dacriócitos",
  "Esquizócitos",
  "Drepanócitos",
  "Codócitos (Hemácias em alvo)",
  "Esferócitos",
  "Pontilhado basófilo",
  "Corpos de Howell-Jolly",
];

// Morphology options for Observações (LEUCOGRAMA)
const LEUCOGRAMA_OBS_OPTIONS = [
  "Presença de células jovens",
  "Granulações tóxicas/Vacuolização",
  "Hipersegmentação",
  "Linfócitos Reativos ou Atípicos",
  "Presença de Blastos",
  "Eosinofilia",
];

// Parameters whose values must sum to 100%
const DIFFERENTIAL_COUNT_PARAMS = [
  "Basófilos", "Eosinófilos", "Mielócitos", "Metamielócitos",
  "Bastões", "Segmentados", "Linfócitos típicos", "Linfócitos atípicos", "Monócitos",
];

interface ExamParam {
  id: string;
  exam_id: string;
  section: string;
  name: string;
  unit: string | null;
  reference_range: string | null;
  sort_order: number | null;
}

const SECTOR_COLORS = [
  { color: "from-blue-800 to-blue-600", glow: "shadow-blue-500/30" },
  { color: "from-red-700 to-red-500", glow: "shadow-red-500/30" },
  { color: "from-cyan-600 to-cyan-400", glow: "shadow-cyan-500/30" },
  { color: "from-orange-600 to-orange-400", glow: "shadow-orange-500/30" },
  { color: "from-amber-500 to-yellow-400", glow: "shadow-amber-500/30" },
  { color: "from-emerald-700 to-emerald-500", glow: "shadow-emerald-500/30" },
  { color: "from-purple-700 to-purple-500", glow: "shadow-purple-500/30" },
  { color: "from-indigo-600 to-blue-400", glow: "shadow-indigo-500/30" },
  { color: "from-rose-600 to-pink-400", glow: "shadow-rose-500/30" },
  { color: "from-teal-700 to-teal-500", glow: "shadow-teal-500/30" },
  { color: "from-slate-700 to-slate-500", glow: "shadow-slate-500/30" },
  { color: "from-lime-600 to-lime-400", glow: "shadow-lime-500/30" },
];

const ValidarExames = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [editedFlags, setEditedFlags] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["results-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*, orders(order_number, patients(name)), samples(condition)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: examCatalog = [] } = useQuery({
    queryKey: ["exam_catalog_sectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("name, sector").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  // Fetch exam parameters for composite exams
  const { data: allExamParams = [] } = useQuery<ExamParam[]>({
    queryKey: ["exam_parameters_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_parameters")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch exam catalog with ids for mapping
  const { data: examCatalogFull = [] } = useQuery({
    queryKey: ["exam_catalog_full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("id, name, sector").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const examNameToId = new Map(examCatalogFull.map(e => [e.name, e.id]));
  const examParamsByExamId = useMemo(() => {
    const map = new Map<string, ExamParam[]>();
    for (const p of allExamParams) {
      if (!map.has(p.exam_id)) map.set(p.exam_id, []);
      map.get(p.exam_id)!.push(p);
    }
    return map;
  }, [allExamParams]);

  const examSectorMap = new Map(examCatalog.map(e => [e.name, e.sector]));
  const uniqueSectors = [...new Set(examCatalog.map(e => e.sector).filter(Boolean))] as string[];

  // Check if a result's sample condition allows validation
  const isSampleDeAcordo = useCallback((r: any) => {
    const condition = (r.samples as any)?.condition;
    return !condition || condition === "de_acordo";
  }, []);

  const getSampleConditionLabel = useCallback((r: any) => {
    const condition = (r.samples as any)?.condition;
    const labels: Record<string, string> = {
      hemolisada: "Amostra hemolisada",
      insuficiente: "Amostra Insuficiente",
      nao_coletou: "Paciente Não coletou",
    };
    return labels[condition] || condition;
  }, []);

  const sectorCounts = new Map<string, number>();
  for (const r of results as any[]) {
    const sector = examSectorMap.get(r.exam) || "Outros";
    sectorCounts.set(sector, (sectorCounts.get(sector) || 0) + 1);
  }

  const sectors = uniqueSectors.map((name, i) => ({
    name,
    ...SECTOR_COLORS[i % SECTOR_COLORS.length],
  }));

  const filteredResults = selectedSector
    ? (results as any[]).filter(r => (examSectorMap.get(r.exam) || "Outros") === selectedSector)
    : [];

  const saveValueMutation = useMutation({
    mutationFn: async ({ id, value, flag }: { id: string; value: string; flag?: string }) => {
      const update: any = { value };
      if (flag) update.flag = flag;
      const { error } = await supabase.from("results").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-pending"] });
    },
    onError: () => toast.error("Erro ao salvar resultado"),
  });

  const validateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // First save any pending edits for these ids
      const savePromises = ids.map(id => {
        const value = editedValues[id];
        const flag = editedFlags[id];
        if (value !== undefined || flag !== undefined) {
          const update: any = {};
          if (value !== undefined) update.value = value;
          if (flag !== undefined) update.flag = flag;
          return supabase.from("results").update(update).eq("id", id);
        }
        return Promise.resolve(null);
      });
      await Promise.all(savePromises);

      const { error } = await supabase.from("results").update({
        status: "validated",
        validated_at: new Date().toISOString(),
        analyst_id: user?.id,
      }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["results-pending"] });
      // Clean up edited values
      setEditedValues(prev => {
        const next = { ...prev };
        ids.forEach(id => delete next[id]);
        return next;
      });
      setEditedFlags(prev => {
        const next = { ...prev };
        ids.forEach(id => delete next[id]);
        return next;
      });
      toast.success(ids.length > 1 ? "Exames validados com sucesso" : "Exame validado com sucesso");
    },
    onError: () => toast.error("Erro ao validar exame(s)"),
  });

  const validateAllSector = useMutation({
    mutationFn: async () => {
      const ids = filteredResults.filter((r: any) => isSampleDeAcordo(r)).map((r: any) => r.id);
      if (ids.length === 0) {
        toast.error("Nenhuma amostra com condição adequada para validação");
        return;
      }
      // Save all pending edits first
      const savePromises = ids.map(id => {
        const value = editedValues[id];
        const flag = editedFlags[id];
        if (value !== undefined || flag !== undefined) {
          const update: any = {};
          if (value !== undefined) update.value = value;
          if (flag !== undefined) update.flag = flag;
          return supabase.from("results").update(update).eq("id", id);
        }
        return Promise.resolve(null);
      });
      await Promise.all(savePromises);

      const { error } = await supabase.from("results").update({
        status: "validated",
        validated_at: new Date().toISOString(),
        analyst_id: user?.id,
      }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-pending"] });
      setEditedValues({});
      setEditedFlags({});
      toast.success("Todos os exames do setor foram validados");
    },
    onError: () => toast.error("Erro ao validar exames"),
  });

  const handleValueChange = useCallback((id: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [id]: value }));
  }, []);

  const handleFlagChange = useCallback((id: string, flag: string) => {
    setEditedFlags(prev => ({ ...prev, [id]: flag }));
  }, []);

  const handleSaveValue = useCallback((id: string) => {
    const value = editedValues[id];
    const flag = editedFlags[id];
    if (value !== undefined || flag !== undefined) {
      saveValueMutation.mutate({ id, value: value ?? "", flag });
      toast.success("Resultado salvo");
    }
  }, [editedValues, editedFlags, saveValueMutation]);

  if (!selectedSector) {
    return (
      <div className="p-6 space-y-6 max-w-[80%] bg-foreground/10 min-h-screen">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Validar Exames</h1>
          <p className="text-sm text-muted-foreground">Selecione o setor do laboratório para validar exames pendentes</p>
        </div>

        {isLoading ? (
          <p className="text-center py-12 text-muted-foreground">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 pt-4">
            {sectors.map(sector => {
              const count = sectorCounts.get(sector.name) || 0;
              return (
                <Card
                  key={sector.name}
                  className="cursor-pointer hover:shadow-lg transition-all min-h-[120px] flex flex-col items-center justify-center"
                  onClick={() => setSelectedSector(sector.name)}
                >
                  <CardContent className="pt-6 flex flex-col items-center gap-2">
                    <span className="font-bold text-base text-foreground text-center">
                      {sector.name}
                    </span>
                    {count > 0 ? (
                      <Badge className="text-sm">{count}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Nenhum pendente</span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {results.length > 0 && (
          <p className="text-center text-sm text-muted-foreground pt-4">
            Total: <span className="font-semibold text-foreground">{results.length}</span> exame{results.length !== 1 ? "s" : ""} pendente{results.length !== 1 ? "s" : ""} aguardando validação
          </p>
        )}
      </div>
    );
  }

  // Group by patient/order
  type PatientGroup = { patientName: string; orderNumber: string; orderId: string; date: string; exams: string[]; resultIds: string[]; results: any[] };
  const patientGroups = filteredResults.reduce((acc: Record<string, PatientGroup>, r: any) => {
    const key = r.order_id;
    if (!acc[key]) {
      acc[key] = {
        patientName: r.orders?.patients?.name || "—",
        orderNumber: r.orders?.order_number || "—",
        orderId: r.order_id,
        date: r.created_at,
        exams: [],
        resultIds: [],
        results: [],
      };
    }
    acc[key].exams.push(r.exam);
    acc[key].resultIds.push(r.id);
    acc[key].results.push(r);
    return acc;
  }, {} as Record<string, PatientGroup>);

  const patients: PatientGroup[] = Object.values(patientGroups);

  const searchLower = searchQuery.toLowerCase();
  const filteredPatients = patients.filter(p =>
    p.patientName.toLowerCase().includes(searchLower) ||
    p.orderNumber.toLowerCase().includes(searchLower) ||
    p.exams.some(e => e.toLowerCase().includes(searchLower))
  );

  // Detail view: editing results for a specific order
  if (selectedOrderId) {
    const patient = patients.find(p => p.orderId === selectedOrderId);
    if (!patient) {
      setSelectedOrderId(null);
      return null;
    }

    // Helper: parse stored JSON values for composite exams
    const getParamValues = (r: any): Record<string, string> => {
      const raw = editedValues[r.id] ?? r.value ?? "";
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
      } catch {}
      return {};
    };

    const setParamValue = (resultId: string, paramName: string, val: string, currentResult: any, section?: string) => {
      const existing = getParamValues(currentResult);
      const key = getParamKey(paramName, section);
      const updated = { ...existing, [key]: val };
      handleValueChange(resultId, JSON.stringify(updated));
    };

    const allFilled = patient.results.every((r: any) => {
      const examId = examNameToId.get(r.exam);
      const params = examId ? examParamsByExamId.get(examId) : undefined;
      if (params && params.length > 0) {
        const vals = getParamValues(r);
        const OPTIONAL_PARAMS = [...DIFFERENTIAL_COUNT_PARAMS, "Observações"];
        const paramsFilled = params.every(p => {
          if (OPTIONAL_PARAMS.includes(p.name)) return true; // differential counts and observations are optional
          return vals[p.name] && vals[p.name].trim() !== "";
        });
        // Also check differential count sum = 100%
        const diffPs = params.filter(p => DIFFERENTIAL_COUNT_PARAMS.includes(p.name));
        if (diffPs.length > 0) {
          const sum = diffPs.reduce((s, p) => s + (parseFloat(vals[p.name] || "0") || 0), 0);
          if (Math.abs(sum - 100) >= 0.01) return false;
        }
        return paramsFilled;
      }
      const val = editedValues[r.id] ?? r.value;
      return val && val.trim() !== "";
    });

    const allSamplesDeAcordo = patient.results.every((r: any) => isSampleDeAcordo(r));
    const blockedResults = patient.results.filter((r: any) => !isSampleDeAcordo(r));
    const canValidateAll = allFilled && allSamplesDeAcordo;

    return (
      <div className="p-6 space-y-6 max-w-[80%] bg-foreground/10 min-h-screen">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedOrderId(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{patient.patientName}</h1>
              <p className="text-sm text-muted-foreground">
                Pedido: <span className="font-mono">{patient.orderNumber}</span> · {patient.results.length} exame{patient.results.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            onClick={() => validateMutation.mutate(patient.resultIds.filter(id => {
              const r = patient.results.find((res: any) => res.id === id);
              return isSampleDeAcordo(r);
            }))}
            disabled={validateMutation.isPending || !canValidateAll}
            title={!allSamplesDeAcordo ? "Existem amostras com condição inadequada para validação" : !allFilled ? "Preencha todos os resultados antes de validar" : ""}
            style={{ backgroundColor: "#258E94", borderColor: "#258E94" }}
            className="text-white hover:opacity-90"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Validar Todos ({patient.results.length})
          </Button>
        </div>

        {!allSamplesDeAcordo && (
          <div className="flex items-center gap-2 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {blockedResults.length} exame{blockedResults.length !== 1 ? "s" : ""} não pode{blockedResults.length !== 1 ? "m" : ""} ser validado{blockedResults.length !== 1 ? "s" : ""} — amostra com condição inadequada ({blockedResults.map((r: any) => getSampleConditionLabel(r)).filter((v, i, a) => a.indexOf(v) === i).join(", ")}).
            </span>
          </div>
        )}

        {patient.results.map((r: any) => {
          const examId = examNameToId.get(r.exam);
          const params = examId ? examParamsByExamId.get(examId) : undefined;
          const hasParams = params && params.length > 0;
          const hasUnsaved = editedValues[r.id] !== undefined || editedFlags[r.id] !== undefined;

          if (!hasParams) {
            // Simple exam — single row
            const currentValue = editedValues[r.id] ?? r.value ?? "";
            const currentFlag = editedFlags[r.id] ?? r.flag ?? "normal";
            const isFilled = currentValue.trim() !== "";
            return (
              <Card key={r.id}>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exame</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Ref.</TableHead>
                        <TableHead>Flag</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className={cn(!isFilled && "bg-muted/30")}>
                        <TableCell className="font-medium">{r.exam}</TableCell>
                        <TableCell>
                          <Input
                            value={currentValue}
                            onChange={e => handleValueChange(r.id, e.target.value)}
                            onBlur={() => { if (hasUnsaved) handleSaveValue(r.id); }}
                            placeholder="Digitar resultado..."
                            className={cn("max-w-[160px] font-mono", !isFilled && "border-destructive/50")}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.unit}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.reference_range}</TableCell>
                        <TableCell>
                          <select
                            value={currentFlag}
                            onChange={e => handleFlagChange(r.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1 bg-background"
                          >
                            <option value="normal">Normal</option>
                            <option value="high">Alto</option>
                            <option value="low">Baixo</option>
                            <option value="critical">Crítico</option>
                          </select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {hasUnsaved && (
                              <Button size="sm" variant="ghost" onClick={() => handleSaveValue(r.id)} disabled={saveValueMutation.isPending}>
                                <Save className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => validateMutation.mutate([r.id])}
                              disabled={validateMutation.isPending || !isFilled || !isSampleDeAcordo(r)}
                              title={!isSampleDeAcordo(r) ? `Bloqueado: ${getSampleConditionLabel(r)}` : ""}
                              style={{ backgroundColor: "#258E94", borderColor: "#258E94" }}
                              className="text-white hover:opacity-90"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Validar
                            </Button>
                            {!isSampleDeAcordo(r) && (
                              <span className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{getSampleConditionLabel(r)}</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          }

          // Composite exam — show all parameters grouped by section
          const paramValues = getParamValues(r);
          const sections = new Map<string, ExamParam[]>();
          for (const p of params!) {
            const sec = p.section || "";
            if (!sections.has(sec)) sections.set(sec, []);
            sections.get(sec)!.push(p);
          }

          const OPTIONAL_PARAMS_CHECK = [...DIFFERENTIAL_COUNT_PARAMS, "Observações"];
          const allParamsFilled = params!.every(p => {
            if (OPTIONAL_PARAMS_CHECK.includes(p.name)) return true;
            return paramValues[p.name]?.trim();
          });

          // Check if this exam has differential count params that must sum to 100%
          const diffParams = params!.filter(p => DIFFERENTIAL_COUNT_PARAMS.includes(p.name));
          const hasDiffCount = diffParams.length > 0;
          let diffSum = 0;
          let diffSumValid = true;
          if (hasDiffCount) {
            diffSum = diffParams.reduce((sum, p) => {
              const v = parseFloat(paramValues[p.name] || "0");
              return sum + (isNaN(v) ? 0 : v);
            }, 0);
            diffSumValid = Math.abs(diffSum - 100) < 0.01;
          }

          return (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{r.exam}</CardTitle>
                  <div className="flex items-center gap-2">
                    {hasUnsaved && (
                      <Button size="sm" variant="ghost" onClick={() => handleSaveValue(r.id)} disabled={saveValueMutation.isPending}>
                        <Save className="w-3.5 h-3.5 mr-1" /> Salvar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => validateMutation.mutate([r.id])}
                      disabled={validateMutation.isPending || !allParamsFilled || !isSampleDeAcordo(r) || (hasDiffCount && !diffSumValid)}
                      title={!isSampleDeAcordo(r) ? `Bloqueado: ${getSampleConditionLabel(r)}` : (hasDiffCount && !diffSumValid) ? "A contagem diferencial deve somar 100%" : ""}
                      style={{ backgroundColor: "#258E94", borderColor: "#258E94" }}
                      className="text-white hover:opacity-90"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Validar
                    </Button>
                    {!isSampleDeAcordo(r) && (
                      <span className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{getSampleConditionLabel(r)}</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parâmetro</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead className="hidden" id="leuco-mm3-head">/mm³</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Referência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...sections.entries()].map(([sectionName, sectionParams]) => {
                      const isLeucograma = sectionName === "LEUCOGRAMA";
                      const leucoValue = isLeucograma ? parseFloat(resolveParamValue(paramValues, "Leucócitos", sectionName) || "0") || 0 : 0;
                      return (
                      <>{sectionName && (
                          <TableRow key={`section-${sectionName}`} className="bg-muted/50">
                            <TableCell colSpan={isLeucograma ? 5 : 4} className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-1.5">
                              {sectionName}
                            </TableCell>
                          </TableRow>
                        )}
                        {isLeucograma && (
                          <TableRow className="bg-muted/30">
                            <TableHead className="font-medium text-xs text-muted-foreground">Parâmetro</TableHead>
                            <TableHead className="font-medium text-xs text-muted-foreground">%</TableHead>
                            <TableHead className="font-medium text-xs text-muted-foreground">/mm³</TableHead>
                            <TableHead className="font-medium text-xs text-muted-foreground">Unidade</TableHead>
                            <TableHead className="font-medium text-xs text-muted-foreground">Referência</TableHead>
                          </TableRow>
                        )}
                        {sectionParams.map(param => {
                          const val = resolveParamValue(paramValues, param.name, sectionName) || "";
                          const isDiffParam = DIFFERENTIAL_COUNT_PARAMS.includes(param.name);
                          const showAbsoluteCol = isLeucograma;
                          const absoluteValue = (isDiffParam && leucoValue > 0 && val.trim())
                            ? Math.round((parseFloat(val) / 100) * leucoValue).toLocaleString("pt-BR")
                            : "";
                          return (
                            <TableRow key={param.id} className={cn("h-8", !val.trim() && "bg-muted/20")}>
                              <TableCell className="font-medium text-sm py-1">{param.name === "Linfócitos típicos" ? "Linfócitos" : param.name}</TableCell>
                              <TableCell className="py-1">
                                {(() => {
                                  const refRange = param.reference_range || "";
                                  const isDiffParam = DIFFERENTIAL_COUNT_PARAMS.includes(param.name);
                                   const isObsMultiSelect = param.name === "Observações" && sectionName === "LEUCOGRAMA";
                                   const isObsFreeText = param.name === "Observações" && (sectionName === "SEDIMENTOSCOPIA" || sectionName === "ERITROGRAMA");

                                  // Multi-select for Observações in ERITROGRAMA/LEUCOGRAMA
                                  if (isObsMultiSelect) {
                                    const selectedItems = val ? val.split(", ").filter(Boolean) : [];
                                    const toggleItem = (item: string) => {
                                      const newItems = selectedItems.includes(item)
                                        ? selectedItems.filter(i => i !== item)
                                        : [...selectedItems, item];
                                      setParamValue(r.id, param.name, newItems.join(", "), r, sectionName);
                                    };
                                    return (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "max-w-[320px] w-full justify-between text-sm font-normal h-auto min-h-[2.5rem] py-1.5",
                                              !val.trim() && "text-muted-foreground"
                                            )}
                                          >
                                            <span className="truncate text-left flex-1">
                                              {selectedItems.length > 0 ? `${selectedItems.length} selecionado(s)` : "Selecione..."}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[320px] p-2" align="start">
                                          <div className="space-y-1 max-h-[280px] overflow-y-auto">
                                            {(sectionName === "LEUCOGRAMA" ? LEUCOGRAMA_OBS_OPTIONS : ERITROGRAMA_OBS_OPTIONS).map(opt => (
                                              <label
                                                key={opt}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm"
                                              >
                                                <Checkbox
                                                  checked={selectedItems.includes(opt)}
                                                  onCheckedChange={() => toggleItem(opt)}
                                                />
                                                {opt}
                                              </label>
                                            ))}
                                          </div>
                                          {selectedItems.length > 0 && (
                                            <div className="border-t mt-2 pt-2">
                                              <div className="flex flex-wrap gap-1">
                                                {selectedItems.map(item => (
                                                  <Badge key={item} variant="secondary" className="text-xs gap-1">
                                                    {item}
                                                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleItem(item)} />
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </PopoverContent>
                                      </Popover>
                                    );
                                   }

                                   // Free-text Observações for SEDIMENTOSCOPIA
                                   if (isObsFreeText) {
                                     return (
                                       <Input
                                         value={val}
                                         onChange={e => setParamValue(r.id, param.name, e.target.value, r, sectionName)}
                                         onBlur={() => { if (hasUnsaved) handleSaveValue(r.id); }}
                                         placeholder="Observações..."
                                         className="max-w-[320px] text-sm"
                                       />
                                     );
                                   }

                                  const options = (!isDiffParam && refRange.includes("|")) ? refRange.split("|").map(o => o.trim()).filter(Boolean) : [];
                                  if (options.length >= 2) {
                                    return (
                                      <Select value={val || undefined} onValueChange={v => { setParamValue(r.id, param.name, v, r); }}>
                                        <SelectTrigger className={cn("max-w-[200px] text-sm", !val.trim() && "border-destructive/50")}>
                                          <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {options.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    );
                                  }
                                  return (
                                    <Input
                                      value={val}
                                      type={isDiffParam ? "number" : "text"}
                                      min={isDiffParam ? 0 : undefined}
                                      max={isDiffParam ? 100 : undefined}
                                      step={isDiffParam ? "0.1" : undefined}
                                      onChange={e => {
                                        if (isDiffParam) {
                                          const raw = e.target.value;
                                          if (raw === "") {
                                            setParamValue(r.id, param.name, "", r);
                                            return;
                                          }
                                          const num = parseFloat(raw);
                                          if (!isNaN(num) && num >= 0 && num <= 100) {
                                            setParamValue(r.id, param.name, raw, r);
                                          }
                                        } else {
                                          setParamValue(r.id, param.name, e.target.value, r);
                                        }
                                      }}
                                      onBlur={() => { if (hasUnsaved) handleSaveValue(r.id); }}
                                      placeholder={isDiffParam ? "0" : "..."}
                                      className={cn("max-w-[160px] font-mono text-sm h-7", !val.trim() && "border-destructive/50")}
                                    />
                                  );
                                })()}
                              </TableCell>
                              <TableCell className="text-sm text-foreground py-1">{param.unit || ""}</TableCell>
                              <TableCell className="text-sm text-foreground py-1">
                                {(param.reference_range || "").includes("|") ? "" : param.reference_range || ""}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Show sum row if this section contains differential count params */}
                        {sectionParams.some(p => DIFFERENTIAL_COUNT_PARAMS.includes(p.name)) && (
                          <TableRow className={cn("border-t-2", diffSumValid ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-destructive/10")}>
                            <TableCell className="font-bold text-sm">
                              Total
                            </TableCell>
                            <TableCell>
                              <span className={cn(
                                "font-mono font-bold text-sm px-2 py-0.5 rounded",
                                diffSumValid ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
                              )}>
                                {diffSum.toFixed(1)}%
                              </span>
                              {!diffSumValid && (
                                <span className="ml-2 text-xs text-destructive flex items-center gap-1 inline-flex">
                                  <AlertTriangle className="w-3 h-3" /> Deve somar 100%
                                </span>
                              )}
                              {diffSumValid && (
                                <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">✓</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">%</TableCell>
                            <TableCell />
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Sector patient list view
  return (
    <div className="p-6 space-y-6 max-w-[80%] bg-foreground/10 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedSector(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedSector}</h1>
            <p className="text-sm text-muted-foreground">
              {patients.length} paciente{patients.length !== 1 ? "s" : ""} · {filteredResults.length} exame{filteredResults.length !== 1 ? "s" : ""} aguardando validação
            </p>
          </div>
        </div>
        {filteredResults.length > 0 && (() => {
          const validableCount = filteredResults.filter((r: any) => isSampleDeAcordo(r)).length;
          const blockedCount = filteredResults.length - validableCount;
          return (
            <div className="flex items-center gap-3">
              {blockedCount > 0 && (
                <span className="text-xs text-warning flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {blockedCount} bloqueado{blockedCount !== 1 ? "s" : ""}
                </span>
              )}
              <Button
                onClick={() => validateAllSector.mutate()}
                disabled={validateAllSector.isPending || validableCount === 0}
                style={{ backgroundColor: "#258E94", borderColor: "#258E94" }}
                className="text-white hover:opacity-90"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Validar Todos ({validableCount})
              </Button>
            </div>
          );
        })()}
      </div>

      {patients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente, pedido ou exame..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {patients.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum exame pendente neste setor</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredPatients.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Nenhum resultado encontrado para "{searchQuery}"</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Atendimento</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Exames</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((p) => (
                  <TableRow
                    key={p.orderId}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => setSelectedOrderId(p.orderId)}
                  >
                    <TableCell className="font-mono text-xs">{p.orderNumber}</TableCell>
                    <TableCell className="font-medium">{p.patientName}</TableCell>
                    <TableCell className="text-sm">{p.exams.join(", ")}</TableCell>
                    <TableCell className="text-sm">{new Date(p.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderId(p.orderId);
                        }}
                        style={{ backgroundColor: "#258E94", borderColor: "#258E94" }}
                        className="text-white hover:opacity-90"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Digitar / Validar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ValidarExames;
