import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import { Search, Plus, X, Printer, Tag, Pencil, Trash2, Globe, MoreHorizontal, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { orderSchema, OrderFormData } from "@/lib/validations";
import { printEtiquetaColeta, printAtendimento, printProtocoloAcesso, printDeclaracaoComparecimento } from "@/lib/print-utils";
import logoImg from "@/assets/logo-dra-dielem.png";

const Orders = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [autoPatient, setAutoPatient] = useState<any>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleteOrderNumber, setDeleteOrderNumber] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const location = useLocation();

  // Auto-open create order dialog when coming from "Continuar Atendimento"
  useEffect(() => {
    const state = location.state as any;
    if (state?.autoCreateForPatient) {
      setAutoPatient(state.autoCreateForPatient);
      setOpen(true);
      // Clear the state so it doesn't re-trigger on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, patients(name, birth_date, cpf, gender, phone, email, insurance)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch which orders have filled results
  const { data: ordersWithResults = [] } = useQuery({
    queryKey: ["orders-with-filled-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("order_id, value")
        .neq("value", "");
      if (error) throw error;
      return [...new Set((data || []).map(r => r.order_id))];
    },
  });

  const ordersWithResultsSet = new Set(ordersWithResults);

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
      const { data, error } = await supabase.from("exam_catalog").select("name, code, unit, reference_range, sector, material").eq("status", "active").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Build exam name -> sector map for label printing
  const examSectorMap: Record<string, string> = {};
  examCatalog.forEach((e) => { if (e.sector) examSectorMap[e.name] = e.sector; });

  const { data: insurancePlans = [] } = useQuery({
    queryKey: ["insurance_plans_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_plans").select("id, name").eq("status", "active").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: labSettings } = useQuery({
    queryKey: ["lab_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_settings").select("name, address, city, state, cnpj, phone, logo_url, technical_responsible, crm_responsible").limit(1).maybeSingle();
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

      // Auto-create samples grouped by sector based on exam catalog
      const sectorMaterialMap = new Map<string, string>();
      for (const examName of form.exams) {
        const catalog = examCatalogMap.get(examName);
        const sector = catalog?.sector || "Bioquímica";
        const material = catalog?.material || "Sangue";
        if (!sectorMaterialMap.has(sector)) {
          sectorMaterialMap.set(sector, material);
        }
      }

      if (sectorMaterialMap.size > 0) {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
        const timeStr = now.toISOString().slice(11, 19).replace(/:/g, "");
        let idx = 0;
        const sampleRows = Array.from(sectorMaterialMap.entries()).map(([sector, material]) => {
          idx++;
          return {
            order_id: orderData.id,
            sample_type: material,
            sector,
            barcode: `LAB${dateStr}${timeStr}${idx.toString().padStart(3, "0")}`,
          };
        });
        const { error: sampleError } = await supabase.from("samples").insert(sampleRows);
        if (sampleError) console.error("Erro ao criar amostras:", sampleError);
      }

      return orderData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["results-pending"] });
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      setCreatedOrder(data);
      toast.success("Pedido criado com sucesso!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar pedido"),
  });

  const updateMutation = useMutation({
    mutationFn: async (form: OrderFormData & { id: string }) => {
      const { id, ...rest } = form;

      // Get current order to find which exams are new
      const currentOrder = orders.find(o => o.id === id);
      const previousExams = currentOrder?.exams || [];
      const newExams = rest.exams.filter(e => !previousExams.includes(e));
      const removedExams = previousExams.filter(e => !rest.exams.includes(e));

      const { error } = await supabase.from("orders").update({
        patient_id: rest.patient_id,
        doctor_name: rest.doctor_name,
        insurance: rest.insurance || "Particular",
        exams: rest.exams,
        priority: rest.priority,
      }).eq("id", id);
      if (error) throw error;

      // Create result records for newly added exams
      if (newExams.length > 0) {
        const examCatalogMap = new Map(examCatalog.map(e => [e.name, e]));
        const resultRows = newExams.map(examName => {
          const catalog = examCatalogMap.get(examName);
          return {
            order_id: id,
            exam: examName,
            value: "",
            unit: catalog?.unit || "",
            reference_range: catalog?.reference_range || "",
            status: "pending",
            flag: "normal",
          };
        });
        const { error: resError } = await supabase.from("results").insert(resultRows);
        if (resError) console.error("Erro ao criar resultados:", resError);
      }

      // Remove result records for removed exams (only if still pending)
      if (removedExams.length > 0) {
        for (const examName of removedExams) {
          await supabase.from("results").delete().eq("order_id", id).eq("exam", examName).eq("status", "pending");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["results-pending"] });
      toast.success("Pedido atualizado!");
      setEditOpen(false);
      setEditingOrder(null);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar pedido"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete all results (including filled ones)
      await supabase.from("results").delete().eq("order_id", id);
      // Delete related samples
      await supabase.from("samples").delete().eq("order_id", id);
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["results-pending"] });
      toast.success("Pedido excluído!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao excluir pedido"),
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
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCreatedOrder(null); setAutoPatient(null); } }}>
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
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => {
                      const p = createdOrder.patients as any;
                      if (p) printEtiquetaColeta({ id: createdOrder.id, name: p.name }, createdOrder.exams || [], examSectorMap);
                    }}>
                      <Tag className="w-4 h-4 mr-2" />Etiqueta Coleta
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => {
                      const p = createdOrder.patients as any;
                      if (p) printAtendimento({ id: createdOrder.id, name: p.name, cpf: p.cpf, birth_date: p.birth_date, gender: p.gender, phone: p.phone, email: p.email, insurance: p.insurance }, logoImg);
                    }}>
                      <Printer className="w-4 h-4 mr-2" />Atendimento
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => {
                    const p = createdOrder.patients as any;
                    if (p) {
                      const portalUrl = `${window.location.origin}/portal-paciente`;
                      printProtocoloAcesso(
                        { order_number: createdOrder.order_number, created_at: createdOrder.created_at, exams: createdOrder.exams || [] },
                        { name: p.name, birth_date: p.birth_date },
                        portalUrl,
                        logoImg
                      );
                    }
                  }}>
                    <Globe className="w-4 h-4 mr-2" />Protocolo de Acesso Web
                   </Button>
                  <Button variant="outline" className="w-full" onClick={() => {
                    const p = createdOrder.patients as any;
                    if (p && labSettings) printDeclaracaoComparecimento({ name: p.name, cpf: p.cpf }, labSettings as any, logoImg);
                  }}>
                    <FileText className="w-4 h-4 mr-2" />Declaração Comparecimento
                  </Button>
                </div>
                <Button className="w-full" onClick={() => { setCreatedOrder(null); setOpen(false); }}>
                  Fechar
                </Button>
              </div>
            ) : (
              <OrderForm patients={patients} examCatalog={examCatalog} insurancePlans={insurancePlans} onSubmit={data => createMutation.mutate(data)} loading={createMutation.isPending} initialData={autoPatient ? { patient_id: autoPatient.id, doctor_name: "", insurance: autoPatient.insurance || "Particular", exams: [], priority: "normal" as const } : undefined} />
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
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                             <MoreHorizontal className="w-4 h-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem onClick={() => {
                             const p = (order.patients as any);
                             printEtiquetaColeta({ id: order.order_number || order.id, name: p?.name || "" }, order.exams || [], examSectorMap);
                           }}>
                             <Tag className="w-4 h-4 mr-2" />Imprimir Etiqueta
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => {
                             const p = (order.patients as any);
                             if (p) {
                               const portalUrl = `${window.location.origin}/portal-paciente`;
                               printProtocoloAcesso(
                                 { order_number: order.order_number, created_at: order.created_at, exams: order.exams || [] },
                                 { name: p.name, birth_date: p.birth_date },
                                  portalUrl,
                                  logoImg
                               );
                             }
                           }}>
                             <Globe className="w-4 h-4 mr-2" />Protocolo de Acesso Web
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const p = (order.patients as any);
                              if (p) printAtendimento({ id: order.id, name: p.name, cpf: p.cpf, birth_date: p.birth_date, gender: p.gender, phone: p.phone, email: p.email, insurance: order.insurance }, logoImg);
                            }}>
                              <Printer className="w-4 h-4 mr-2" />Comprovante de Atendimento
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => {
                               const p = (order.patients as any);
                               if (p && labSettings) printDeclaracaoComparecimento({ name: p.name, cpf: p.cpf }, labSettings as any, logoImg);
                             }}>
                               <FileText className="w-4 h-4 mr-2" />Declaração Comparecimento
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                           <DropdownMenuItem onClick={() => { setEditingOrder(order); setEditOpen(true); }}>
                             <Pencil className="w-4 h-4 mr-2" />Editar Pedido
                           </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setDeleteOrderId(order.id);
                                setDeleteOrderNumber(order.order_number);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />Excluir Pedido
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           )}
         </CardContent>
       </Card>

       {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!deleteOrderId} onOpenChange={(v) => { if (!v) { setDeleteOrderId(null); setDeleteOrderNumber(""); } }}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Excluir pedido {deleteOrderNumber}?</AlertDialogTitle>
             <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os resultados e amostras associados serão excluídos.</AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction onClick={() => { if (deleteOrderId) deleteMutation.mutate(deleteOrderId); setDeleteOrderId(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

       {/* Edit Dialog */}
       <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditingOrder(null); }}>
         <DialogContent className="sm:max-w-lg">
           <DialogHeader><DialogTitle>Editar Pedido {editingOrder?.order_number}</DialogTitle></DialogHeader>
           {editingOrder && (
             <OrderForm
               patients={patients}
               examCatalog={examCatalog}
               insurancePlans={insurancePlans}
               onSubmit={(data) => updateMutation.mutate({ ...data, id: editingOrder.id })}
               loading={updateMutation.isPending}
               initialData={{
                 patient_id: editingOrder.patient_id,
                 doctor_name: editingOrder.doctor_name,
                 insurance: editingOrder.insurance || "Particular",
                 exams: editingOrder.exams || [],
                 priority: editingOrder.priority as "normal" | "urgent",
               }}
               submitLabel="Salvar Alterações"
             />
           )}
         </DialogContent>
       </Dialog>
     </div>
   );
 };

const OrderForm = ({ patients, examCatalog, insurancePlans, onSubmit, loading, initialData, submitLabel }: { patients: { id: string; name: string; insurance: string | null }[]; examCatalog: { name: string; code: string; unit: string | null; reference_range: string | null }[]; insurancePlans: { id: string; name: string }[]; onSubmit: (data: OrderFormData) => void; loading: boolean; initialData?: OrderFormData; submitLabel?: string }) => {
  const [form, setForm] = useState({
    patient_id: initialData?.patient_id || "", doctor_name: initialData?.doctor_name || "", insurance: initialData?.insurance || "Particular", exams: initialData?.exams || [] as string[], priority: (initialData?.priority || "normal") as "normal" | "urgent",
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
        {loading ? "Salvando..." : (submitLabel || "Criar Pedido")}
      </Button>
    </form>
  );
};

export default Orders;
