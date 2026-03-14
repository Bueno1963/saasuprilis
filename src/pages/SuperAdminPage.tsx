import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Ban, CheckCircle2, Users, Activity, DollarSign } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  plan: string;
  status: string;
  primary_color: string | null;
  logo_url: string | null;
  created_at: string;
}

interface TenantForm {
  name: string;
  slug: string;
  cnpj: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  primary_color: string;
}

const emptyForm: TenantForm = {
  name: "", slug: "", cnpj: "", email: "", phone: "",
  plan: "aprendiz", status: "active", primary_color: "#1e40af",
};

const SuperAdminPage = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TenantForm>(emptyForm);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["admin_tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tenant[];
    },
  });

  const { data: memberCounts = {} } = useQuery({
    queryKey: ["admin_member_counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenant_members").select("tenant_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((m) => { counts[m.tenant_id] = (counts[m.tenant_id] || 0) + 1; });
      return counts;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: TenantForm & { id?: string }) => {
      const { id, ...payload } = values;
      if (id) {
        const { error } = await supabase.from("tenants").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tenants").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_tenants"] });
      toast.success(editingId ? "Tenant atualizado" : "Tenant criado");
      setDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from("tenants").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_tenants"] });
      toast.success("Status atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (t: Tenant) => {
    setEditingId(t.id);
    setForm({ name: t.name, slug: t.slug, cnpj: t.cnpj || "", email: t.email || "", phone: t.phone || "", plan: t.plan, status: t.status, primary_color: t.primary_color || "#1e40af" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.slug) { toast.error("Nome e slug são obrigatórios"); return; }
    saveMutation.mutate({ ...form, id: editingId ?? undefined });
  };

  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const totalMembers = Object.values(memberCounts).reduce((a, b) => a + b, 0);

  const statusBadge = (s: string) => {
    if (s === "active") return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Ativo</Badge>;
    if (s === "trial") return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Trial</Badge>;
    if (s === "suspended") return <Badge variant="destructive">Suspenso</Badge>;
    return <Badge variant="secondary">{s}</Badge>;
  };

  const planLabel: Record<string, string> = { aprendiz: "Aprendiz", companheiro: "Companheiro", mestre: "Mestre", laboratorio_instalado: "Lab. Instalado", starter: "Aprendiz", professional: "Companheiro", enterprise: "Mestre" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Super Admin</h1>
          <p className="text-sm text-muted-foreground">Gerenciamento de laboratórios (tenants)</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Tenant</Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{tenants.length}</p>
              <p className="text-xs text-muted-foreground">Total Tenants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Activity className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{activeTenants}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{totalMembers}</p>
              <p className="text-xs text-muted-foreground">Usuários Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant table */}
      <Card>
        <CardHeader><CardTitle>Laboratórios Cadastrados</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                    <TableCell>{t.cnpj || "—"}</TableCell>
                    <TableCell>{planLabel[t.plan] || t.plan}</TableCell>
                    <TableCell>{memberCounts[t.id] || 0}</TableCell>
                    <TableCell>{statusBadge(t.status)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      {t.status === "active" ? (
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => toggleStatus.mutate({ id: t.id, newStatus: "suspended" })}><Ban className="h-4 w-4" /></Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="text-emerald-600" onClick={() => toggleStatus.mutate({ id: t.id, newStatus: "active" })}><CheckCircle2 className="h-4 w-4" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {tenants.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum tenant cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Tenant" : "Novo Tenant"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lab São Paulo" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="lab-sao-paulo" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprendiz">Aprendiz</SelectItem>
                    <SelectItem value="companheiro">Companheiro</SelectItem>
                    <SelectItem value="mestre">Mestre</SelectItem>
                    <SelectItem value="laboratorio_instalado">Lab. Instalado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cor Primária</Label>
                <div className="flex gap-2">
                  <Input type="color" className="w-12 h-9 p-1" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
                  <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminPage;
