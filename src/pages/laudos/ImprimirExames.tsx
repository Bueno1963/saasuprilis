import React, { useState, useMemo, useCallback } from "react";
import { resolveParamValue } from "@/lib/param-key-utils";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Printer, ChevronDown, ChevronUp, User, ClipboardList, FlaskConical } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { generateLaudoPDF } from "@/lib/generate-laudo-pdf";

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
  patientName: string;
  patientCpf: string;
  patientBirthDate: string;
  patientGender: string;
  results: any[];
}

interface GroupedSector {
  sector: string;
  orders: GroupedOrder[];
  totalExams: number;
}

const ImprimirExames = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["laudos-released-print"],
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
    queryKey: ["analyst-profiles-print", results.filter(r => r.analyst_id).map(r => r.analyst_id!)],
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

  const examNameToSector = useMemo(() => new Map(examCatalogFull.map(e => [e.name, e.sector || "Geral"])), [examCatalogFull]);
  const examNameToId = useMemo(() => new Map(examCatalogFull.map(e => [e.name, e.id])), [examCatalogFull]);
  const profileMap = useMemo(() => new Map(profiles.map(p => [p.user_id, p])), [profiles]);

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

  const searchLower = searchQuery.toLowerCase();

  const grouped = useMemo(() => {
    const sectorMap = new Map<string, GroupedSector>();

    for (const r of results as any[]) {
      const patient = r.orders?.patients;
      const orderNumber = r.orders?.order_number || "—";
      const patientName = patient?.name || "—";
      const sector = examNameToSector.get(r.exam) || "Geral";

      if (searchLower && !patientName.toLowerCase().includes(searchLower) &&
          !orderNumber.toLowerCase().includes(searchLower) &&
          !r.exam.toLowerCase().includes(searchLower) &&
          !sector.toLowerCase().includes(searchLower)) {
        continue;
      }

      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { sector, orders: [], totalExams: 0 });
      }

      const sg = sectorMap.get(sector)!;
      let order = sg.orders.find(o => o.orderNumber === orderNumber);
      if (!order) {
        order = {
          orderNumber,
          doctorName: r.orders?.doctor_name || "",
          insurance: r.orders?.insurance || "Particular",
          patientName,
          patientCpf: patient?.cpf || "",
          patientBirthDate: patient?.birth_date || "",
          patientGender: patient?.gender || "",
          results: [],
        };
        sg.orders.push(order);
      }
      order.results.push(r);
      sg.totalExams++;
    }

    return [...sectorMap.values()].sort((a, b) => a.sector.localeCompare(b.sector));
  }, [results, searchLower, examNameToSector]);

  const toggleSector = (key: string) => {
    setExpandedSectors(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleOrder = (key: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handlePrintOrder = useCallback(async (order: GroupedOrder, sectorFilter?: string) => {
    const relevantResults = sectorFilter
      ? order.results.filter((r: any) => (examNameToSector.get(r.exam) || "Geral") === sectorFilter)
      : order.results;
    if (relevantResults.length === 0) return;
    const first = relevantResults[0];
    const analyst = first?.analyst_id ? profileMap.get(first.analyst_id) : null;
    const latestRelease = relevantResults.reduce((l: string | null, r: any) => {
      if (!r.released_at) return l; if (!l) return r.released_at;
      return r.released_at > l ? r.released_at : l;
    }, null);
    const doc = await generateLaudoPDF({
      orderNumber: order.orderNumber, patientName: order.patientName, patientCpf: order.patientCpf,
      patientBirthDate: order.patientBirthDate ? new Date(order.patientBirthDate).toLocaleDateString("pt-BR") : "—",
      patientGender: order.patientGender, doctorName: order.doctorName, insurance: order.insurance,
      collectedAt: latestRelease ? format(new Date(latestRelease), "dd/MM/yyyy") : "—",
      releasedAt: latestRelease ? format(new Date(latestRelease), "dd/MM/yyyy HH:mm") : "—",
      results: relevantResults.map((r: any) => buildResultWithParams(r)),
      analystName: analyst?.full_name || "Analista", analystCrm: analyst?.crm || undefined,
    });
    const suffix = sectorFilter ? `_${sectorFilter.replace(/\s/g, "_")}` : "";
    doc.save(`Laudo_${order.orderNumber}${suffix}.pdf`);
  }, [profileMap, buildResultWithParams, examNameToSector]);

  const handlePrintSector = useCallback(async (sectorGroup: GroupedSector) => {
    for (const order of sectorGroup.orders) {
      await handlePrintOrder(order, sectorGroup.sector);
    }
  }, [handlePrintOrder]);

  const totalExams = grouped.reduce((sum, g) => sum + g.totalExams, 0);
  const totalOrders = grouped.reduce((sum, g) => sum + g.orders.length, 0);

  return (
    <div className="p-6 space-y-6 max-w-[70%] bg-foreground/10 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Impressão por Setor</h1>
        <p className="text-sm text-muted-foreground">Exames liberados agrupados por setor para impressão em lote</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar setor, paciente, pedido ou exame..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      <p className="text-sm text-muted-foreground">
        {grouped.length} setor{grouped.length !== 1 ? "es" : ""} · {totalOrders} pedido{totalOrders !== 1 ? "s" : ""} · {totalExams} exame{totalExams !== 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Printer className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhum exame liberado encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(sectorGroup => {
            const isSectorExpanded = expandedSectors.has(sectorGroup.sector);

            return (
              <Card key={sectorGroup.sector}>
                <button className="w-full text-left" onClick={() => toggleSector(sectorGroup.sector)}>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
                          <FlaskConical className="w-4 h-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{sectorGroup.sector}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {sectorGroup.orders.length} pedido{sectorGroup.orders.length !== 1 ? "s" : ""} · {sectorGroup.totalExams} exame{sectorGroup.totalExams !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handlePrintSector(sectorGroup); }} className="text-xs">
                          <Printer className="w-3.5 h-3.5 mr-1" /> Todos
                        </Button>
                        {isSectorExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isSectorExpanded && (
                  <CardContent className="px-5 pb-4 pt-1 space-y-2">
                    {sectorGroup.orders.map(order => {
                      const orderKey = `${sectorGroup.sector}::${order.orderNumber}`;
                      const isOrderExpanded = expandedOrders.has(orderKey);
                      const latestRelease = order.results[0]?.released_at;

                      return (
                        <div key={orderKey} className="border rounded-lg overflow-hidden">
                          <button className="w-full text-left flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors" onClick={() => toggleOrder(orderKey)}>
                            <div className="flex items-center gap-2">
                              <ClipboardList className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                              <span className="text-xs text-muted-foreground">
                                · <User className="w-3 h-3 inline" /> {order.patientName}
                                · {order.results.length} exame{order.results.length !== 1 ? "s" : ""}
                                {latestRelease && ` · ${format(new Date(latestRelease), "dd/MM/yyyy")}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); handlePrintOrder(order); }}>
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
                                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handlePrintOrder(order); }}>
                                            <Printer className="w-3.5 h-3.5 mr-1" /> PDF
                                          </Button>
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

export default ImprimirExames;
