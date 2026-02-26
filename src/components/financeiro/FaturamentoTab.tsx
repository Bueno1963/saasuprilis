import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Send, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  aberto: "bg-blue-100 text-blue-800",
  enviado: "bg-yellow-100 text-yellow-800",
  pago: "bg-green-100 text-green-800",
  parcial: "bg-orange-100 text-orange-800",
  glosado: "bg-red-100 text-red-800",
};

const FaturamentoTab = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    insurance_plan_id: "",
    reference_month: format(new Date(), "yyyy-MM"),
    notes: "",
  });

  const { data: insurancePlans = [] } = useQuery({
    queryKey: ["insurance_plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("insurance_plans").select("id, name, code").eq("status", "active").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["billing_batches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("billing_batches").select("*, insurance_plans(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const batchNumber = `FAT-${form.reference_month}-${String(batches.length + 1).padStart(3, "0")}`;
      const { error } = await supabase.from("billing_batches").insert({
        insurance_plan_id: form.insurance_plan_id,
        batch_number: batchNumber,
        reference_month: form.reference_month,
        notes: form.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing_batches"] });
      toast.success("Lote de faturamento criado!");
      setDialogOpen(false);
      setForm({ insurance_plan_id: "", reference_month: format(new Date(), "yyyy-MM"), notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "enviado") updates.sent_at = new Date().toISOString();
      if (status === "pago") updates.paid_at = new Date().toISOString();
      const { error } = await supabase.from("billing_batches").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing_batches"] });
      toast.success("Status atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Lotes de Faturamento</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" style={{ backgroundColor: "#244294" }}>
              <Plus className="h-4 w-4" /> Novo Lote
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Lote de Faturamento</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (!form.insurance_plan_id) { toast.error("Selecione um convênio"); return; } createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Convênio</Label>
                <Select value={form.insurance_plan_id} onValueChange={(v) => setForm(f => ({ ...f, insurance_plan_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                  <SelectContent>
                    {insurancePlans.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mês de Referência</Label>
                <Input type="month" value={form.reference_month} onChange={(e) => setForm(f => ({ ...f, reference_month: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} style={{ backgroundColor: "#244294" }}>
                {createMutation.isPending ? "Criando..." : "Criar Lote"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> : batches.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-xl">Nenhum lote de faturamento criado.</div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">{b.batch_number}</TableCell>
                  <TableCell>{b.insurance_plans?.name || "—"}</TableCell>
                  <TableCell>{b.reference_month}</TableCell>
                  <TableCell>R$ {Number(b.total_amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", statusColors[b.status])}>{b.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {b.status === "aberto" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateStatus.mutate({ id: b.id, status: "enviado" })}>
                        <Send className="h-3 w-3" /> Enviar
                      </Button>
                    )}
                    {b.status === "enviado" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateStatus.mutate({ id: b.id, status: "pago" })}>
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

export default FaturamentoTab;
