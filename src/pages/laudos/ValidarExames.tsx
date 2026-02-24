import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, CheckCircle, ArrowLeft, Search, Save } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

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
        .select("*, orders(order_number, patients(name))")
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
      const ids = filteredResults.map((r: any) => r.id);
      if (ids.length === 0) return;
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
      <div className="p-6 space-y-6">
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
                <button
                  key={sector.name}
                  onClick={() => setSelectedSector(sector.name)}
                  className="group relative flex flex-col items-center justify-center rounded-xl p-6 min-h-[120px] transition-all duration-200
                    bg-gradient-to-b from-[hsl(210,95%,48%)] via-[hsl(215,90%,40%)] to-[hsl(220,85%,32%)]
                    shadow-[0_4px_12px_hsl(220,85%,25%/0.35),inset_0_1px_1px_hsl(210,100%,75%/0.5)]
                    hover:shadow-[0_6px_20px_hsl(220,85%,25%/0.5),inset_0_1px_1px_hsl(210,100%,75%/0.5)]
                    hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_2px_6px_hsl(220,85%,25%/0.3)]
                    border border-[hsl(210,70%,35%/0.4)]
                    overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-[45%] rounded-t-xl bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                  <span className="relative text-white font-bold text-base tracking-wide text-center drop-shadow-sm">
                    {sector.name}
                  </span>
                  {count > 0 && (
                    <span className="relative mt-2 inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold border border-white/20">
                      {count}
                    </span>
                  )}
                  {count === 0 && (
                    <span className="relative mt-2 text-white/60 text-xs">Nenhum pendente</span>
                  )}
                </button>
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

    const setParamValue = (resultId: string, paramName: string, val: string, currentResult: any) => {
      const existing = getParamValues(currentResult);
      const updated = { ...existing, [paramName]: val };
      handleValueChange(resultId, JSON.stringify(updated));
    };

    const allFilled = patient.results.every((r: any) => {
      const examId = examNameToId.get(r.exam);
      const params = examId ? examParamsByExamId.get(examId) : undefined;
      if (params && params.length > 0) {
        const vals = getParamValues(r);
        return params.every(p => vals[p.name] && vals[p.name].trim() !== "");
      }
      const val = editedValues[r.id] ?? r.value;
      return val && val.trim() !== "";
    });

    return (
      <div className="p-6 space-y-6">
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
            onClick={() => validateMutation.mutate(patient.resultIds)}
            disabled={validateMutation.isPending || !allFilled}
            title={!allFilled ? "Preencha todos os resultados antes de validar" : ""}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Validar Todos ({patient.results.length})
          </Button>
        </div>

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
                              variant="outline"
                              onClick={() => validateMutation.mutate([r.id])}
                              disabled={validateMutation.isPending || !isFilled}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Validar
                            </Button>
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

          const allParamsFilled = params!.every(p => paramValues[p.name]?.trim());

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
                      variant="outline"
                      onClick={() => validateMutation.mutate([r.id])}
                      disabled={validateMutation.isPending || !allParamsFilled}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Validar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parâmetro</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Referência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...sections.entries()].map(([sectionName, sectionParams]) => (
                      <>{sectionName && (
                          <TableRow key={`section-${sectionName}`} className="bg-muted/50">
                            <TableCell colSpan={4} className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-1.5">
                              {sectionName}
                            </TableCell>
                          </TableRow>
                        )}
                        {sectionParams.map(param => {
                          const val = paramValues[param.name] || "";
                          return (
                            <TableRow key={param.id} className={cn(!val.trim() && "bg-muted/20")}>
                              <TableCell className="font-medium text-sm">{param.name}</TableCell>
                              <TableCell>
                                <Input
                                  value={val}
                                  onChange={e => setParamValue(r.id, param.name, e.target.value, r)}
                                  onBlur={() => { if (hasUnsaved) handleSaveValue(r.id); }}
                                  placeholder="..."
                                  className={cn("max-w-[160px] font-mono text-sm", !val.trim() && "border-destructive/50")}
                                />
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{param.unit || ""}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{param.reference_range || ""}</TableCell>
                            </TableRow>
                          );
                        })}
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
    <div className="p-6 space-y-6">
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
        {filteredResults.length > 0 && (
          <Button onClick={() => validateAllSector.mutate()} disabled={validateAllSector.isPending}>
            <CheckCircle className="w-4 h-4 mr-2" /> Validar Todos ({filteredResults.length})
          </Button>
        )}
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
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderId(p.orderId);
                        }}
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
