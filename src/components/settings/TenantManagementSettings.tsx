import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Copy, ExternalLink, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  email: string | null;
  status: string;
  plan: string;
  created_at: string;
}

interface Props { onBack: () => void }

const TenantManagementSettings = ({ onBack }: Props) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    lab_name: "",
    cnpj: "",
    email: "",
    password: "",
    responsible_name: "",
  });

  const baseUrl = window.location.origin;

  const loadTenants = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("tenants")
      .select("id, name, slug, cnpj, email, status, plan, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar laboratórios");
    else setTenants(data || []);
    setLoading(false);
  };

  useEffect(() => { loadTenants(); }, []);

  const handleCreate = async () => {
    if (!form.lab_name || !form.email || !form.password) {
      toast.error("Preencha nome do laboratório, e-mail e senha");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("onboard-tenant", { body: form });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Laboratório criado com sucesso!");
      setOpen(false);
      setForm({ lab_name: "", cnpj: "", email: "", password: "", responsible_name: "" });
      loadTenants();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar laboratório");
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = (slug: string) => {
    const url = `${baseUrl}/login/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Gestão de Laboratórios
          </h1>
          <p className="text-sm text-muted-foreground">Crie novos laboratórios SaaS com URL de acesso independente</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />Novo Laboratório</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Novo Laboratório</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nome do Laboratório *</Label>
                <Input value={form.lab_name} onChange={(e) => setForm({ ...form, lab_name: e.target.value })} placeholder="Laboratório Exemplo" />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
              </div>
              <div>
                <Label>Responsável</Label>
                <Input value={form.responsible_name} onChange={(e) => setForm({ ...form, responsible_name: e.target.value })} placeholder="Nome do responsável" />
              </div>
              <div>
                <Label>E-mail do Admin *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@laboratorio.com" />
              </div>
              <div>
                <Label>Senha Inicial *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={submitting}>{submitting ? "Criando..." : "Criar Laboratório"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Laboratórios Cadastrados ({tenants.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL de Acesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => {
                  const url = `${baseUrl}/login/${t.slug}`;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><code className="text-xs">{t.slug}</code></TableCell>
                      <TableCell className="text-xs">{t.email}</TableCell>
                      <TableCell><Badge variant="secondary">{t.plan}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={t.status === "active" ? "default" : t.status === "trial" ? "secondary" : "destructive"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-muted-foreground truncate max-w-[200px]">/login/{t.slug}</code>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyUrl(t.slug)} title="Copiar URL">
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(url, "_blank")} title="Abrir">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {tenants.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Nenhum laboratório cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantManagementSettings;
