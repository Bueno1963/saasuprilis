import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Plus, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const REJECTION_REASONS = [
  "Hemólise",
  "Lipemia",
  "Volume insuficiente",
  "Identificação incorreta",
  "Temperatura inadequada",
  "Amostra coagulada",
  "Tubo incorreto",
  "Tempo de estabilidade excedido",
  "Contaminação aparente",
  "Outro",
];

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-info/15 text-info" },
  media: { label: "Média", color: "bg-warning/15 text-warning" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  critica: { label: "Crítica", color: "bg-critical/15 text-critical" },
};

const NonConformityTab = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: nonconformities = [], isLoading } = useQuery({
    queryKey: ["sample-nonconformities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sample_nonconformities")
        .select("*, samples(barcode, sample_type, orders(order_number, patients(name)))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: samples = [] } = useQuery({
    queryKey: ["samples-for-nc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("samples")
        .select("id, barcode, sample_type")
        .eq("is_rejected", false)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, corrective_action }: { id: string; corrective_action: string }) => {
      const { error } = await supabase
        .from("sample_nonconformities")
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          corrective_action,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sample-nonconformities"] });
      toast.success("Não-conformidade resolvida");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pendingCount = nonconformities.filter((nc: any) => !nc.resolved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Não-Conformidades
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingCount} pendente{pendingCount > 1 ? "s" : ""}</Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">Registro de rejeições e desvios de qualidade — RDC 978/2025</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Registrar Não-Conformidade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Registrar Não-Conformidade</DialogTitle></DialogHeader>
            <NonConformityForm
              samples={samples}
              userId={user?.id}
              onSuccess={() => {
                setOpen(false);
                queryClient.invalidateQueries({ queryKey: ["sample-nonconformities"] });
                queryClient.invalidateQueries({ queryKey: ["samples"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
      ) : nonconformities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma não-conformidade registrada</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Amostra</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Severidade</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação Corretiva</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nonconformities.map((nc: any) => {
              const sev = SEVERITY_LABELS[nc.severity] || SEVERITY_LABELS.media;
              return (
                <TableRow key={nc.id} className={nc.resolved ? "" : "bg-destructive/5"}>
                  <TableCell className="text-xs font-mono whitespace-nowrap">
                    {new Date(nc.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{(nc.samples as any)?.barcode}</TableCell>
                  <TableCell className="text-sm">{(nc.samples as any)?.orders?.patients?.name || "—"}</TableCell>
                  <TableCell className="text-sm font-medium">{nc.reason}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${sev.color}`}>{sev.label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{nc.description || "—"}</TableCell>
                  <TableCell>
                    {nc.resolved ? (
                      <Badge className="bg-success/15 text-success text-xs">Resolvida</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {nc.resolved ? (
                      <span className="text-xs text-muted-foreground">{nc.corrective_action}</span>
                    ) : (
                      <ResolveButton ncId={nc.id} onResolve={(action) => resolveMutation.mutate({ id: nc.id, corrective_action: action })} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

const ResolveButton = ({ ncId, onResolve }: { ncId: string; onResolve: (action: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">Resolver</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Resolver Não-Conformidade</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Ação Corretiva <span className="text-destructive">*</span></Label>
            <Textarea value={action} onChange={(e) => setAction(e.target.value)} placeholder="Descreva a ação corretiva tomada..." rows={3} />
          </div>
          <Button className="w-full" disabled={!action.trim()} onClick={() => { onResolve(action); setOpen(false); }}>
            Confirmar Resolução
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const NonConformityForm = ({ samples, userId, onSuccess }: { samples: any[]; userId?: string; onSuccess: () => void }) => {
  const [sampleId, setSampleId] = useState("");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState("media");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleId || !reason) return;
    setLoading(true);

    try {
      // Get user profile name
      let reporterName = "";
      if (userId) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", userId).single();
        reporterName = profile?.full_name || "";
      }

      const { error } = await supabase.from("sample_nonconformities").insert({
        sample_id: sampleId,
        reason,
        severity: severity as any,
        description,
        reported_by: userId,
        reported_by_name: reporterName,
      });
      if (error) throw error;

      // Mark sample as rejected
      await supabase.from("samples").update({ is_rejected: true, rejection_reason: reason }).eq("id", sampleId);

      // Log tracking event
      await supabase.from("sample_tracking_events").insert({
        sample_id: sampleId,
        event_type: "nonconformity",
        new_status: "rejected",
        performed_by: userId,
        performed_by_name: reporterName,
        notes: `Não-conformidade: ${reason}`,
      });

      toast.success("Não-conformidade registrada");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Amostra <span className="text-destructive">*</span></Label>
        <Select value={sampleId} onValueChange={setSampleId}>
          <SelectTrigger><SelectValue placeholder="Selecionar amostra" /></SelectTrigger>
          <SelectContent>
            {samples.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="font-mono text-xs">{s.barcode}</span> — {s.sample_type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Motivo <span className="text-destructive">*</span></Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger><SelectValue placeholder="Selecionar motivo" /></SelectTrigger>
          <SelectContent>
            {REJECTION_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Severidade</Label>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="critica">Crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes adicionais..." rows={2} />
      </div>
      <Button type="submit" variant="destructive" className="w-full" disabled={loading || !sampleId || !reason}>
        {loading ? "Registrando..." : "Registrar Não-Conformidade"}
      </Button>
    </form>
  );
};

export default NonConformityTab;
