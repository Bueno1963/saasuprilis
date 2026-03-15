import React, { useState, useMemo, useCallback } from "react";
import { resolveParamValue } from "@/lib/param-key-utils";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Search, Printer, ChevronDown, ChevronUp, User, Undo2, ClipboardList } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { generateLaudoPDF } from "@/lib/generate-laudo-pdf";
import { useLaudoSignatures } from "@/hooks/useLaudoSignatures";
import { useUserRole } from "@/hooks/useUserRole";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ExamParam {
  id: string;
  exam_id: string;
  section: string;
  name: string;
  unit: string | null;
  reference_range: string | null;
  sort_order: number | null;
}

interface GroupedOrder {
  orderNumber: string;
  doctorName: string;
  insurance: string;
  results: any[];
}

interface GroupedPatient {
  patientName: string;
  patientCpf: string;
  patientBirthDate: string;
  patientGender: string;
  orders: GroupedOrder[];
  totalExams: number;
}

const ExamesLiberados = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { logoUrl, sectorSigners } = useLaudoSignatures();
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const { role } = useUserRole();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["results-released"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*, orders(order_number, doctor_name, insurance, patients(name, cpf, birth_date, gender))")
        .eq("status", "released")
        .order("released_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["analyst-profiles-released", results.filter(r => r.analyst_id).map(r => r.analyst_id!)],
    queryFn: async () => {
      const ids = [...new Set(results.filter(r => r.analyst_id).map(r => r.analyst_id!))];
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, crm").in("user_id", ids);
      if (error) throw error;
      return data;
    },
    enabled: results.length > 0,
  });

  const { data: examCatalogFull = [] } = useQuery({
    queryKey: ["exam_catalog_full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("id, name, sector").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const examNameToSector = useMemo(() => new Map(examCatalogFull.map(e => [e.name, e.sector || "Geral"])), [examCatalogFull]);

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

  const getParamValues = (r: any): Record<string, string> => {
    const raw = r.value ?? "";
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
    } catch {}
    return {};
  };

  const getExamParams = useCallback((r: any) => {
    const examId = examNameToId.get(r.exam);
    const params = examId ? examParamsByExamId.get(examId) : undefined;
    return params && params.length > 0 ? params : null;
  }, [examNameToId, examParamsByExamId]);

  const buildResultWithParams = useCallback((r: any) => {
    const params = getExamParams(r);
    const sector = examNameToSector.get(r.exam) || "Geral";
    if (!params) {
      return { exam: r.exam, value: r.value, unit: r.unit, referenceRange: r.reference_range, flag: r.flag, sector };
    }
    const paramValues = getParamValues(r);
    return {
      exam: r.exam, value: "", unit: "", referenceRange: "", flag: r.flag, sector,
      parameters: params.map(p => ({
        section: p.section || "", name: p.name, value: resolveParamValue(paramValues, p.name, p.section) || "—",
        unit: p.unit || "", referenceRange: p.reference_range || "",
      })),
    };
  }, [getExamParams, examNameToSector]);

  const fetchPatientHistory = useCallback(async (patientCpf: string, examNames: string[]) => {
    if (!patientCpf || examNames.length === 0) return [];
    // Find patient by CPF
    const { data: patients } = await supabase.from("patients").select("id").eq("cpf", patientCpf);
    if (!patients || patients.length === 0) return [];
    const patientId = patients[0].id;
    // Find all orders for this patient
    const { data: orders } = await supabase.from("orders").select("id").eq("patient_id", patientId);
    if (!orders || orders.length === 0) return [];
    const orderIds = orders.map(o => o.id);
    // Find all released results for these exams (excluding current)
    const { data: histResults } = await supabase
      .from("results")
      .select("exam, value, unit, flag, released_at")
      .in("order_id", orderIds)
      .in("exam", examNames)
      .eq("status", "released")
      .order("released_at", { ascending: false })
      .limit(100);
    if (!histResults) return [];
    return histResults.map(h => ({
      exam: h.exam,
      date: h.released_at ? format(new Date(h.released_at), "dd/MM/yyyy") : "—",
      value: h.value,
      unit: h.unit,
      flag: h.flag,
    }));
  }, []);

  const revertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("results").update({ status: "validated", released_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results-released"] });
      queryClient.invalidateQueries({ queryKey: ["results-validated"] });
      toast.success("Liberação revertida — exame retornou para validação");
    },
    onError: () => toast.error("Erro ao reverter liberação"),
  });

  const searchLower = searchQuery.toLowerCase();

  const grouped = useMemo(() => {
    const patientMap = new Map<string, GroupedPatient>();

    for (const r of results as any[]) {
      const patient = r.orders?.patients;
      const patientKey = patient?.cpf || r.id;
      const patientName = patient?.name || "—";
      const orderNumber = r.orders?.order_number || "—";

      if (searchLower && !patientName.toLowerCase().includes(searchLower) &&
          !orderNumber.toLowerCase().includes(searchLower) &&
          !r.exam.toLowerCase().includes(searchLower)) {
        continue;
      }

      if (!patientMap.has(patientKey)) {
        patientMap.set(patientKey, {
          patientName,
          patientCpf: patient?.cpf || "",
          patientBirthDate: patient?.birth_date || "",
          patientGender: patient?.gender || "",
          orders: [],
          totalExams: 0,
        });
      }

      const pg = patientMap.get(patientKey)!;
      let order = pg.orders.find(o => o.orderNumber === orderNumber);
      if (!order) {
        order = {
          orderNumber,
          doctorName: r.orders?.doctor_name || "",
          insurance: r.orders?.insurance || "Particular",
          results: [],
        };
        pg.orders.push(order);
      }
      order.results.push(r);
      pg.totalExams++;
    }

    return [...patientMap.values()].sort((a, b) => a.patientName.localeCompare(b.patientName));
  }, [results, searchLower]);

  const togglePatient = (key: string) => {
    setExpandedPatients(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleOrder = (key: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handlePrint = useCallback(async (r: any) => {
    const order = r.orders as any;
    const patient = order?.patients;
    const analyst = r.analyst_id ? profileMap.get(r.analyst_id) : null;
    const history = await fetchPatientHistory(patient?.cpf || "", [r.exam]);
    const doc = await generateLaudoPDF({
      orderNumber: order?.order_number || "", patientName: patient?.name || "",
      patientCpf: patient?.cpf || "",
      patientBirthDate: patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString("pt-BR") : "—",
      patientGender: patient?.gender || "", doctorName: order?.doctor_name || "",
      insurance: order?.insurance || "Particular",
      collectedAt: r.released_at ? format(new Date(r.released_at), "dd/MM/yyyy") : "—",
      releasedAt: r.released_at ? format(new Date(r.released_at), "dd/MM/yyyy HH:mm") : "—",
      results: [buildResultWithParams(r)],
      analystName: analyst?.full_name || "Analista", analystCrm: analyst?.crm || undefined,
      analystRegistrationType: "CRBM", logoUrl, sectorSigners,
      history,
    });
    doc.save(`Laudo_${order?.order_number || "exame"}_${r.exam}.pdf`);
  }, [profileMap, buildResultWithParams, fetchPatientHistory]);

  const handlePrintOrder = useCallback(async (group: GroupedPatient, order: GroupedOrder) => {
    const first = order.results[0];
    const analyst = first?.analyst_id ? profileMap.get(first.analyst_id) : null;
    const latestRelease = order.results.reduce((l: string | null, r: any) => {
      if (!r.released_at) return l; if (!l) return r.released_at;
      return r.released_at > l ? r.released_at : l;
    }, null);
    const examNames = [...new Set(order.results.map((r: any) => r.exam as string))];
    const history = await fetchPatientHistory(group.patientCpf, examNames);
    const doc = await generateLaudoPDF({
      orderNumber: order.orderNumber, patientName: group.patientName, patientCpf: group.patientCpf,
      patientBirthDate: group.patientBirthDate ? new Date(group.patientBirthDate).toLocaleDateString("pt-BR") : "—",
      patientGender: group.patientGender, doctorName: order.doctorName, insurance: order.insurance,
      collectedAt: latestRelease ? format(new Date(latestRelease), "dd/MM/yyyy") : "—",
      releasedAt: latestRelease ? format(new Date(latestRelease), "dd/MM/yyyy HH:mm") : "—",
      results: order.results.map((r: any) => buildResultWithParams(r)),
      analystName: analyst?.full_name || "Analista", analystCrm: analyst?.crm || undefined,
      history,
    });
    doc.save(`Laudo_${order.orderNumber}.pdf`);
  }, [profileMap, buildResultWithParams, fetchPatientHistory]);

  const handlePrintAll = useCallback(async (group: GroupedPatient) => {
    const allResults = group.orders.flatMap(o => o.results);
    const first = allResults[0];
    const order = first?.orders as any;
    const analyst = first?.analyst_id ? profileMap.get(first.analyst_id) : null;
    const latestRelease = allResults.reduce((l: string | null, r: any) => {
      if (!r.released_at) return l; if (!l) return r.released_at;
      return r.released_at > l ? r.released_at : l;
    }, null);
    const examNames = [...new Set(allResults.map((r: any) => r.exam as string))];
    const history = await fetchPatientHistory(group.patientCpf, examNames);
    const doc = await generateLaudoPDF({
      orderNumber: group.orders.map(o => o.orderNumber).join(", "),
      patientName: group.patientName, patientCpf: group.patientCpf,
      patientBirthDate: group.patientBirthDate ? new Date(group.patientBirthDate).toLocaleDateString("pt-BR") : "—",
      patientGender: group.patientGender, doctorName: order?.doctor_name || "",
      insurance: order?.insurance || "Particular",
      collectedAt: latestRelease ? format(new Date(latestRelease), "dd/MM/yyyy") : "—",
      releasedAt: latestRelease ? format(new Date(latestRelease), "dd/MM/yyyy HH:mm") : "—",
      results: allResults.map((r: any) => buildResultWithParams(r)),
      analystName: analyst?.full_name || "Analista", analystCrm: analyst?.crm || undefined,
      history,
    });
    doc.save(`Laudo_${group.patientName.replace(/\s+/g, "_")}_completo.pdf`);
  }, [profileMap, buildResultWithParams, fetchPatientHistory]);

  const totalExams = grouped.reduce((sum, g) => sum + g.totalExams, 0);
  const totalOrders = grouped.reduce((sum, g) => sum + g.orders.length, 0);

  return (
    <div className="p-6 space-y-6 max-w-[70%] bg-foreground/10 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pacientes Liberados</h1>
        <p className="text-sm text-muted-foreground">Histórico de pacientes com exames já liberados e laudo finalizado</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar paciente, pedido ou exame..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      <p className="text-sm text-muted-foreground">
        {grouped.length} paciente{grouped.length !== 1 ? "s" : ""} · {totalOrders} pedido{totalOrders !== 1 ? "s" : ""} · {totalExams} exame{totalExams !== 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhum paciente liberado encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(group => {
            const patientKey = group.patientCpf || group.patientName;
            const isPatientExpanded = expandedPatients.has(patientKey);

            return (
              <Card key={patientKey}>
                <button className="w-full text-left" onClick={() => togglePatient(patientKey)}>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{group.patientName}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {group.patientCpf && <><span className="font-mono">{group.patientCpf}</span> · </>}
                            {group.orders.length} pedido{group.orders.length !== 1 ? "s" : ""} · {group.totalExams} exame{group.totalExams !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handlePrintAll(group); }} className="text-xs">
                          <Printer className="w-3.5 h-3.5 mr-1" /> Todos
                        </Button>
                        {isPatientExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isPatientExpanded && (
                  <CardContent className="px-5 pb-4 pt-1 space-y-2">
                    {group.orders.map(order => {
                      const orderKey = `${patientKey}::${order.orderNumber}`;
                      const isOrderExpanded = expandedOrders.has(orderKey);
                      const latestRelease = order.results[0]?.released_at;

                      return (
                        <div key={orderKey} className="border rounded-lg overflow-hidden">
                          <button className="w-full text-left flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors" onClick={() => toggleOrder(orderKey)}>
                            <div className="flex items-center gap-2">
                              <ClipboardList className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                              <span className="text-xs text-muted-foreground">
                                · {order.results.length} exame{order.results.length !== 1 ? "s" : ""}
                                {latestRelease && ` · ${format(new Date(latestRelease), "dd/MM/yyyy")}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); handlePrintOrder(group, order); }}>
                                <Printer className="w-3.5 h-3.5 mr-1" /> PDF Pedido
                              </Button>
                              {isOrderExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                            </div>
                          </button>

                          {isOrderExpanded && (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Exame</TableHead>
                                  <TableHead>Resultado</TableHead>
                                  <TableHead>Flag</TableHead>
                                  <TableHead>Liberado em</TableHead>
                                  <TableHead>Liberado por</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.results.map((r: any) => {
                                  const analyst = r.analyst_id ? profileMap.get(r.analyst_id) : null;
                                  const params = getExamParams(r);
                                  const isComposite = !!params;
                                  const paramValues = isComposite ? getParamValues(r) : {};

                                  return (
                                    <React.Fragment key={r.id}>
                                      <TableRow className={isComposite ? "border-b-0" : ""}>
                                        <TableCell className="font-semibold">{r.exam}</TableCell>
                                        <TableCell className="font-mono font-semibold">
                                          {isComposite ? (
                                            <span className="text-xs text-muted-foreground italic">{params!.length} parâmetros</span>
                                          ) : (
                                            <>{r.value} {r.unit}</>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={r.flag === "normal" ? "secondary" : "destructive"} className="text-xs">{r.flag}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                          {r.released_at ? format(new Date(r.released_at), "dd/MM/yyyy HH:mm") : "—"}
                                        </TableCell>
                                        <TableCell className="text-sm">{analyst?.full_name || "—"}</TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex items-center justify-end gap-1">
                                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handlePrintOrder(group, order); }}>
                                              <Printer className="w-3.5 h-3.5 mr-1" /> PDF Pedido
                                            </Button>
                                            {isAdmin && (
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => e.stopPropagation()} disabled={revertMutation.isPending}>
                                                    <Undo2 className="w-3.5 h-3.5 mr-1" /> Reverter
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Reverter liberação?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      O exame <span className="font-semibold">{r.exam}</span> do pedido <span className="font-mono font-semibold">{order.orderNumber}</span> será revertido para "validado".
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => revertMutation.mutate(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Reverter Liberação</AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                      {isComposite && (
                                        <TableRow>
                                          <TableCell colSpan={6} className="p-0 pl-6 pr-4 pb-3 pt-0">
                                            <div className="bg-muted/40 rounded-md border">
                                              <Table>
                                                <TableHeader>
                                                  <TableRow className="text-xs">
                                                    <TableHead className="h-8">Parâmetro</TableHead>
                                                    <TableHead className="h-8">Resultado</TableHead>
                                                    <TableHead className="h-8">Unidade</TableHead>
                                                    <TableHead className="h-8">Referência</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                  {params!.map((p, idx) => (
                                                    <TableRow key={p.id || idx} className="text-xs">
                                                      <TableCell className="py-1.5">{p.name}</TableCell>
                                                      <TableCell className="py-1.5 font-mono font-semibold">{resolveParamValue(paramValues, p.name, p.section) || "—"}</TableCell>
                                                      <TableCell className="py-1.5 text-muted-foreground">{p.unit || ""}</TableCell>
                                                      <TableCell className="py-1.5 text-muted-foreground">{p.reference_range || ""}</TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExamesLiberados;
