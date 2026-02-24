import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Search, Printer, ChevronDown, ChevronUp, User } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { generateLaudoPDF } from "@/lib/generate-laudo-pdf";

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

  const profileMap = new Map(profiles.map(p => [p.user_id, p]));

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

  const handlePrint = (r: any) => {
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
      results: [{
        exam: r.exam,
        value: r.value,
        unit: r.unit,
        referenceRange: r.reference_range,
        flag: r.flag,
      }],
      analystName: analyst?.full_name || "Analista",
      analystCrm: analyst?.crm || undefined,
    });
    doc.save(`Laudo_${order?.order_number || "exame"}_${r.exam}.pdf`);
  };

  const totalExams = grouped.reduce((sum, g) => sum + g.results.length, 0);

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
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
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
                        {group.results.map((r: any) => {
                          const analyst = r.analyst_id ? profileMap.get(r.analyst_id) : null;
                          return (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono text-xs">{r.orders?.order_number || "—"}</TableCell>
                              <TableCell>{r.exam}</TableCell>
                              <TableCell className="font-mono font-semibold">{r.value} {r.unit}</TableCell>
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
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handlePrint(r); }}>
                                  <Printer className="w-3.5 h-3.5 mr-1" /> PDF
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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

export default ExamesLiberados;
