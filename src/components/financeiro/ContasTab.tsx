import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  pago: "bg-green-100 text-green-800",
  parcial: "bg-orange-100 text-orange-800",
  cancelado: "bg-red-100 text-red-800",
  inadimplente: "bg-red-200 text-red-900",
};

interface ReceivablesTabProps {
  type: "receivables" | "payables";
}

const ContasTab = ({ type }: ReceivablesTabProps) => {
  const isReceivable = type === "receivables";
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const emptyForm = isReceivable
    ? { description: "", amount: "", patient_id: "", payment_type: "particular", due_date: format(new Date(), "yyyy-MM-dd"), notes: "" }
    : { description: "", amount: "", category: "outros", supplier: "", due_date: format(new Date(), "yyyy-MM-dd"), recurrence: "unico", notes: "" };

  const [form, setForm] = useState<any>(emptyForm);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("id, name, cpf").order("name");
      if (error) throw error;
      return data;
    },
    enabled: isReceivable,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: [type],
    queryFn: async () => {
      if (isReceivable) {
        const { data, error } = await supabase.from("receivables").select("*, patients(name)").order("due_date", { ascending: false });
        if (error) throw error;
        return data as any[];
      } else {
        const { data, error } = await supabase.from("payables").select("*").order("due_date", { ascending: false });
        if (error) throw error;
        return data as any[];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(form.amount);
      if (isReceivable) {
        const { error } = await supabase.from("receivables").insert({
          description: form.description,
          amount,
          net_amount: amount,
          patient_id: form.patient_id,
          payment_type: form.payment_type,
          due_date: form.due_date,
          notes: form.notes,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payables").insert({
          description: form.description,
          amount,
          category: form.category,
          supplier: form.supplier,
          due_date: form.due_date,
          recurrence: form.recurrence,
          notes: form.notes,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type] });
      toast.success(`${isReceivable ? "Conta a receber" : "Conta a pagar"} criada!`);
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const table = isReceivable ? "receivables" : "payables";
      const item = items.find((i: any) => i.id === id);
      const { error } = await supabase.from(table).update({
        status: "pago",
        paid_at: new Date().toISOString(),
        paid_amount: item?.amount || item?.net_amount || 0,
        payment_method: "pix",
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type] });
      toast.success("Marcado como pago!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const categories = [
    { value: "fornecedores", label: "Fornecedores" },
    { value: "salarios", label: "Salários" },
    { value: "insumos", label: "Insumos" },
    { value: "manutencao", label: "Manutenção" },
    { value: "aluguel", label: "Aluguel" },
    { value: "outros", label: "Outros" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{isReceivable ? "Contas a Receber" : "Contas a Pagar"}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" style={{ backgroundColor: "#244294" }}>
              <Plus className="h-4 w-4" /> Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova {isReceivable ? "Conta a Receber" : "Conta a Pagar"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (!form.description || !form.amount) { toast.error("Preencha os campos obrigatórios"); return; } if (isReceivable && !form.patient_id) { toast.error("Selecione um paciente"); return; } createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input value={form.description} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
              </div>
              {isReceivable ? (
                <>
                  <div className="space-y-2">
                    <Label>Paciente *</Label>
                    <Select value={form.patient_id} onValueChange={(v) => setForm((f: any) => ({ ...f, patient_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} — {p.cpf}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={form.payment_type} onValueChange={(v) => setForm((f: any) => ({ ...f, payment_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="particular">Particular</SelectItem>
                        <SelectItem value="convenio">Convênio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((f: any) => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Input value={form.supplier} onChange={(e) => setForm((f: any) => ({ ...f, supplier: e.target.value }))} />
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f: any) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm((f: any) => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} style={{ backgroundColor: "#244294" }}>
                {createMutation.isPending ? "Salvando..." : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> : items.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-xl">Nenhuma conta registrada.</div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                {isReceivable && <TableHead>Paciente</TableHead>}
                {!isReceivable && <TableHead>Categoria</TableHead>}
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.description}</TableCell>
                  {isReceivable && <TableCell>{item.patients?.name || "—"}</TableCell>}
                  {!isReceivable && <TableCell className="capitalize">{item.category}</TableCell>}
                  <TableCell>R$ {Number(isReceivable ? (item as any).net_amount : item.amount).toFixed(2)}</TableCell>
                  <TableCell>{item.due_date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", statusColors[item.status])}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status === "pendente" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => markPaid.mutate(item.id)}>
                        <CheckCircle className="h-3 w-3" /> Pago
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ContasTab;
