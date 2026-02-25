import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { generateLaudoPDF, drawLaudoOnDoc } from "@/lib/generate-laudo-pdf";

const ImprimirExames = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: released = [], isLoading } = useQuery({
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

  // Group by order
  const orderMap = new Map<string, any>();
  for (const r of released as any[]) {
    const order = r.orders;
    const patient = order?.patients;
    if (!orderMap.has(r.order_id)) {
      orderMap.set(r.order_id, {
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
      });
    }
    orderMap.get(r.order_id)!.results.push({
      exam: r.exam,
      value: r.value,
      unit: r.unit,
      referenceRange: r.reference_range,
      flag: r.flag,
    });
  }

  const grouped = Array.from(orderMap.values());
  const filtered = grouped.filter(g =>
    g.patientName.toLowerCase().includes(search.toLowerCase()) ||
    g.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    g.patientCpf.includes(search)
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(g => g.orderId)));
    }
  };

  const formatCpf = (cpf: string) => {
    const d = cpf.replace(/\D/g, "");
    if (d.length !== 11) return cpf;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  const handlePrint = () => {
    const toPrint = filtered.filter(g => selected.has(g.orderId));
    if (toPrint.length === 0) return;

    // Generate first PDF, then add pages for remaining orders
    const firstGroup = toPrint[0];
    const doc = generateLaudoPDF({
      orderNumber: firstGroup.orderNumber,
      patientName: firstGroup.patientName,
      patientCpf: formatCpf(firstGroup.patientCpf),
      patientBirthDate: new Date(firstGroup.patientBirthDate).toLocaleDateString("pt-BR"),
      patientGender: firstGroup.patientGender,
      doctorName: firstGroup.doctorName,
      insurance: firstGroup.insurance,
      collectedAt: firstGroup.releasedAt ? new Date(firstGroup.releasedAt).toLocaleDateString("pt-BR") : "—",
      releasedAt: firstGroup.releasedAt ? new Date(firstGroup.releasedAt).toLocaleString("pt-BR") : "—",
      results: firstGroup.results,
      analystName: "Analista",
    });

    // Append remaining orders as new pages in the same document
    for (let i = 1; i < toPrint.length; i++) {
      const group = toPrint[i];
      doc.addPage();
      // Re-use generateLaudoPDF logic by generating a temp doc and copying isn't easy with jsPDF,
      // so we'll call a helper that draws directly on the existing doc
      drawLaudoOnDoc(doc, {
        orderNumber: group.orderNumber,
        patientName: group.patientName,
        patientCpf: formatCpf(group.patientCpf),
        patientBirthDate: new Date(group.patientBirthDate).toLocaleDateString("pt-BR"),
        patientGender: group.patientGender,
        doctorName: group.doctorName,
        insurance: group.insurance,
        collectedAt: group.releasedAt ? new Date(group.releasedAt).toLocaleDateString("pt-BR") : "—",
        releasedAt: group.releasedAt ? new Date(group.releasedAt).toLocaleString("pt-BR") : "—",
        results: group.results,
        analystName: "Analista",
      });
    }

    const fileName = toPrint.length === 1
      ? `Laudo_${firstGroup.orderNumber}.pdf`
      : `Laudos_${toPrint.length}_pedidos.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imprimir Exames</h1>
          <p className="text-sm text-muted-foreground">Selecione laudos para download/impressão em lote</p>
        </div>
        {selected.size > 0 && (
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir Selecionados ({selected.size})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{filtered.length} laudo{filtered.length !== 1 ? "s" : ""}</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por paciente, pedido ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Printer className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">Nenhum laudo disponível para impressão</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Exames</TableHead>
                  <TableHead>Liberado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(group => (
                  <TableRow key={group.orderId}>
                    <TableCell>
                      <Checkbox checked={selected.has(group.orderId)} onCheckedChange={() => toggleSelect(group.orderId)} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{group.orderNumber}</TableCell>
                    <TableCell className="font-medium">{group.patientName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {group.results.slice(0, 3).map((r: any, i: number) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs">{r.exam}</span>
                        ))}
                        {group.results.length > 3 && <span className="text-xs text-muted-foreground">+{group.results.length - 3}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{group.releasedAt ? new Date(group.releasedAt).toLocaleString("pt-BR") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprimirExames;
