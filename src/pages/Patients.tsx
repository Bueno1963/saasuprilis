import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Pencil, ArrowRight, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { patientSchema, PatientFormData, formatCPF, formatPhone, formatCEP } from "@/lib/validations";

const Patients = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<"save" | "continue" | null>(null);
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
        address: form.address || "", city: form.city || "", state: form.state || "", zip_code: form.zip_code || "",
        created_by: user?.id,
      }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente cadastrado com sucesso!");
      if (pendingAction === "continue") {
        setOpen(false);
        navigate("/pedidos", { state: { autoCreateForPatient: data } });
      } else {
        setOpen(false);
      }
      setEditingPatient(null);
      setPendingAction(null);
    },
    onError: (e: any) => {
      setPendingAction(null);
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
        address: rest.address || "", city: rest.city || "", state: rest.state || "", zip_code: rest.zip_code || "",
      }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente atualizado com sucesso!");
      if (pendingAction === "continue") {
        setOpen(false);
        navigate("/pedidos", { state: { autoCreateForPatient: data } });
      } else {
        setOpen(false);
      }
      setEditingPatient(null);
      setPendingAction(null);
    },
    onError: (e: any) => {
      setPendingAction(null);
      toast.error(e.message || "Erro ao atualizar paciente");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente excluído com sucesso!");
    },
    onError: (e: any) => {
      if (e.message?.includes("violates foreign key")) {
        toast.error("Não é possível excluir: paciente possui pedidos vinculados.");
      } else {
        toast.error(e.message || "Erro ao excluir paciente");
      }
    },
  });

  const handleOpenCreate = () => {
    setEditingPatient(null);
    setOpen(true);
  };

  const handleEditPatient = (patient: any) => {
    setEditingPatient(patient);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPatient(null);
    setPendingAction(null);
  };

  const handleFormAction = (data: PatientFormData, action: "save" | "continue") => {
    setPendingAction(action);
    if (editingPatient) {
      updateMutation.mutate({ ...data, id: editingPatient.id });
    } else {
      createMutation.mutate(data);
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
              {editingPatient ? "Alterar Paciente" : "Cadastrar Paciente"}
            </DialogTitle>
          </DialogHeader>
          <PatientForm
            onSave={(data) => handleFormAction(data, "save")}
            onContinue={(data) => handleFormAction(data, "continue")}
            loading={createMutation.isPending || updateMutation.isPending}
            initialData={editingPatient ? {
              name: editingPatient.name,
              cpf: editingPatient.cpf,
              birth_date: editingPatient.birth_date,
              gender: editingPatient.gender as "M" | "F",
              phone: editingPatient.phone || "",
              email: editingPatient.email || "",
              insurance: editingPatient.insurance || "Particular",
              address: editingPatient.address || "",
              city: editingPatient.city || "",
              state: editingPatient.state || "",
              zip_code: editingPatient.zip_code || "",
            } : undefined}
            isEditing={!!editingPatient}
          />
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
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar" onClick={() => handleEditPatient(patient)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir <strong>{patient.name}</strong>? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(patient.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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

const PatientForm = ({ onSave, onContinue, loading, initialData, isEditing }: {
  onSave: (data: PatientFormData) => void;
  onContinue: (data: PatientFormData) => void;
  loading: boolean;
  initialData?: PatientFormData;
  isEditing?: boolean;
}) => {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    cpf: initialData?.cpf || "",
    birth_date: initialData?.birth_date || "",
    gender: (initialData?.gender || "F") as "M" | "F",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    insurance: initialData?.insurance || "Particular",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    zip_code: initialData?.zip_code || "",
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

  const validateAndRun = (action: (data: PatientFormData) => void) => {
    if (cpfCheck.found) {
      toast.error("CPF já cadastrado no sistema.");
      return;
    }
    setTouched({ name: true, cpf: true, birth_date: true, gender: true, phone: true, email: true, insurance: true });
    const result = patientSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      action(result.data);
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

  const isDisabled = loading || !!cpfCheck.found;

  return (
    <form onSubmit={e => { e.preventDefault(); validateAndRun(onSave); }} className="space-y-4">
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

      {/* Endereço */}
      <div className="space-y-1">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rua, número, complemento" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Cidade" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="state">UF</Label>
          <Input id="state" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="UF" maxLength={2} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="zip_code">CEP</Label>
          <Input id="zip_code" value={form.zip_code} onChange={e => setForm(f => ({ ...f, zip_code: formatCEP(e.target.value) }))} placeholder="00000-000" maxLength={9} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="outline" className="flex-1" disabled={isDisabled}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
        {isEditing && (
          <Button type="button" variant="outline" className="flex-1" disabled={isDisabled} onClick={() => validateAndRun(onSave)}>
            <Pencil className="w-4 h-4 mr-2" />Alterar
          </Button>
        )}
        <Button type="button" className="flex-1" disabled={isDisabled} onClick={() => validateAndRun(onContinue)}>
          <ArrowRight className="w-4 h-4 mr-2" />Continuar atendimento
        </Button>
      </div>
    </form>
  );
};

export default Patients;
