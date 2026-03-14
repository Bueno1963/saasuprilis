import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import InsurancePlanExamsDialog from "./InsurancePlanExamsDialog";

interface Props { onBack: () => void; }

interface InsForm {
  name: string; code: string; contact_name: string; contact_phone: string;
  contact_email: string; billing_type: string; payment_deadline_days: number;
  discount_percent: number; status: string; notes: string;
}

const defaultValues: InsForm = { name: "", code: "", contact_name: "", contact_phone: "", contact_email: "", billing_type: "TUSS", payment_deadline_days: 30, discount_percent: 0, status: "active", notes: "" };

const InsuranceSettings = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [examsDialogPlan, setExamsDialogPlan] = useState<{ id: string; name: string } | null>(null);
  const { register, handleSubmit, reset, control } = useForm<InsForm>({ defaultValues });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["insurance_plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_plans").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (values: InsForm) => {
      const payload = { ...values, payment_deadline_days: Number(values.payment_deadline_days), discount_percent: Number(values.discount_percent) };
      if (editId) {
        const { error } = await supabase.from("insurance_plans").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("insurance_plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["insurance_plans"] }); setOpen(false); setEditId(null); reset(defaultValues); toast.success("Convênio salvo!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("insurance_plans").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["insurance_plans"] }); toast.success("Convênio removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (item: any) => { setEditId(item.id); reset(item); setOpen(true); };
  const openNew = () => { setEditId(null); reset(defaultValues); setOpen(true); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Convênios</h1>
            <p className="text-sm text-muted-foreground">Tabelas de preços e faturamento</p>
          </div>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Convênio</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Código</TableHead><TableHead>Contato</TableHead>
                <TableHead>Faturamento</TableHead><TableHead>Prazo (dias)</TableHead><TableHead>Desconto</TableHead>
                <TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow> :
              items.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhum convênio cadastrado</TableCell></TableRow> :
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.contact_name}</TableCell>
                  <TableCell>{item.billing_type}</TableCell>
                  <TableCell>{item.payment_deadline_days}</TableCell>
                  <TableCell>{Number(item.discount_percent)}%</TableCell>
                  <TableCell><Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Exames" onClick={() => setExamsDialogPlan({ id: item.id, name: item.name })}><FileText className="h-4 w-4 text-primary" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Convênio</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Nome</Label><Input {...register("name", { required: true })} /></div>
              <div className="space-y-1"><Label>Código</Label><Input {...register("code")} /></div>
              <div className="space-y-1"><Label>Nome Contato</Label><Input {...register("contact_name")} /></div>
              <div className="space-y-1"><Label>Telefone Contato</Label><Input {...register("contact_phone")} /></div>
              <div className="space-y-1"><Label>E-mail Contato</Label><Input {...register("contact_email")} /></div>
              <div className="space-y-1">
                <Label>Tipo Faturamento</Label>
                <Controller name="billing_type" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TUSS">TUSS</SelectItem>
                      <SelectItem value="CBHPM">CBHPM</SelectItem>
                      <SelectItem value="Própria">Tabela Própria</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1"><Label>Prazo Pgto (dias)</Label><Input type="number" {...register("payment_deadline_days")} /></div>
              <div className="space-y-1"><Label>Desconto (%)</Label><Input type="number" step="0.01" {...register("discount_percent")} /></div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={save.isPending}>Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <InsurancePlanExamsDialog
        open={!!examsDialogPlan}
        onOpenChange={(v) => { if (!v) setExamsDialogPlan(null); }}
        insurancePlan={examsDialogPlan}
      />
    </div>
  );
};

export default InsuranceSettings;
