import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import { Search, Plus, X } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { orderSchema, OrderFormData } from "@/lib/validations";

const EXAM_SUGGESTIONS = [
  "Hemograma", "Glicose", "Colesterol Total", "Triglicerídeos", "TSH", "T4 Livre",
  "Ureia", "Creatinina", "TGO/AST", "TGP/ALT", "Ácido Úrico", "Hemoglobina Glicada (HbA1c)",
  "PSA Total", "Beta-HCG", "Insulina", "Vitamina D", "Vitamina B12", "Ferro Sérico",
  "Ferritina", "PCR", "VHS", "EAS (Urina)", "Progesterona", "Estradiol", "Testosterona",
];

const Orders = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
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

  const createMutation = useMutation({
    mutationFn: async (form: OrderFormData) => {
      const { error } = await supabase.from("orders").insert([{
        patient_id: form.patient_id,
        doctor_name: form.doctor_name,
        insurance: form.insurance || "Particular",
        exams: form.exams,
        priority: form.priority,
        order_number: "",
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setOpen(false);
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Pedido</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Criar Pedido</DialogTitle></DialogHeader>
            <OrderForm patients={patients} onSubmit={data => createMutation.mutate(data)} loading={createMutation.isPending} />
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

const OrderForm = ({ patients, onSubmit, loading }: { patients: { id: string; name: string; insurance: string | null }[]; onSubmit: (data: OrderFormData) => void; loading: boolean }) => {
  const [form, setForm] = useState({
    patient_id: "", doctor_name: "", insurance: "Particular", exams: [] as string[], priority: "normal" as "normal" | "urgent",
  });
  const [examInput, setExamInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = EXAM_SUGGESTIONS.filter(
    s => s.toLowerCase().includes(examInput.toLowerCase()) && !form.exams.includes(s)
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
          <Input
            id="insurance"
            value={form.insurance}
            onChange={e => setForm(f => ({ ...f, insurance: e.target.value }))}
          />
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
                  key={suggestion}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  onMouseDown={e => { e.preventDefault(); addExam(suggestion); }}
                >
                  {suggestion}
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
