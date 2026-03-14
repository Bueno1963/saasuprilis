import { useState } from "react";
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

interface Props {
  onBack: () => void;
}

interface PrinterForm {
  name: string;
  type: string;
  location: string;
  ip_address: string;
  model: string;
  status: string;
}

const defaultValues: PrinterForm = {
  name: "",
  type: "laudo",
  location: "",
  ip_address: "",
  model: "",
  status: "active",
};

const PRINTER_TYPES = [
  { value: "laudo", label: "Laudos" },
  { value: "etiqueta", label: "Etiquetas" },
  { value: "codigo_barras", label: "Código de Barras" },
  { value: "geral", label: "Geral" },
];

const PrinterSettings = ({ onBack }: Props) => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [printers, setPrinters] = useState<(PrinterForm & { id: string })[]>([]);
  const { register, handleSubmit, reset, control } = useForm<PrinterForm>({ defaultValues });

  const onSave = (values: PrinterForm) => {
    if (editId) {
      setPrinters((prev) => prev.map((p) => (p.id === editId ? { ...values, id: editId } : p)));
      toast.success("Impressora atualizada!");
    } else {
      setPrinters((prev) => [...prev, { ...values, id: crypto.randomUUID() }]);
      toast.success("Impressora cadastrada!");
    }
    setOpen(false);
    setEditId(null);
    reset(defaultValues);
  };

  const openEdit = (printer: PrinterForm & { id: string }) => {
    setEditId(printer.id);
    reset(printer);
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    reset(defaultValues);
    setOpen(true);
  };

  const remove = (id: string) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
    toast.success("Impressora removida!");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cadastro de Impressoras</h1>
            <p className="text-sm text-muted-foreground">Gerencie impressoras para laudos e etiquetas</p>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />Nova Impressora
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>IP / Porta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma impressora cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                printers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PRINTER_TYPES.find((t) => t.value === p.type)?.label || p.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.model || "—"}</TableCell>
                    <TableCell>{p.location || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{p.ip_address || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status === "active" ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar" : "Nova"} Impressora</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input {...register("name", { required: true })} placeholder="Ex: Impressora Recepção" />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRINTER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label>Modelo</Label>
                <Input {...register("model")} placeholder="Ex: Zebra ZD421" />
              </div>
              <div className="space-y-1">
                <Label>Local</Label>
                <Input {...register("location")} placeholder="Ex: Sala de coleta" />
              </div>
              <div className="space-y-1">
                <Label>IP / Porta</Label>
                <Input {...register("ip_address")} placeholder="Ex: 192.168.1.100:9100" />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="inactive">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrinterSettings;
