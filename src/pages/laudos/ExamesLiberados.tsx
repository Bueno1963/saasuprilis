import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Search, Printer } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { generateLaudoPDF } from "@/lib/generate-laudo-pdf";

const ExamesLiberados = () => {
  const [searchQuery, setSearchQuery] = useState("");

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
  const filtered = results.filter((r: any) => {
    const patient = r.orders?.patients?.name || "";
    const order = r.orders?.order_number || "";
    return patient.toLowerCase().includes(searchLower) ||
      order.toLowerCase().includes(searchLower) ||
      r.exam.toLowerCase().includes(searchLower);
  });

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exames Liberados</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de exames já liberados com laudo finalizado
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {filtered.length} exame{filtered.length !== 1 ? "s" : ""} liberado{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum exame liberado encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Exame</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Liberado em</TableHead>
                  <TableHead>Liberado por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => {
                  const analyst = r.analyst_id ? profileMap.get(r.analyst_id) : null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.orders?.order_number || "—"}</TableCell>
                      <TableCell className="font-medium">{r.orders?.patients?.name || "—"}</TableCell>
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
                        <Button size="sm" variant="outline" onClick={() => handlePrint(r)}>
                          <Printer className="w-3.5 h-3.5 mr-1" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamesLiberados;
