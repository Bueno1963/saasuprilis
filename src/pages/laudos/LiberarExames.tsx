import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Unlock, CheckCircle, ArrowLeft, Search, ArrowRight, Printer, PenTool, Undo2, AlertTriangle, History } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { generateLaudoPDF } from "@/lib/generate-laudo-pdf";
import { resolveReferenceRange } from "@/lib/age-reference-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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

function isOutOfRange(value: string, referenceRange: string | null | undefined): boolean {
  if (!value || value === "—" || !referenceRange) return false;
  const num = parseFloat(value.replace(",", "."));
  if (isNaN(num)) return false;
  // Pattern: "X - Y" or "X a Y" or "X-Y"
  const rangeMatch = referenceRange.match(/([\d.,]+)\s*[-–aà]\s*([\d.,]+)/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(",", "."));
    const high = parseFloat(rangeMatch[2].replace(",", "."));
    if (!isNaN(low) && !isNaN(high)) return num < low || num > high;
  }
  // Pattern: "< X" or "<= X" or "até X"
  const ltMatch = referenceRange.match(/[<≤]?\s*=?\s*([\d.,]+)/);
  if (ltMatch && referenceRange.match(/^[<≤]/)) {
    const max = parseFloat(ltMatch[1].replace(",", "."));
    if (!isNaN(max)) return num > max;
  }
  // Pattern: "> X" or ">= X"
  const gtMatch = referenceRange.match(/[>≥]\s*=?\s*([\d.,]+)/);
  if (gtMatch) {
    const min = parseFloat(gtMatch[1].replace(",", "."));
    if (!isNaN(min)) return num < min;
  }
  return false;
}

function formatCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

const LiberarExames = () => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmRelease, setConfirmRelease] = useState<{ type: "single" | "all" | "next"; result?: any; ids?: string[] } | null>(null);
  const queryClient = useQueryClient();
  const { user, profile: authProfile } = useAuth();

  // Fetch current user's full profile (name + CRM) for signature
  const { data: currentUserProfile } = useQuery({
    queryKey: ["current-user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from("profiles").select("full_name, crm").eq("user_id", user.id).single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Extended query to include patient details needed for PDF
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["results-validated"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*, orders(order_number, doctor_name, insurance, patients(name, cpf, birth_date, gender)), samples(condition)")
        .eq("status", "validated")
        .order("validated_at", { ascending: false });
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

  const { data: examCatalogFull = [] } = useQuery({
    queryKey: ["exam_catalog_full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("id, name, sector").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

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

  const { data: allRefRanges = [] } = useQuery({
    queryKey: ["param-reference-ranges-liberar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parameter_reference_ranges" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch analyst profiles
  const analystIds = [...new Set(results.filter(r => r.analyst_id).map(r => r.analyst_id!))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["analyst-profiles-liberar", analystIds],
    queryFn: async () => {
      if (analystIds.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, crm").in("user_id", analystIds);
      if (error) throw error;
      return data;
    },
    enabled: analystIds.length > 0,
  });

  const profileMap = new Map(profiles.map(p => [p.user_id, p]));

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

  const getParamValues = (r: any): Record<string, string> => {
    const raw = r.value ?? "";
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
    } catch {}
    return {};
  };

  // Generate PDF for a single result
  const generatePdfForResult = useCallback((r: any) => {
    const order = r.orders as any;
    const patient = order?.patients;
    const analyst = r.analyst_id ? profileMap.get(r.analyst_id) : null;

    const examId = examNameToId.get(r.exam);
    const params = examId ? examParamsByExamId.get(examId) : undefined;
    const hasParams = params && params.length > 0;

    let expandedParams: any[] | undefined;
    if (hasParams) {
      const paramValues = getParamValues(r);
      expandedParams = params!.map(p => ({
        section: p.section || "",
        name: p.name,
        value: paramValues[p.name] || "—",
        unit: p.unit || "",
        referenceRange: p.reference_range || "",
      }));
    }

    const now = new Date().toISOString();
    const doc = generateLaudoPDF({
      orderNumber: order?.order_number || "",
      patientName: patient?.name || "",
      patientCpf: formatCpf(patient?.cpf || ""),
      patientBirthDate: patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString("pt-BR") : "—",
      patientGender: patient?.gender || "",
      doctorName: order?.doctor_name || "",
      insurance: order?.insurance || "Particular",
      collectedAt: new Date(now).toLocaleDateString("pt-BR"),
      releasedAt: new Date(now).toLocaleString("pt-BR"),
      results: [{
        exam: r.exam,
        value: hasParams ? "" : r.value,
        unit: hasParams ? "" : r.unit,
        referenceRange: hasParams ? "" : r.reference_range,
        flag: r.flag,
        parameters: expandedParams,
      }],
      analystName: analyst?.full_name || "Analista",
      analystCrm: analyst?.crm || undefined,
    });
    doc.save(`Laudo_${order?.order_number || "exame"}_${r.exam}.pdf`);
  }, [profileMap, examNameToId, examParamsByExamId]);

  // Generate PDF with history for a result
  const generatePdfWithHistory = useCallback(async (r: any) => {
    const order = r.orders as any;
    const patient = order?.patients;
    const analyst = r.analyst_id ? profileMap.get(r.analyst_id) : null;
    const patientId = order?.patient_id || r.order_id; // fallback

    // Fetch patient_id from the order
    let actualPatientId: string | null = null;
    if (patient) {
      const { data: orderData } = await supabase.from("orders").select("patient_id").eq("id", r.order_id).single();
      actualPatientId = orderData?.patient_id || null;
    }

    // Fetch previous released results for this patient's same exam
    let historyEntries: { exam: string; date: string; value: string; unit: string; flag: string }[] = [];
    if (actualPatientId) {
      const { data: prevResults } = await supabase
        .from("results")
        .select("exam, value, unit, flag, released_at, order_id, orders!inner(patient_id)")
        .eq("orders.patient_id", actualPatientId)
        .eq("exam", r.exam)
        .eq("status", "released")
        .neq("id", r.id)
        .order("released_at", { ascending: false })
        .limit(20);

      if (prevResults && prevResults.length > 0) {
        historyEntries = prevResults.map((pr: any) => ({
          exam: pr.exam,
          date: pr.released_at ? new Date(pr.released_at).toLocaleDateString("pt-BR") : "—",
          value: pr.value,
          unit: pr.unit || "",
          flag: pr.flag || "normal",
        }));
      }
    }

    const examId = examNameToId.get(r.exam);
    const params = examId ? examParamsByExamId.get(examId) : undefined;
    const hasParams = params && params.length > 0;

    let expandedParams: any[] | undefined;
    if (hasParams) {
      const paramValues = getParamValues(r);
      expandedParams = params!.map(p => ({
        section: p.section || "",
        name: p.name,
        value: paramValues[p.name] || "—",
        unit: p.unit || "",
        referenceRange: p.reference_range || "",
      }));
    }

    const now = new Date().toISOString();
    const doc = generateLaudoPDF({
      orderNumber: order?.order_number || "",
      patientName: patient?.name || "",
      patientCpf: formatCpf(patient?.cpf || ""),
      patientBirthDate: patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString("pt-BR") : "—",
      patientGender: patient?.gender || "",
      doctorName: order?.doctor_name || "",
      insurance: order?.insurance || "Particular",
      collectedAt: new Date(now).toLocaleDateString("pt-BR"),
      releasedAt: new Date(now).toLocaleString("pt-BR"),
      results: [{
        exam: r.exam,
        value: hasParams ? "" : r.value,
        unit: hasParams ? "" : r.unit,
        referenceRange: hasParams ? "" : r.reference_range,
        flag: r.flag,
        parameters: expandedParams,
      }],
      analystName: analyst?.full_name || "Analista",
      analystCrm: analyst?.crm || undefined,
      history: historyEntries.length > 0 ? historyEntries : undefined,
    });
    doc.save(`Laudo_Historico_${order?.order_number || "exame"}_${r.exam}.pdf`);
    
    if (historyEntries.length === 0) {
      toast.info("Nenhum resultado anterior encontrado para este exame/paciente");
    } else {
      toast.success(`PDF gerado com ${historyEntries.length} resultado(s) anterior(es)`);
    }
  }, [profileMap, examNameToId, examParamsByExamId]);

  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("results").update({
        status: "released",
        released_at: new Date().toISOString(),
        analyst_id: user?.id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-validated"] });
      queryClient.invalidateQueries({ queryKey: ["results-released"] });
      toast.success("Exame liberado com sucesso");
    },
    onError: () => toast.error("Erro ao liberar exame"),
  });

  const releaseAndNextMutation = useMutation({
    mutationFn: async (r: any) => {
      // Generate PDF first
      generatePdfForResult(r);
      // Then release
      const { error } = await supabase.from("results").update({
        status: "released",
        released_at: new Date().toISOString(),
        analyst_id: user?.id,
      }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-validated"] });
      queryClient.invalidateQueries({ queryKey: ["results-released"] });
      toast.success("Exame liberado e impresso — próximo paciente carregado");
    },
    onError: () => toast.error("Erro ao liberar exame"),
  });

  const releaseAllSector = useMutation({
    mutationFn: async () => {
      const ids = filteredResults.filter((r: any) => isSampleDeAcordo(r)).map((r: any) => r.id);
      if (ids.length === 0) {
        toast.error("Nenhuma amostra com condição adequada para liberação");
        return;
      }
      const { error } = await supabase.from("results").update({
        status: "released",
        released_at: new Date().toISOString(),
        analyst_id: user?.id,
      }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-validated"] });
      queryClient.invalidateQueries({ queryKey: ["results-released"] });
      toast.success("Todos os exames do setor foram liberados");
    },
    onError: () => toast.error("Erro ao liberar exames"),
  });

  const revertValidationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("results").update({
        status: "pending",
        validated_at: null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-validated"] });
      queryClient.invalidateQueries({ queryKey: ["results-pending"] });
      toast.success("Validação revertida — exame retornou para pendente");
    },
    onError: () => toast.error("Erro ao reverter validação"),
  });

  // Confirm and execute release
  const handleConfirmRelease = useCallback(() => {
    if (!confirmRelease) return;
    if (confirmRelease.type === "single" && confirmRelease.result) {
      releaseMutation.mutate(confirmRelease.result);
    } else if (confirmRelease.type === "next" && confirmRelease.result) {
      releaseAndNextMutation.mutate(confirmRelease.result);
    } else if (confirmRelease.type === "all") {
      releaseAllSector.mutate();
    }
    setConfirmRelease(null);
  }, [confirmRelease, releaseMutation, releaseAndNextMutation, releaseAllSector]);

  if (!selectedSector) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liberar Exames</h1>
          <p className="text-sm text-muted-foreground">Selecione o setor do laboratório para liberar exames validados</p>
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
            Total: <span className="font-semibold text-foreground">{results.length}</span> exame{results.length !== 1 ? "s" : ""} validado{results.length !== 1 ? "s" : ""} aguardando liberação
          </p>
        )}
      </div>
    );
  }

  const searchLower = searchQuery.toLowerCase();
  const searchedResults = filteredResults.filter((r: any) => {
    const patientName = r.orders?.patients?.name || "";
    const orderNumber = r.orders?.order_number || "";
    return patientName.toLowerCase().includes(searchLower) || orderNumber.toLowerCase().includes(searchLower) || r.exam.toLowerCase().includes(searchLower);
  });

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
              {filteredResults.length} exame{filteredResults.length !== 1 ? "s" : ""} aguardando liberação
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
              <Button onClick={() => setConfirmRelease({ type: "all" })} disabled={releaseAllSector.isPending || validableCount === 0}>
                <CheckCircle className="w-4 h-4 mr-2" /> Liberar Todos ({validableCount})
              </Button>
            </div>
          );
        })()}
      </div>

      {filteredResults.length > 0 && (
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

      {filteredResults.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Unlock className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum exame validado neste setor</p>
            </div>
          </CardContent>
        </Card>
      ) : searchedResults.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Nenhum resultado encontrado para "{searchQuery}"</p>
      ) : (
        <div className="space-y-4">
          {searchedResults.map((r: any, index: number) => {
            const examId = examNameToId.get(r.exam);
            const params = examId ? examParamsByExamId.get(examId) : undefined;
            const hasParams = params && params.length > 0;
            const isLast = index === searchedResults.length - 1;
            const isPending = releaseAndNextMutation.isPending || releaseMutation.isPending;

            const printButton = (
              <Button
                size="sm"
                variant="outline"
                onClick={() => generatePdfForResult(r)}
                disabled={isPending}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Imprimir
              </Button>
            );

            const historyButton = (
              <Button
                size="sm"
                variant="outline"
                onClick={() => generatePdfWithHistory(r)}
                disabled={isPending}
              >
                <History className="w-3.5 h-3.5 mr-1" />
                Histórico
              </Button>
            );

            const nextButton = (
              <Button
                size="sm"
                onClick={() => setConfirmRelease({ type: "next", result: r })}
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-1 text-green-300" />
              </Button>
            );

            if (!hasParams) {
              return (
                <Card key={r.id}>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cadastro</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Exame</TableHead>
                          <TableHead>Resultado</TableHead>
                          <TableHead>Ref.</TableHead>
                          <TableHead>Flag</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-mono text-xs">{r.orders?.order_number || "—"}</TableCell>
                          <TableCell className="font-medium">{r.orders?.patients?.name || "—"}</TableCell>
                          <TableCell>{r.exam}</TableCell>
                          <TableCell className={cn("font-mono font-semibold", r.flag !== "normal" && "text-destructive")}>{r.value} {r.unit}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.reference_range}</TableCell>
                          <TableCell><StatusBadge status={r.flag} /></TableCell>
                           <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isSampleDeAcordo(r) && (
                                <span className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{getSampleConditionLabel(r)}</span>
                              )}
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => revertValidationMutation.mutate(r.id)} disabled={isPending || revertValidationMutation.isPending}>
                                <Undo2 className="w-3.5 h-3.5 mr-1" /> Reverter
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setConfirmRelease({ type: "single", result: r.id })} disabled={isPending || !isSampleDeAcordo(r)} title={!isSampleDeAcordo(r) ? `Bloqueado: ${getSampleConditionLabel(r)}` : ""}>
                                <Unlock className="w-3.5 h-3.5 mr-1" /> Liberar
                              </Button>
                               {printButton}
                               {historyButton}
                              {isSampleDeAcordo(r) && nextButton}
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            }

            // Composite exam
            const paramValues = getParamValues(r);
            const sections = new Map<string, ExamParam[]>();
            for (const p of params!) {
              const sec = p.section || "";
              if (!sections.has(sec)) sections.set(sec, []);
              sections.get(sec)!.push(p);
            }

            return (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">{r.exam}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">{r.orders?.order_number || "—"}</span> · {r.orders?.patients?.name || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isSampleDeAcordo(r) && (
                        <span className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{getSampleConditionLabel(r)}</span>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => revertValidationMutation.mutate(r.id)} disabled={isPending || revertValidationMutation.isPending}>
                        <Undo2 className="w-3.5 h-3.5 mr-1" /> Reverter
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmRelease({ type: "single", result: r.id })} disabled={isPending || !isSampleDeAcordo(r)} title={!isSampleDeAcordo(r) ? `Bloqueado: ${getSampleConditionLabel(r)}` : ""}>
                        <Unlock className="w-3.5 h-3.5 mr-1" /> Liberar
                      </Button>
                       {printButton}
                       {historyButton}
                      {isSampleDeAcordo(r) && nextButton}
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
                          {sectionParams.map(param => (
                            <TableRow key={param.id}>
                              <TableCell className="font-medium text-sm">{param.name}</TableCell>
                              <TableCell className={cn("font-mono font-semibold text-sm", isOutOfRange(paramValues[param.name] || "", param.reference_range) && "text-destructive")}>{paramValues[param.name] || "—"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{param.unit || ""}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{param.reference_range || ""}</TableCell>
                            </TableRow>
                          ))}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog with Signature */}
      <Dialog open={!!confirmRelease} onOpenChange={open => !open && setConfirmRelease(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" />
              Confirmar Liberação e Assinatura
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ao liberar, você assina digitalmente {confirmRelease?.type === "all" ? "todos os exames deste setor" : "este exame"} como responsável técnico. O laudo será enviado para a tela de Resultados/Laudos.
            </p>

            {/* Signature preview */}
            <div className="rounded-lg border bg-muted/30 p-4 text-center space-y-2">
              <div className="w-48 mx-auto border-b-2 border-foreground/40 mb-2" />
              <p className="text-sm font-bold text-foreground">{currentUserProfile?.full_name || authProfile?.full_name || "—"}</p>
              {currentUserProfile?.crm && (
                <p className="text-xs text-muted-foreground">CRM: {currentUserProfile.crm}</p>
              )}
              <p className="text-xs text-muted-foreground italic">Assinatura Digital — Responsável Técnico</p>
            </div>

            {!currentUserProfile?.crm && (
              <p className="text-xs text-destructive">
                ⚠ Seu perfil não possui CRM cadastrado. Atualize nas configurações para que a assinatura seja completa.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmRelease(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmRelease} disabled={releaseMutation.isPending || releaseAndNextMutation.isPending || releaseAllSector.isPending}>
              <Unlock className="w-4 h-4 mr-2" />
              Assinar e Liberar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiberarExames;
