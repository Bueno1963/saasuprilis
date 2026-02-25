import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppRole } from "@/lib/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateUserDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role_display: "Técnico",
    sector: "",
    crm: "",
    role: "tecnico" as AppRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email e senha são obrigatórios");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-create-user", {
        body: form,
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success("Usuário criado com sucesso!");
      setForm({ email: "", password: "", full_name: "", role_display: "Técnico", sector: "", crm: "", role: "tecnico" });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
          <DialogDescription>Preencha os dados para criar uma conta de acesso ao sistema.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Senha temporária *</Label>
              <Input id="password" type="password" value={form.password} onChange={e => update("password", e.target.value)} required minLength={6} />
            </div>
            <div>
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" value={form.full_name} onChange={e => update("full_name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="role_display">Cargo</Label>
                <Input id="role_display" value={form.role_display} onChange={e => update("role_display", e.target.value)} placeholder="Técnico" />
              </div>
              <div>
                <Label htmlFor="sector">Setor</Label>
                <Input id="sector" value={form.sector} onChange={e => update("sector", e.target.value)} placeholder="Bioquímica" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="crm">CRM</Label>
                <Input id="crm" value={form.crm} onChange={e => update("crm", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="role">Perfil de acesso</Label>
                <Select value={form.role} onValueChange={v => update("role", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="recepcao">Recepção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
