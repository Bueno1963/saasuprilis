import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface POPFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPop: any;
  categories: { value: string; label: string }[];
}

const INITIAL_STATE = {
  code: "",
  title: "",
  category: "pre_analitica",
  sector: "",
  version: "1.0",
  status: "rascunho",
  objective: "",
  scope: "",
  responsibilities: "",
  materials: "",
  procedure_steps: "",
  safety_notes: "",
  references_docs: "",
  revision_history: "",
  effective_date: "",
  next_review_date: "",
};

const POPFormDialog = ({ open, onOpenChange, editingPop, categories }: POPFormDialogProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_STATE);

  useEffect(() => {
    if (editingPop) {
      setForm({
        code: editingPop.code || "",
        title: editingPop.title || "",
        category: editingPop.category || "pre_analitica",
        sector: editingPop.sector || "",
        version: editingPop.version || "1.0",
        status: editingPop.status || "rascunho",
        objective: editingPop.objective || "",
        scope: editingPop.scope || "",
        responsibilities: editingPop.responsibilities || "",
        materials: editingPop.materials || "",
        procedure_steps: editingPop.procedure_steps || "",
        safety_notes: editingPop.safety_notes || "",
        references_docs: editingPop.references_docs || "",
        revision_history: editingPop.revision_history || "",
        effective_date: editingPop.effective_date || "",
        next_review_date: editingPop.next_review_date || "",
      });
    } else {
      setForm(INITIAL_STATE);
    }
  }, [editingPop, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        effective_date: form.effective_date || null,
        next_review_date: form.next_review_date || null,
        created_by: user?.id || null,
      };

      if (editingPop) {
        const { error } = await supabase.from("pops").update(payload).eq("id", editingPop.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pops").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pops"] });
      toast({ title: editingPop ? "POP atualizado com sucesso" : "POP criado com sucesso" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar POP", description: error.message, variant: "destructive" });
    },
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPop ? "Editar POP" : "Novo Procedimento Operacional Padrão"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="info" className="text-xs">Identificação</TabsTrigger>
            <TabsTrigger value="content" className="text-xs">Conteúdo</TabsTrigger>
            <TabsTrigger value="safety" className="text-xs">Segurança</TabsTrigger>
            <TabsTrigger value="control" className="text-xs">Controle</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input placeholder="POP-001" value={form.code} onChange={(e) => update("code", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Versão</Label>
                <Input placeholder="1.0" value={form.version} onChange={(e) => update("version", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input placeholder="Nome do procedimento" value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria (RDC 978/2025)</Label>
                <Select value={form.category} onValueChange={(v) => update("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Input placeholder="Ex: Bioquímica, Hematologia" value={form.sector} onChange={(e) => update("sector", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="vigente">Vigente</SelectItem>
                  <SelectItem value="obsoleto">Obsoleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Textarea placeholder="Descreva o objetivo deste procedimento..." rows={3} value={form.objective} onChange={(e) => update("objective", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Abrangência / Escopo</Label>
              <Textarea placeholder="Áreas, setores e profissionais envolvidos..." rows={3} value={form.scope} onChange={(e) => update("scope", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Responsabilidades</Label>
              <Textarea placeholder="Responsáveis pela execução e supervisão..." rows={3} value={form.responsibilities} onChange={(e) => update("responsibilities", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Materiais e Equipamentos Necessários</Label>
              <Textarea placeholder="Liste os materiais, reagentes e equipamentos..." rows={3} value={form.materials} onChange={(e) => update("materials", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Procedimento (Passo a Passo)</Label>
              <Textarea placeholder="Descreva cada etapa do procedimento em sequência..." rows={6} value={form.procedure_steps} onChange={(e) => update("procedure_steps", e.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            <div className="space-y-2">
              <Label>Cuidados de Biossegurança</Label>
              <Textarea placeholder="EPIs obrigatórios, riscos, precauções..." rows={4} value={form.safety_notes} onChange={(e) => update("safety_notes", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Referências Normativas</Label>
              <Textarea placeholder="RDC 978/2025, normas ABNT, manuais de fabricantes..." rows={3} value={form.references_docs} onChange={(e) => update("references_docs", e.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="control" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Vigência</Label>
                <Input type="date" value={form.effective_date} onChange={(e) => update("effective_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Próxima Revisão</Label>
                <Input type="date" value={form.next_review_date} onChange={(e) => update("next_review_date", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Histórico de Revisões</Label>
              <Textarea placeholder="v1.0 - 01/01/2025 - Criação do documento&#10;v2.0 - 15/03/2025 - Atualização conforme RDC 978/2025" rows={4} value={form.revision_history} onChange={(e) => update("revision_history", e.target.value)} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="gap-2" onClick={() => mutation.mutate()} disabled={!form.code || !form.title || mutation.isPending}>
            <Save className="h-4 w-4" />
            {mutation.isPending ? "Salvando..." : "Salvar POP"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default POPFormDialog;
