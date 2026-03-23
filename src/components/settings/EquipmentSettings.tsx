import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import EquipmentLibraryDialog from "./EquipmentLibraryDialog";
import { useForm, Controller } from "react-hook-form";

interface Props { onBack: () => void; }

interface EquipForm {
  name: string; manufacturer: string; model: string; serial_number: string;
  sector: string; protocol: string; status: string; notes: string;
}

const defaultValues: EquipForm = { name: "", manufacturer: "", model: "", serial_number: "", sector: "", protocol: "ASTM", status: "active", notes: "" };

const EquipmentSettings = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { register, handleSubmit, reset, control } = useForm<EquipForm>({ defaultValues });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipment").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (values: EquipForm) => {
      if (editId) {
        const { error } = await supabase.from("equipment").update(values).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("equipment").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipment"] }); setOpen(false); setEditId(null); reset(defaultValues); toast.success("Equipamento salvo!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipment"] }); toast.success("Equipamento removido!"); },
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
            <h1 className="text-2xl font-bold text-foreground">Equipamentos</h1>
            <p className="text-sm text-muted-foreground">Gerenciamento de analisadores</p>
          </div>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Equipamento</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead><TableHead>Fabricante</TableHead><TableHead>Modelo</TableHead>
                <TableHead>Setor</TableHead><TableHead>Protocolo</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow> :
              items.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum equipamento cadastrado</TableCell></TableRow> :
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.manufacturer}</TableCell>
                  <TableCell>{item.model}</TableCell>
                  <TableCell>{item.sector}</TableCell>
                  <TableCell>{item.protocol}</TableCell>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Equipamento</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Nome</Label><Input {...register("name", { required: true })} /></div>
              <div className="space-y-1"><Label>Fabricante</Label><Input {...register("manufacturer")} /></div>
              <div className="space-y-1"><Label>Modelo</Label><Input {...register("model")} /></div>
              <div className="space-y-1"><Label>Nº Série</Label><Input {...register("serial_number")} /></div>
              <div className="space-y-1"><Label>Setor</Label><Input {...register("sector")} /></div>
              <div className="space-y-1">
                <Label>Protocolo</Label>
                <Controller name="protocol" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASTM">ASTM</SelectItem>
                      <SelectItem value="HL7">HL7</SelectItem>
                      <SelectItem value="Serial">Serial</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
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

export default EquipmentSettings;
