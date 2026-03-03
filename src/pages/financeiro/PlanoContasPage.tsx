import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, ChevronRight, ChevronDown, FolderOpen, FileText, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
  level: number;
  is_group: boolean;
  status: string;
}

const typeLabels: Record<string, string> = {
  receita: "Receita",
  deducao: "Dedução",
  custo: "Custo",
  despesa: "Despesa",
  resultado_financeiro: "Resultado Financeiro",
};

const typeColors: Record<string, string> = {
  receita: "bg-emerald-100 text-emerald-800",
  deducao: "bg-amber-100 text-amber-800",
  custo: "bg-orange-100 text-orange-800",
  despesa: "bg-red-100 text-red-800",
  resultado_financeiro: "bg-blue-100 text-blue-800",
};

const PlanoContasPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const emptyForm = { code: "", name: "", type: "despesa", parent_id: "", is_group: false };
  const [form, setForm] = useState<any>(emptyForm);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["chart_of_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("status", "active")
        .order("code");
      if (error) throw error;
      return data as Account[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code,
        name: form.name,
        type: form.type,
        parent_id: form.parent_id || null,
        is_group: form.is_group,
        level: form.parent_id ? (accounts.find(a => a.id === form.parent_id)?.level || 0) + 1 : 1,
      };
      if (editingAccount) {
        const { error } = await supabase.from("chart_of_accounts").update(payload).eq("id", editingAccount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("chart_of_accounts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success(editingAccount ? "Conta atualizada!" : "Conta criada!");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chart_of_accounts").update({ status: "inactive" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Conta removida!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setForm(emptyForm);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({
      code: account.code,
      name: account.name,
      type: account.type,
      parent_id: account.parent_id || "",
      is_group: account.is_group,
    });
    setDialogOpen(true);
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Build tree
  const rootAccounts = accounts.filter(a => !a.parent_id);
  const getChildren = (parentId: string) => accounts.filter(a => a.parent_id === parentId);
  const groupAccounts = accounts.filter(a => a.is_group);

  // Expand all on first load
  if (accounts.length > 0 && expandedGroups.size === 0) {
    const allGroups = new Set(accounts.filter(a => a.is_group).map(a => a.id));
    if (allGroups.size > 0) setExpandedGroups(allGroups);
  }

  const renderAccount = (account: Account) => {
    const children = getChildren(account.id);
    const isExpanded = expandedGroups.has(account.id);
    const hasChildren = children.length > 0;

    return (
      <div key={account.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group",
            account.level === 1 && "bg-muted/30 font-semibold"
          )}
          style={{ paddingLeft: `${(account.level - 1) * 24 + 12}px` }}
        >
          {account.is_group ? (
            <button onClick={() => toggleGroup(account.id)} className="p-0.5 rounded hover:bg-muted">
              {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
          ) : (
            <span className="w-5" />
          )}
          {account.is_group ? (
            <FolderOpen className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-sm font-mono text-muted-foreground w-16 shrink-0">{account.code}</span>
          <span className={cn("text-sm flex-1", account.is_group && "font-medium")}>{account.name}</span>
          <Badge variant="outline" className={cn("text-[10px] px-1.5", typeColors[account.type])}>
            {typeLabels[account.type]}
          </Badge>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button onClick={() => openEdit(account)} className="p-1 rounded hover:bg-muted">
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {!hasChildren && (
              <button onClick={() => deleteMutation.mutate(account.id)} className="p-1 rounded hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            )}
          </div>
        </div>
        {account.is_group && isExpanded && children.map(renderAccount)}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plano de Contas</h1>
          <p className="text-sm text-muted-foreground">Estrutura de contas contábeis — Prestador de Serviços</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Editar Conta" : "Nova Conta"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (!form.code || !form.name) { toast.error("Preencha código e nome"); return; } saveMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input value={form.code} onChange={(e) => setForm((f: any) => ({ ...f, code: e.target.value }))} placeholder="Ex: 4.2.08" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f: any) => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Conta Pai</Label>
                <Select value={form.parent_id} onValueChange={(v) => setForm((f: any) => ({ ...f, parent_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma (conta raiz)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (conta raiz)</SelectItem>
                    {groupAccounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_group" checked={form.is_group} onChange={(e) => setForm((f: any) => ({ ...f, is_group: e.target.checked }))} className="rounded" />
                <Label htmlFor="is_group" className="text-sm">É um grupo (pode ter sub-contas)</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editingAccount ? "Salvar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : accounts.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-xl">Nenhuma conta cadastrada.</div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="divide-y divide-border">
            {rootAccounts.map(renderAccount)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanoContasPage;
