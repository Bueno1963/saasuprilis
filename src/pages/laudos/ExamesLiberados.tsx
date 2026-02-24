import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Search, Printer, ChevronDown, ChevronUp, User, Undo2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { generateLaudoPDF } from "@/lib/generate-laudo-pdf";
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

interface GroupedPatient {
  patientName: string;
  patientCpf: string;
  patientBirthDate: string;
  patientGender: string;
  results: any[];
}

const ExamesLiberados = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
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
    if (!params) {
      return {
        exam: r.exam,
        value: r.value,
        unit: r.unit,
        referenceRange: r.reference_range,
        flag: r.flag,
      };
    }
    const paramValues = getParamValues(r);
    return {
      exam: r.exam,
      value: "",
      unit: "",
      referenceRange: "",
      flag: r.flag,
      parameters: params.map(p => ({
        section: p.section || "",
        name: p.name,
        value: paramValues[p.name] || "—",
        unit: p.unit || "",
        referenceRange: p.reference_range || "",
      })),
    };
  }, [getExamParams]);

  const revertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("results").update({
        status: "validated",
        released_at: null,
      }).eq("id", id);
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
    const map = new Map<string, GroupedPatient>();

    for (const r of results as any[]) {
      const patient = r.orders?.patients;
      const key = patient?.cpf || r.orders?.order_number || r.id;
      const patientName = patient?.name || "—";
      const orderNumber = r.orders?.order_number || "";

      if (searchLower && !patientName.toLowerCase().includes(searchLower) &&
          !orderNumber.toLowerCase().includes(searchLower) &&
          !r.exam.toLowerCase().includes(searchLower)) {
        continue;
      }

      if (!map.has(key)) {
        map.set(key, {
          patientName,
          patientCpf: patient?.cpf || "",
          patientBirthDate: patient?.birth_date || "",
          patientGender: patient?.gender || "",
          results: [],
        });
      }
      map.get(key)!.results.push(r);
    }

    return [...map.values()].sort((a, b) => a.patientName.localeCompare(b.patientName));
  }, [results, searchLower]);

  const togglePatient = (cpf: string) => {
    setExpandedPatients(prev => {
      const next = new Set(prev);
      if (next.has(cpf)) next.delete(cpf);
      else next.add(cpf);
      return next;
    });
  };

  const handlePrint = useCallback((r: any) => {
    const order = r.orders as any;
    const patient = order?.patients;
    const analyst = r.analyst_id ? profileMap.get(r.analyst_id) : null;

    const doc = generateLaudoPDF({
      orderNumber: order?.order_number || "",
      patientName: patient?.name || "",
      patientCpf: patient?.cpf || "",
      patientBirthDate: patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString("pt-BR") : "—",
      patientGender: patient?.gender || "",
      doctorName: order?.doctor_name || "",
      insurance: order?.insurance || "Particular",
      collectedAt: r.released_at ? format(new Date(r.released_at), "dd/MM/yyyy") : "—",
      releasedAt: r.released_at ? format(new Date(r.released_at), "dd/MM/yyyy HH:mm") : "—",
      results: [buildResultWithParams(r)],
      analystName: analyst?.full_name || "Analista",
      analystCrm: analyst?.crm || undefined,
    });
    doc.save(`Laudo_${order?.order_number || "exame"}_${r.exam}.pdf`);
  }, [profileMap, buildResultWithParams]);

  const handlePrintAll = useCallback((group: GroupedPatient) => {
    const first = group.results[0];
    const order = first?.orders as any;
    const analyst = first?.analyst_id ? profileMap.get(first.analyst_id) : null;
    const latestRelease = group.results.reduce((latest: string | null, r: any) => {
      if (!r.released_at) return latest;
      if (!latest) return r.released_at;
      return r.released_at > latest ? r.released_at : latest;
    }, null);

    const doc = generateLaudoPDF({
      orderNumber: order?.order_number || "",
      patientName: group.patientName,
      patientCpf: group.patientCpf,
      patientBirthDate: group.patientBirthDate ? new Date(group.patientBirthDate).toLocaleDateString("pt-BR") : "—",
      patientGender: group.patientGender,
      doctorName: order?.doctor_name || "",
      insurance: order?.insurance || "Particular",
      collectedAt: latestRelease ? format(new Date(latestRelease), "dd/MM/yyyy") : "—",
      releasedAt: latestRelease ? format(new Date(latestRelease), "dd/MM/yyyy HH:mm") : "—",
      results: group.results.map((r: any) => buildResultWithParams(r)),
      analystName: analyst?.full_name || "Analista",
      analystCrm: analyst?.crm || undefined,
    });
    doc.save(`Laudo_${group.patientName.replace(/\s+/g, "_")}_completo.pdf`);
  }, [profileMap, buildResultWithParams]);

  const totalExams = grouped.reduce((sum, g) => sum + g.results.length, 0);

  const renderResultRow = (r: any) => {
    const analyst = r.analyst_id ? profileMap.get(r.analyst_id) : null;
    const params = getExamParams(r);
    const isComposite = !!params;
    const paramValues = isComposite ? getParamValues(r) : {};

    return (
      <React.Fragment key={r.id}>
        <TableRow className={isComposite ? "border-b-0" : ""}>
          <TableCell className="font-mono text-xs">{r.orders?.order_number || "—"}</TableCell>
          <TableCell className="font-semibold">{r.exam}</TableCell>
          <TableCell className="font-mono font-semibold">
            {isComposite ? (
              <span className="text-xs text-muted-foreground italic">{params!.length} parâmetros</span>
            ) : (
              <>{r.value} {r.unit}</>
            )}
          </TableCell>
          <TableCell>
            <Badge variant={r.flag === "normal" ? "secondary" : "destructive"} className="text-xs">
              {r.flag}
            </Badge>
          </TableCell>
          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
            {r.released_at ? format(new Date(r.released_at), "dd/MM/yyyy HH:mm") : "—"}
          </TableCell>
          <TableCell className="text-sm">{analyst?.full_name || "—"}</TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handlePrint(r); }}>
                <Printer className="w-3.5 h-3.5 mr-1" /> PDF
              </Button>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => e.stopPropagation()}
                      disabled={revertMutation.isPending}
                    >
                      <Undo2 className="w-3.5 h-3.5 mr-1" />
                      Reverter
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reverter liberação?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O exame <span className="font-semibold">{r.exam}</span> do pedido{" "}
                        <span className="font-mono font-semibold">{r.orders?.order_number}</span>{" "}
                        será revertido para o status "validado" e precisará ser liberado novamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => revertMutation.mutate(r.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Reverter Liberação
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </TableCell>
        </TableRow>
        {isComposite && (
          <TableRow>
            <TableCell colSpan={7} className="p-0 pl-8 pr-4 pb-3 pt-0">
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
                    {params!.map((p, idx) => {
                      const val = paramValues[p.name] || "—";
                      return (
                        <TableRow key={p.id || idx} className="text-xs">
                          <TableCell className="py-1.5">{p.name}</TableCell>
                          <TableCell className="py-1.5 font-mono font-semibold">{val}</TableCell>
                          <TableCell className="py-1.5 text-muted-foreground">{p.unit || ""}</TableCell>
                          <TableCell className="py-1.5 text-muted-foreground">{p.reference_range || ""}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pacientes Liberados</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de pacientes com exames já liberados e laudo finalizado
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente, pedido ou exame..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {grouped.length} paciente{grouped.length !== 1 ? "s" : ""} · {totalExams} exame{totalExams !== 1 ? "s" : ""} liberado{totalExams !== 1 ? "s" : ""}
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
            const key = group.patientCpf || group.patientName;
            const isExpanded = expandedPatients.has(key);
            const latestRelease = group.results[0]?.released_at;

            return (
              <Card key={key}>
                <button
                  className="w-full text-left"
                  onClick={() => togglePatient(key)}
                >
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{group.patientName}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {group.patientCpf && <span className="font-mono">{group.patientCpf}</span>}
                            {group.patientCpf && " · "}
                            {group.results.length} exame{group.results.length !== 1 ? "s" : ""}
                            {latestRelease && ` · Último: ${format(new Date(latestRelease), "dd/MM/yyyy")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handlePrintAll(group); }}
                          className="text-xs"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" /> Todos
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="p-0 pt-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Exame</TableHead>
                          <TableHead>Resultado</TableHead>
                          <TableHead>Flag</TableHead>
                          <TableHead>Liberado em</TableHead>
                          <TableHead>Liberado por</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.results.map((r: any) => renderResultRow(r))}
                      </TableBody>
                    </Table>
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

import React from "react";

export default ExamesLiberados;
