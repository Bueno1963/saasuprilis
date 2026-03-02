import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Pencil, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { patientSchema, PatientFormData, formatCPF, formatPhone } from "@/lib/validations";

const Patients = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "success">("create");
  const [createdPatient, setCreatedPatient] = useState<any>(null);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (form: PatientFormData) => {
      const { data, error } = await supabase.from("patients").insert([{
        name: form.name, cpf: form.cpf, birth_date: form.birth_date, gender: form.gender,
        phone: form.phone || "", email: form.email || "", insurance: form.insurance || "Particular",
        created_by: user?.id,
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setCreatedPatient(data);
      setMode("success");
      toast.success("Paciente cadastrado com sucesso!");
    },
    onError: (e: any) => {
      if (e.message?.includes("duplicate")) {
        toast.error("CPF já cadastrado no sistema.");
      } else {
        toast.error(e.message || "Erro ao cadastrar paciente");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (form: PatientFormData & { id: string }) => {
      const { id, ...rest } = form;
      const { data, error } = await supabase.from("patients").update({
        name: rest.name, cpf: rest.cpf, birth_date: rest.birth_date, gender: rest.gender,
        phone: rest.phone || "", email: rest.email || "", insurance: rest.insurance || "Particular",
      }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setCreatedPatient(data);
      setMode("success");
      toast.success("Paciente atualizado com sucesso!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar paciente"),
  });

  const handleOpenCreate = () => {
    setEditingPatient(null);
    setCreatedPatient(null);
    setMode("create");
    setOpen(true);
  };

  const handleEditPatient = (patient: any) => {
    setEditingPatient(patient);
    setCreatedPatient(null);
    setMode("create");
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setMode("create");
    setEditingPatient(null);
    setCreatedPatient(null);
  };

  const handleContinueService = () => {
    if (createdPatient) {
      handleClose();
      navigate("/pedidos", { state: { autoCreateForPatient: createdPatient } });
    }
  };

  const handleEditFromSuccess = () => {
    if (createdPatient) {
      setEditingPatient(createdPatient);
      setMode("create");
    }
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.cpf.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro e consulta de pacientes</p>
        </div>
        <Button onClick={handleOpenCreate}><UserPlus className="w-4 h-4 mr-2" />Novo Paciente</Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "success" ? "Paciente Cadastrado" : editingPatient ? "Alterar Paciente" : "Cadastrar Paciente"}
            </DialogTitle>
          </DialogHeader>

          {mode === "success" && createdPatient ? (
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-4 space-y-2">
                <p className="text-sm"><span className="font-medium">Nome:</span> {createdPatient.name}</p>
                <p className="text-sm"><span className="font-medium">CPF:</span> {createdPatient.cpf}</p>
                <p className="text-sm"><span className="font-medium">Convênio:</span> {createdPatient.insurance || "Particular"}</p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Salvar
                </Button>
                <Button variant="outline" onClick={handleEditFromSuccess} className="flex-1">
                  <Pencil className="w-4 h-4 mr-2" />Alterar
                </Button>
                <Button onClick={handleContinueService} className="flex-1">
                  <ArrowRight className="w-4 h-4 mr-2" />Continuar atendimento
                </Button>
              </div>
            </div>
          ) : (
            <PatientForm
              onSubmit={data => {
                if (editingPatient) {
                  updateMutation.mutate({ ...data, id: editingPatient.id });
                } else {
                  createMutation.mutate(data);
                }
              }}
              loading={createMutation.isPending || updateMutation.isPending}
              initialData={editingPatient ? {
                name: editingPatient.name,
                cpf: editingPatient.cpf,
                birth_date: editingPatient.birth_date,
                gender: editingPatient.gender as "M" | "F",
                phone: editingPatient.phone || "",
                email: editingPatient.email || "",
                insurance: editingPatient.insurance || "Particular",
              } : undefined}
              submitLabel={editingPatient ? "Salvar Alterações" : "Cadastrar Paciente"}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <p className="text-sm text-muted-foreground">{filtered.length} pacientes</p>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum paciente encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Nascimento</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Convênio</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(patient => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell className="font-mono text-sm">{patient.cpf}</TableCell>
                    <TableCell>{new Date(patient.birth_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{patient.gender === "M" ? "Masculino" : "Feminino"}</TableCell>
                    <TableCell>{patient.insurance}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => handleEditPatient(patient)}>
                        <Pencil className="w-4 h-4" />
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

const PatientForm = ({ onSubmit, loading, initialData, submitLabel }: {
  onSubmit: (data: PatientFormData) => void;
  loading: boolean;
  initialData?: PatientFormData;
  submitLabel?: string;
}) => {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    cpf: initialData?.cpf || "",
    birth_date: initialData?.birth_date || "",
    gender: (initialData?.gender || "F") as "M" | "F",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    insurance: initialData?.insurance || "Particular",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cpfCheck, setCpfCheck] = useState<{ loading: boolean; found: any | null; checked: boolean }>({ loading: false, found: null, checked: false });

  const checkCpfDuplicate = async (cpf: string) => {
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length < 11) {
      setCpfCheck({ loading: false, found: null, checked: false });
      return;
    }
    setCpfCheck(c => ({ ...c, loading: true }));
    const { data } = await supabase
      .from("patients")
      .select("id, name, cpf")
      .eq("cpf", cpf)
      .maybeSingle();
    
    // If editing, ignore the current patient
    const isCurrentPatient = initialData && data?.cpf === initialData.cpf;
    setCpfCheck({ loading: false, found: isCurrentPatient ? null : data, checked: true });
  };

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }));
    const result = patientSchema.safeParse(form);
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path[0] === field);
      if (issue) {
        setErrors(e => ({ ...e, [field]: issue.message }));
      } else {
        setErrors(e => { const n = { ...e }; delete n[field]; return n; });
      }
    } else {
      setErrors(e => { const n = { ...e }; delete n[field]; return n; });
    }

    if (field === "cpf") {
      checkCpfDuplicate(form.cpf);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpfCheck.found) {
      toast.error("CPF já cadastrado no sistema.");
      return;
    }
    setTouched({ name: true, cpf: true, birth_date: true, gender: true, phone: true, email: true, insurance: true });
    const result = patientSchema.safeParse(form);
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

  const fieldError = (field: string) =>
    touched[field] && errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Nome Completo <span className="text-destructive">*</span></Label>
        <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onBlur={() => handleBlur("name")} placeholder="Maria Silva Santos" className={touched.name && errors.name ? "border-destructive" : ""} />
        {fieldError("name")}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="cpf">CPF <span className="text-destructive">*</span></Label>
          <Input id="cpf" value={form.cpf} onChange={e => {
            setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }));
            setCpfCheck({ loading: false, found: null, checked: false });
          }} onBlur={() => handleBlur("cpf")} placeholder="000.000.000-00" maxLength={14} className={touched.cpf && (errors.cpf || cpfCheck.found) ? "border-destructive" : ""} />
          {fieldError("cpf")}
          {cpfCheck.loading && <p className="text-xs text-muted-foreground mt-1">Verificando CPF...</p>}
          {cpfCheck.found && (
            <div className="mt-1.5 p-2 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive font-medium">CPF já cadastrado</p>
              <p className="text-xs text-muted-foreground mt-0.5">Paciente: {cpfCheck.found.name}</p>
            </div>
          )}
          {cpfCheck.checked && !cpfCheck.found && !errors.cpf && form.cpf.replace(/\D/g, "").length === 11 && (
            <p className="text-xs text-green-600 mt-1">✓ CPF disponível</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="birth_date">Data de Nascimento <span className="text-destructive">*</span></Label>
          <Input id="birth_date" type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} onBlur={() => handleBlur("birth_date")} max={new Date().toISOString().split("T")[0]} className={touched.birth_date && errors.birth_date ? "border-destructive" : ""} />
          {fieldError("birth_date")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Sexo <span className="text-destructive">*</span></Label>
          <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v as "M" | "F" }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="F">Feminino</SelectItem>
              <SelectItem value="M">Masculino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="insurance">Convênio</Label>
          <Input id="insurance" value={form.insurance} onChange={e => setForm(f => ({ ...f, insurance: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))} onBlur={() => handleBlur("phone")} placeholder="(00) 00000-0000" maxLength={15} className={touched.phone && errors.phone ? "border-destructive" : ""} />
          {fieldError("phone")}
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} onBlur={() => handleBlur("email")} placeholder="paciente@email.com" className={touched.email && errors.email ? "border-destructive" : ""} />
          {fieldError("email")}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !!cpfCheck.found}>
        {loading ? "Salvando..." : (submitLabel || "Cadastrar Paciente")}
      </Button>
    </form>
  );
};

export default Patients;
