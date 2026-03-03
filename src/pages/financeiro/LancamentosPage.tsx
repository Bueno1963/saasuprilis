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
import { Plus, Pencil, Trash2, ArrowRightLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  is_group: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const LancamentosPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAccount, setFilterAccount] = useState("all");
  const queryClient = useQueryClient();

  const emptyForm = {
    entry_date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    debit_account_id: "",
    credit_account_id: "",
    amount: "",
    document_number: "",
    notes: "",
  };
  const [form, setForm] = useState<any>(emptyForm);

  // Fetch leaf accounts (non-group) for selection
  const { data: accounts = [] } = useQuery({
    queryKey: ["chart_of_accounts_leaf"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("id, code, name, type, is_group")
        .eq("status", "active")
        .order("code");
      if (error) throw error;
      return data as Account[];
    },
  });

  const leafAccounts = accounts.filter(a => !a.is_group);
  const accountMap = new Map(accounts.map(a => [a.id, a]));

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["accounting_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_entries")
        .select("*")
        .eq("status", "ativo")
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        entry_date: form.entry_date,
        description: form.description,
        debit_account_id: form.debit_account_id,
        credit_account_id: form.credit_account_id,
        amount: parseFloat(form.amount),
        document_number: form.document_number || null,
        notes: form.notes,
      };
      if (editingEntry) {
        const { error } = await supabase.from("accounting_entries").update(payload).eq("id", editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accounting_entries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting_entries"] });
      toast.success(editingEntry ? "Lançamento atualizado!" : "Lançamento criado!");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounting_entries").update({ status: "cancelado" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting_entries"] });
      toast.success("Lançamento cancelado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingEntry(null);
    setForm(emptyForm);
  };

  const openEdit = (entry: any) => {
    setEditingEntry(entry);
    setForm({
      entry_date: entry.entry_date,
      description: entry.description,
      debit_account_id: entry.debit_account_id,
      credit_account_id: entry.credit_account_id,
      amount: String(entry.amount),
      document_number: entry.document_number || "",
      notes: entry.notes || "",
    });
    setDialogOpen(true);
  };

  const getAccountLabel = (id: string) => {
    const acc = accountMap.get(id);
    return acc ? `${acc.code} — ${acc.name}` : "—";
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.document_number && entry.document_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAccount = filterAccount === "all" || 
      entry.debit_account_id === filterAccount || 
      entry.credit_account_id === filterAccount;
    return matchesSearch && matchesAccount;
  });

  const totalDebits = filteredEntries.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lançamentos Contábeis</h1>
          <p className="text-sm text-muted-foreground">Registro de lançamentos por partida dobrada</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.description || !form.amount || !form.debit_account_id || !form.credit_account_id) {
                  toast.error("Preencha todos os campos obrigatórios");
                  return;
                }
                if (form.debit_account_id === form.credit_account_id) {
                  toast.error("Conta débito e crédito devem ser diferentes");
                  return;
                }
                if (parseFloat(form.amount) <= 0) {
                  toast.error("Valor deve ser maior que zero");
                  return;
                }
                saveMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={form.entry_date} onChange={(e) => setForm((f: any) => ({ ...f, entry_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Nº Documento</Label>
                  <Input value={form.document_number} onChange={(e) => setForm((f: any) => ({ ...f, document_number: e.target.value }))} placeholder="NF, recibo..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição / Histórico *</Label>
                <Input value={form.description} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="Descrição do lançamento" />
              </div>
              <div className="space-y-2">
                <Label>Conta Débito *</Label>
                <Select value={form.debit_account_id} onValueChange={(v) => setForm((f: any) => ({ ...f, debit_account_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                  <SelectContent>
                    {leafAccounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta Crédito *</Label>
                <Select value={form.credit_account_id} onValueChange={(v) => setForm((f: any) => ({ ...f, credit_account_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                  <SelectContent>
                    {leafAccounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm((f: any) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editingEntry ? "Salvar" : "Lançar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAccount} onValueChange={setFilterAccount}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {leafAccounts.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">{filteredEntries.length} lançamento(s)</span>
        <Badge variant="outline" className="font-mono">{formatCurrency(totalDebits)}</Badge>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-xl">Nenhum lançamento registrado.</div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Débito</TableHead>
                <TableHead>Crédito</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Doc.</TableHead>
                <TableHead className="text-right w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs">{entry.entry_date}</TableCell>
                  <TableCell className="font-medium">{entry.description}</TableCell>
                  <TableCell>
                    <span className="text-xs text-red-600">{getAccountLabel(entry.debit_account_id)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-emerald-600">{getAccountLabel(entry.credit_account_id)}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(Number(entry.amount))}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{entry.document_number || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(entry)} className="p-1 rounded hover:bg-muted">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(entry.id)} className="p-1 rounded hover:bg-destructive/10">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
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

export default LancamentosPage;
