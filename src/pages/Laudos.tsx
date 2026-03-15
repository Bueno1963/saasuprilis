import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "@/components/StatusBadge";
import { Search, FileDown, Eye, Printer } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateLaudoPDF } from "@/lib/generate-laudo-pdf";
import { resolveReferenceRange } from "@/lib/age-reference-utils";
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

interface ExpandedParam {
  section: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
}

interface ResultEntry {
  exam: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: string;
  analystName: string;
  analystCrm?: string;
  parameters?: ExpandedParam[];
}

interface OrderGroup {
  orderId: string;
  orderNumber: string;
  patientName: string;
  patientCpf: string;
  patientBirthDate: string;
  patientGender: string;
  doctorName: string;
  insurance: string;
  releasedAt: string;
  results: ResultEntry[];
}

const Laudos = () => {
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<OrderGroup | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: released = [], isLoading } = useQuery({
    queryKey: ["laudos-released"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*, orders(order_number, doctor_name, insurance, patients(name, cpf, birth_date, gender)), samples(collected_at)")
        .eq("status", "released")
        .order("released_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: examCatalogFull = [] } = useQuery({
    queryKey: ["exam_catalog_full"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("id, name").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const { data: allExamParams = [] } = useQuery<ExamParam[]>({
    queryKey: ["exam_parameters_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_parameters").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: allRefRanges = [] } = useQuery({
    queryKey: ["param-reference-ranges-laudos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parameter_reference_ranges" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
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

  const parseParamValues = (value: string): Record<string, string> => {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
    } catch {}
    return {};
  };

  const analystIds = [...new Set(released.filter(r => r.analyst_id).map(r => r.analyst_id!))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["analyst-profiles", analystIds],
    queryFn: async () => {
      if (analystIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, crm")
        .in("user_id", analystIds);
      if (error) throw error;
      return data;
    },
    enabled: analystIds.length > 0,
  });

  const profileMap = new Map(profiles.map(p => [p.user_id, p]));

  // Group by order
  const grouped: OrderGroup[] = [];
  const orderMap = new Map<string, OrderGroup>();

  for (const r of released) {
    const order = r.orders as any;
    const patient = order?.patients;
    const analyst = r.analyst_id ? profileMap.get(r.analyst_id) : null;

    if (!orderMap.has(r.order_id)) {
      const group: OrderGroup = {
        orderId: r.order_id,
        orderNumber: order?.order_number || "",
        patientName: patient?.name || "",
        patientCpf: patient?.cpf || "",
        patientBirthDate: patient?.birth_date || "",
        patientGender: patient?.gender || "",
        doctorName: order?.doctor_name || "",
        insurance: order?.insurance || "Particular",
        releasedAt: r.released_at || "",
        results: [],
      };
      orderMap.set(r.order_id, group);
      grouped.push(group);
    }

    const examId = examNameToId.get(r.exam);
    const params = examId ? examParamsByExamId.get(examId) : undefined;
    const hasParams = params && params.length > 0;

    let expandedParams: ExpandedParam[] | undefined;
    if (hasParams) {
      const paramValues = parseParamValues(r.value);
      expandedParams = params!.map(p => ({
        section: p.section || "",
        name: p.name,
        value: paramValues[p.name] || "—",
        unit: p.unit || "",
        referenceRange: resolveReferenceRange(p.id, p.reference_range || "", patient?.birth_date || null, patient?.gender || "", allRefRanges),
      }));
    }

    const group = orderMap.get(r.order_id)!;
    // Avoid duplicate exam entries in the same order
    if (!group.results.some(existing => existing.exam === r.exam)) {
      group.results.push({
        exam: r.exam,
        value: r.value,
        unit: r.unit,
        referenceRange: r.reference_range,
        flag: r.flag,
        analystName: analyst?.full_name || "Analista",
        analystCrm: analyst?.crm || undefined,
        parameters: expandedParams,
      });
    }
  }

  const filtered = grouped.filter(g =>
    g.patientName.toLowerCase().includes(search.toLowerCase()) ||
    g.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    g.patientCpf.includes(search)
  );

  const buildLaudoData = useCallback((group: OrderGroup) => {
    const firstAnalyst = group.results[0];
    return {
      orderNumber: group.orderNumber,
      patientName: group.patientName,
      patientCpf: formatCpf(group.patientCpf),
      patientBirthDate: new Date(group.patientBirthDate).toLocaleDateString("pt-BR"),
      patientGender: group.patientGender,
      doctorName: group.doctorName,
      insurance: group.insurance,
      collectedAt: group.releasedAt ? new Date(group.releasedAt).toLocaleDateString("pt-BR") : "—",
      releasedAt: group.releasedAt ? new Date(group.releasedAt).toLocaleString("pt-BR") : "—",
      results: group.results.map(r => ({
        exam: r.exam,
        value: r.parameters ? "" : r.value,
        unit: r.parameters ? "" : r.unit,
        referenceRange: r.parameters ? "" : r.referenceRange,
        flag: r.flag,
        parameters: r.parameters,
      })),
      analystName: firstAnalyst?.analystName || "Analista",
      analystCrm: firstAnalyst?.analystCrm,
    };
  }, []);

  const handleDownload = async (group: OrderGroup) => {
    const doc = await generateLaudoPDF(buildLaudoData(group));
    doc.save(`Laudo_${group.orderNumber}.pdf`);
  };

  // Batch download selected laudos
  const handleBatchDownload = useCallback(async () => {
    const selected = filtered.filter(g => selectedIds.has(g.orderId));
    if (selected.length === 0) return;

    for (const group of selected) {
      const doc = await generateLaudoPDF(buildLaudoData(group));
      doc.save(`Laudo_${group.orderNumber}.pdf`);
    }

    toast.success(`${selected.length} laudo${selected.length !== 1 ? "s" : ""} gerado${selected.length !== 1 ? "s" : ""} com sucesso`);
    setSelectedIds(new Set());
  }, [filtered, selectedIds, buildLaudoData]);

  // Selection helpers
  const toggleSelect = (orderId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(g => g.orderId)));
    }
  };

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laudos</h1>
          <p className="text-sm text-muted-foreground">Portal de laudos liberados — visualização e download em PDF</p>
        </div>
        {someSelected && (
          <Button onClick={handleBatchDownload} className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir Selecionados ({selectedIds.size})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{filtered.length} laudo{filtered.length !== 1 ? "s" : ""} liberado{filtered.length !== 1 ? "s" : ""}</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, pedido ou CPF..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <FileDown className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum laudo liberado encontrado</p>
              <p className="text-xs text-muted-foreground">Os laudos aparecerão aqui após a liberação dos resultados na página de Resultados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Exames</TableHead>
                  <TableHead>Liberado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(group => (
                  <TableRow key={group.orderId} className={selectedIds.has(group.orderId) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(group.orderId)}
                        onCheckedChange={() => toggleSelect(group.orderId)}
                        aria-label={`Selecionar laudo ${group.orderNumber}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{group.orderNumber}</TableCell>
                    <TableCell className="font-medium">{group.patientName}</TableCell>
                    <TableCell className="font-mono text-sm">{formatCpf(group.patientCpf)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {group.results.slice(0, 3).map((r, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs">
                            {r.exam}
                          </span>
                        ))}
                        {group.results.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{group.results.length - 3}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{group.releasedAt ? new Date(group.releasedAt).toLocaleString("pt-BR") : "—"}</TableCell>
                    <TableCell><StatusBadge status="released" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setPreview(group)} title="Visualizar">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleDownload(group)}>
                          <FileDown className="w-3.5 h-3.5 mr-1" /> PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={open => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laudo — {preview?.orderNumber}</DialogTitle>
          </DialogHeader>
          {preview && <LaudoPreview group={preview} onDownload={() => handleDownload(preview)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const LaudoPreview = ({ group, onDownload }: { group: OrderGroup; onDownload: () => void }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
      <Field label="Paciente" value={group.patientName} />
      <Field label="CPF" value={formatCpf(group.patientCpf)} mono />
      <Field label="Data de Nascimento" value={new Date(group.patientBirthDate).toLocaleDateString("pt-BR")} />
      <Field label="Sexo" value={group.patientGender === "M" ? "Masculino" : group.patientGender === "F" ? "Feminino" : group.patientGender} />
      <Field label="Médico" value={group.doctorName} />
      <Field label="Convênio" value={group.insurance} />
      <Field label="Liberação" value={group.releasedAt ? new Date(group.releasedAt).toLocaleString("pt-BR") : "—"} />
    </div>

    {group.results.map((r, idx) => {
      if (r.parameters && r.parameters.length > 0) {
        const sections = new Map<string, ExpandedParam[]>();
        for (const p of r.parameters) {
          const sec = p.section || "";
          if (!sections.has(sec)) sections.set(sec, []);
          sections.get(sec)!.push(p);
        }

        return (
          <div key={idx} className="space-y-1">
            <h3 className="font-bold text-sm text-foreground">{r.exam}</h3>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead>Parâmetro</TableHead>
                    <TableHead className="text-center">Resultado</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
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
                      {sectionParams.map((param, pi) => (
                        <TableRow key={pi}>
                          <TableCell className="font-medium text-sm">{param.name}</TableCell>
                          <TableCell className="text-center font-mono font-semibold">{param.value}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{param.unit}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{param.referenceRange}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      }

      return (
        <div key={idx} className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead>Exame</TableHead>
                <TableHead className="text-center">Resultado</TableHead>
                <TableHead className="text-center">Unidade</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead className="text-center">Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">{r.exam}</TableCell>
                <TableCell className="text-center font-mono font-semibold">{r.value}</TableCell>
                <TableCell className="text-center text-muted-foreground">{r.unit}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.referenceRange}</TableCell>
                <TableCell className="text-center">
                  {r.flag !== "normal" && <StatusBadge status={r.flag} />}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      );
    })}

    <div className="border-t pt-4 text-center space-y-1">
      <div className="w-48 mx-auto border-b border-foreground/30 mb-1" />
      <p className="text-sm font-semibold">{group.results[0]?.analystName}</p>
      {group.results[0]?.analystCrm && (
        <p className="text-xs text-muted-foreground">CRM: {group.results[0].analystCrm}</p>
      )}
      <p className="text-xs text-muted-foreground">Assinatura Digital — Laudo emitido eletronicamente</p>
    </div>

    <Button className="w-full" onClick={onDownload}>
      <FileDown className="w-4 h-4 mr-2" /> Baixar PDF
    </Button>
  </div>
);

const Field = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <span className="text-muted-foreground">{label}: </span>
    <span className={`font-medium ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
  </div>
);

function formatCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default Laudos;
