import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, History, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { type AppRole } from "@/lib/navigation";
import CreateUserDialog from "./CreateUserDialog";

interface Props { onBack: () => void; }

const ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "tecnico", label: "Técnico" },
  { value: "recepcao", label: "Recepção" },
];

const MENU_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/pacientes": "Pacientes",
  "/pedidos": "Pedidos",
  "/amostras": "Amostras",
  "/worklist": "Mapa de Trabalho",
  "/qc": "Controle de Qualidade",
  "/resultados": "Resultados",
  "/laudos": "Laudos",
  "/configuracoes": "Configurações",
  "/recepcao": "Recepção",
};



const UsersSettings = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["all_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["all_user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getRoleForUser = (userId: string) => {
    const r = roles.find((r) => r.user_id === userId);
    return r?.role || "tecnico";
  };


  const { data: auditLogs = [] } = useQuery({
    queryKey: ["permission_audit_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permission_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Map user IDs to names for audit display
  const getProfileName = (userId: string) => {
    const p = profiles.find(pr => pr.user_id === userId);
    return p?.full_name || "Usuário desconhecido";
  };

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const existing = roles.find((r) => r.user_id === userId);
      if (existing) {
        const { error } = await supabase.from("user_roles").update({ role: role as any }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all_user_roles"] }); toast.success("Papel atualizado!"); },
    onError: (e: any) => toast.error(e.message),
  });


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground">Controle de acesso e permissões</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <UserPlus className="h-4 w-4" /> Cadastrar Usuário
        </Button>
      </div>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["all_profiles"] });
          qc.invalidateQueries({ queryKey: ["all_user_roles"] });
        }}
      />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead>Setor</TableHead>
                    <TableHead>CRM</TableHead><TableHead>Perfil de Acesso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow> :
                  profiles.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum usuário</TableCell></TableRow> :
                  profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                      <TableCell>{p.role_display}</TableCell>
                      <TableCell>{p.sector || "—"}</TableCell>
                      <TableCell>{p.crm || "—"}</TableCell>
                      <TableCell>
                        <Select value={getRoleForUser(p.user_id)} onValueChange={(v) => updateRole.mutate({ userId: p.user_id, role: v })}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="tecnico">Técnico</SelectItem>
                            <SelectItem value="recepcao">Recepção</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Log de Auditoria</CardTitle>
              <p className="text-sm text-muted-foreground">
                Histórico de alterações de permissões realizadas por administradores.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Módulo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum registro de auditoria
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="font-medium">{getProfileName(log.performed_by)}</TableCell>
                        <TableCell>
                          <span className={log.action === "grant" ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                            {log.action === "grant" ? "Concedeu" : "Revogou"}
                          </span>
                        </TableCell>
                        <TableCell>{ROLES.find(r => r.value === log.target_role)?.label || log.target_role}</TableCell>
                        <TableCell>{MENU_LABELS[log.route] || log.route}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UsersSettings;
