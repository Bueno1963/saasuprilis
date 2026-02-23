import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { patientSchema, PatientFormData, formatCPF, formatPhone } from "@/lib/validations";

const Patients = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      const { error } = await supabase.from("patients").insert([{
        name: form.name,
        cpf: form.cpf,
        birth_date: form.birth_date,
        gender: form.gender,
        phone: form.phone || "",
        email: form.email || "",
        insurance: form.insurance || "Particular",
        created_by: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setOpen(false);
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="w-4 h-4 mr-2" />Novo Paciente</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Cadastrar Paciente</DialogTitle></DialogHeader>
            <PatientForm onSubmit={data => createMutation.mutate(data)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

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

const PatientForm = ({ onSubmit, loading }: { onSubmit: (data: PatientFormData) => void; loading: boolean }) => {
  const [form, setForm] = useState({
    name: "", cpf: "", birth_date: "", gender: "F" as "M" | "F", phone: "", email: "", insurance: "Particular",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = () => {
    const result = patientSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return result.data;
    }
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach(issue => {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    });
    setErrors(fieldErrors);
    return null;
  };

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }));
    // Validate single field
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, cpf: true, birth_date: true, gender: true, phone: true, email: true, insurance: true });
    const data = validate();
    if (data) onSubmit(data);
  };

  const fieldError = (field: string) =>
    touched[field] && errors[field] ? (
      <p className="text-xs text-destructive mt-1">{errors[field]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Nome Completo <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          onBlur={() => handleBlur("name")}
          placeholder="Maria Silva Santos"
          className={touched.name && errors.name ? "border-destructive" : ""}
        />
        {fieldError("name")}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="cpf">CPF <span className="text-destructive">*</span></Label>
          <Input
            id="cpf"
            value={form.cpf}
            onChange={e => setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))}
            onBlur={() => handleBlur("cpf")}
            placeholder="000.000.000-00"
            maxLength={14}
            className={touched.cpf && errors.cpf ? "border-destructive" : ""}
          />
          {fieldError("cpf")}
        </div>
        <div className="space-y-1">
          <Label htmlFor="birth_date">Data de Nascimento <span className="text-destructive">*</span></Label>
          <Input
            id="birth_date"
            type="date"
            value={form.birth_date}
            onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
            onBlur={() => handleBlur("birth_date")}
            max={new Date().toISOString().split("T")[0]}
            className={touched.birth_date && errors.birth_date ? "border-destructive" : ""}
          />
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
          <Input
            id="insurance"
            value={form.insurance}
            onChange={e => setForm(f => ({ ...f, insurance: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
            onBlur={() => handleBlur("phone")}
            placeholder="(00) 00000-0000"
            maxLength={15}
            className={touched.phone && errors.phone ? "border-destructive" : ""}
          />
          {fieldError("phone")}
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            onBlur={() => handleBlur("email")}
            placeholder="paciente@email.com"
            className={touched.email && errors.email ? "border-destructive" : ""}
          />
          {fieldError("email")}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Cadastrar Paciente"}
      </Button>
    </form>
  );
};

export default Patients;
