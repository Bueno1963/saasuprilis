import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";

interface Props { onBack: () => void; }

interface ExamForm {
  code: string; name: string; material: string; sector: string; method: string;
  unit: string; reference_range: string; turnaround_hours: number; price: number; status: string; equipment: string;
}

const defaultValues: ExamForm = { code: "", name: "", material: "Sangue", sector: "Bioquímica", method: "", unit: "", reference_range: "", turnaround_hours: 24, price: 0, status: "active", equipment: "" };

const ExamCatalogSettings = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { register, handleSubmit, reset, control } = useForm<ExamForm>({ defaultValues });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["exam_catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: equipmentList = [] } = useQuery({
    queryKey: ["equipment-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment").select("id, name").eq("status", "active").order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()));

  const save = useMutation({
    mutationFn: async (values: ExamForm) => {
      const payload = { ...values, price: Number(values.price), turnaround_hours: Number(values.turnaround_hours) };
      if (editId) {
        const { error } = await supabase.from("exam_catalog").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exam_catalog").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam_catalog"] }); setOpen(false); setEditId(null); reset(defaultValues); toast.success("Exame salvo!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("exam_catalog").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exam_catalog"] }); toast.success("Exame removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (item: any) => { setEditId(item.id); reset(item); setOpen(true); };
  const openNew = () => { setEditId(null); reset(defaultValues); setOpen(true); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Catálogo de Exames</h1>
            <p className="text-sm text-muted-foreground">Valores de referência e configurações</p>
          </div>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Exame</Button>
      </div>

      <Input placeholder="Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Material</TableHead>
                <TableHead>Setor</TableHead><TableHead>Equipamento</TableHead><TableHead>Unidade</TableHead><TableHead>Ref.</TableHead>
                <TableHead>Preço</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow> :
              filtered.length === 0 ? <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Nenhum exame cadastrado</TableCell></TableRow> :
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.code}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.material}</TableCell>
                  <TableCell>{item.sector}</TableCell>
                  <TableCell>{item.equipment || "—"}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-xs">{item.reference_range}</TableCell>
                  <TableCell>R$ {Number(item.price).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Exame</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Código</Label><Input {...register("code", { required: true })} /></div>
              <div className="space-y-1"><Label>Nome</Label><Input {...register("name", { required: true })} /></div>
              <div className="space-y-1"><Label>Material</Label><Input {...register("material")} /></div>
              <div className="space-y-1">
                <Label>Setor</Label>
                <Controller name="sector" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bioquímica">Bioquímica</SelectItem>
                      <SelectItem value="Hematologia">Hematologia</SelectItem>
                      <SelectItem value="Imunologia">Imunologia</SelectItem>
                      <SelectItem value="Microbiologia">Microbiologia</SelectItem>
                      <SelectItem value="Uroanálise">Uroanálise</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1"><Label>Método</Label><Input {...register("method")} /></div>
              <div className="space-y-1">
                <Label>Equipamento</Label>
                <Controller name="equipment" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {equipmentList.map(eq => (
                        <SelectItem key={eq.id} value={eq.name}>{eq.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1"><Label>Unidade</Label><Input {...register("unit")} /></div>
              <div className="space-y-1"><Label>Valor de Referência</Label><Input {...register("reference_range")} /></div>
              <div className="space-y-1"><Label>TAT (horas)</Label><Input type="number" {...register("turnaround_hours")} /></div>
              <div className="space-y-1"><Label>Preço (R$)</Label><Input type="number" step="0.01" {...register("price")} /></div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={save.isPending}>Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamCatalogSettings;
