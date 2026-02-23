import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import { Search, Plus, X, Printer, Tag } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { orderSchema, OrderFormData } from "@/lib/validations";
import { printEtiquetaColeta, printAtendimento } from "@/lib/print-utils";

const Orders = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, patients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("id, name, insurance").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: examCatalog = [] } = useQuery({
    queryKey: ["exam_catalog_names"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("name, code, unit, reference_range").eq("status", "active").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: insurancePlans = [] } = useQuery({
    queryKey: ["insurance_plans_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_plans").select("id, name").eq("status", "active").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (form: OrderFormData) => {
      const { data: orderData, error } = await supabase.from("orders").insert([{
        patient_id: form.patient_id,
        doctor_name: form.doctor_name,
        insurance: form.insurance || "Particular",
        exams: form.exams,
        priority: form.priority,
        order_number: "",
        created_by: user?.id,
      }]).select("*, patients(name, cpf, birth_date, gender, phone, email, insurance)").single();
      if (error) throw error;

      // Create result records for each exam so they appear in Validar/Liberar
      const examCatalogMap = new Map(examCatalog.map(e => [e.name, e]));
      const resultRows = form.exams.map(examName => {
        const catalog = examCatalogMap.get(examName);
        return {
          order_id: orderData.id,
          exam: examName,
          value: "",
          unit: catalog?.unit || "",
          reference_range: catalog?.reference_range || "",
          status: "pending",
          flag: "normal",
        };
      });

      if (resultRows.length > 0) {
        const { error: resError } = await supabase.from("results").insert(resultRows);
        if (resError) console.error("Erro ao criar resultados:", resError);
      }

      return orderData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["results-pending"] });
      setCreatedOrder(data);
      toast.success("Pedido criado com sucesso!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar pedido"),
  });

  const filtered = orders.filter(o => {
    const patientName = (o.patients as any)?.name || "";
    return patientName.toLowerCase().includes(search.toLowerCase()) || o.order_number.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Gerenciamento de pedidos de exames</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setCreatedOrder(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Pedido</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>{createdOrder ? "Pedido Criado" : "Criar Pedido"}</DialogTitle></DialogHeader>
            {createdOrder ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pedido <span className="font-medium text-foreground font-mono">{createdOrder.order_number}</span> para{" "}
                  <span className="font-medium text-foreground">{(createdOrder.patients as any)?.name}</span> criado com sucesso.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    const p = createdOrder.patients as any;
                    if (p) printEtiquetaColeta({ id: createdOrder.id, name: p.name }, createdOrder.exams || []);
                  }}>
                    <Tag className="w-4 h-4 mr-2" />Imprimir Etiqueta Coleta
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    const p = createdOrder.patients as any;
                    if (p) printAtendimento({ id: createdOrder.id, name: p.name, cpf: p.cpf, birth_date: p.birth_date, gender: p.gender, phone: p.phone, email: p.email, insurance: p.insurance });
                  }}>
                    <Printer className="w-4 h-4 mr-2" />Imprimir Atendimento
                  </Button>
                </div>
                <Button className="w-full" onClick={() => { setCreatedOrder(null); setOpen(false); }}>
                  Fechar
                </Button>
              </div>
            ) : (
              <OrderForm patients={patients} examCatalog={examCatalog} insurancePlans={insurancePlans} onSubmit={data => createMutation.mutate(data)} loading={createMutation.isPending} />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar pedido ou paciente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Convênio</TableHead>
                  <TableHead>Exames</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-medium">{order.order_number}</TableCell>
                    <TableCell>{(order.patients as any)?.name}</TableCell>
                    <TableCell className="text-sm">{order.doctor_name}</TableCell>
                    <TableCell className="text-sm">{order.insurance}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{order.exams?.join(", ")}</TableCell>
                    <TableCell><StatusBadge status={order.status} /></TableCell>
                    <TableCell><StatusBadge status={order.priority} /></TableCell>
                    <TableCell className="text-sm">{new Date(order.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Imprimir Etiqueta Amostras"
                        onClick={() => {
                          const p = (order.patients as any);
                          printEtiquetaColeta(
                            { id: order.order_number || order.id, name: p?.name || "" },
                            order.exams || []
                          );
                        }}
                      >
                        <Tag className="w-4 h-4" />
                      </Button>
                    </TableCell>
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

const OrderForm = ({ patients, examCatalog, insurancePlans, onSubmit, loading }: { patients: { id: string; name: string; insurance: string | null }[]; examCatalog: { name: string; code: string; unit: string | null; reference_range: string | null }[]; insurancePlans: { id: string; name: string }[]; onSubmit: (data: OrderFormData) => void; loading: boolean }) => {
  const [form, setForm] = useState({
    patient_id: "", doctor_name: "", insurance: "Particular", exams: [] as string[], priority: "normal" as "normal" | "urgent",
  });
  const [examInput, setExamInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = examCatalog.filter(
    e => (e.name.toLowerCase().includes(examInput.toLowerCase()) || e.code.toLowerCase().includes(examInput.toLowerCase())) && !form.exams.includes(e.name)
  );

  const addExam = (exam?: string) => {
    const value = (exam || examInput).trim();
    if (value && !form.exams.includes(value)) {
      setForm(f => ({ ...f, exams: [...f.exams, value] }));
      setExamInput("");
      setShowSuggestions(false);
      // Clear exams error
      setErrors(e => { const n = { ...e }; delete n.exams; return n; });
    }
  };

  const removeExam = (index: number) => {
    setForm(f => ({ ...f, exams: f.exams.filter((_, j) => j !== index) }));
  };

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setForm(f => ({
      ...f,
      patient_id: patientId,
      insurance: patient?.insurance || "Particular",
    }));
    setErrors(e => { const n = { ...e }; delete n.patient_id; return n; });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ patient_id: true, doctor_name: true, exams: true, priority: true, insurance: true });

    const result = orderSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      onSubmit(result.data);
    } else {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }));
    const result = orderSchema.safeParse(form);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path[0] === field);
      if (issue) setErrors(e => ({ ...e, [field]: issue.message }));
      else setErrors(e => { const n = { ...e }; delete n[field]; return n; });
    } else {
      setErrors(e => { const n = { ...e }; delete n[field]; return n; });
    }
  };

  const fieldError = (field: string) =>
    touched[field] && errors[field] ? (
      <p className="text-xs text-destructive mt-1">{errors[field]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Paciente <span className="text-destructive">*</span></Label>
        <Select value={form.patient_id} onValueChange={handlePatientChange}>
          <SelectTrigger className={touched.patient_id && errors.patient_id ? "border-destructive" : ""}>
            <SelectValue placeholder="Selecionar paciente" />
          </SelectTrigger>
          <SelectContent>
            {patients.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhum paciente cadastrado. Cadastre um paciente primeiro.
              </div>
            ) : (
              patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
            )}
          </SelectContent>
        </Select>
        {fieldError("patient_id")}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="doctor_name">Médico Solicitante <span className="text-destructive">*</span></Label>
          <Input
            id="doctor_name"
            value={form.doctor_name}
            onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
            onBlur={() => handleBlur("doctor_name")}
            placeholder="Dr. Roberto Almeida"
            className={touched.doctor_name && errors.doctor_name ? "border-destructive" : ""}
          />
          {fieldError("doctor_name")}
        </div>
        <div className="space-y-1">
          <Label htmlFor="insurance">Convênio</Label>
          <Select value={form.insurance} onValueChange={v => setForm(f => ({ ...f, insurance: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar convênio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Particular">Particular</SelectItem>
              {insurancePlans.map(p => (
                <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Prioridade</Label>
        <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as "normal" | "urgent" }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="urgent">🔴 Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Exames <span className="text-destructive">*</span></Label>
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={examInput}
              onChange={e => { setExamInput(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Digite ou selecione um exame..."
              onKeyDown={e => {
                if (e.key === "Enter") { e.preventDefault(); addExam(); }
              }}
              className={touched.exams && errors.exams ? "border-destructive" : ""}
            />
            <Button type="button" variant="outline" onClick={() => addExam()} disabled={!examInput.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && examInput && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto">
              {filteredSuggestions.slice(0, 8).map(suggestion => (
                <button
                  key={suggestion.code}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  onMouseDown={e => { e.preventDefault(); addExam(suggestion.name); }}
                >
                  <span className="font-mono text-xs text-muted-foreground mr-2">{suggestion.code}</span>
                  {suggestion.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {form.exams.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.exams.map((exam, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
                {exam}
                <button type="button" onClick={() => removeExam(i)} className="hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {fieldError("exams")}
        {form.exams.length === 0 && !errors.exams && (
          <p className="text-xs text-muted-foreground mt-1">
            Comece a digitar para ver sugestões ou adicione exames manualmente
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Criar Pedido"}
      </Button>
    </form>
  );
};

export default Orders;
