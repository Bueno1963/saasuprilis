import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";

interface Props {
  onBack: () => void;
}

interface SupportLabForm {
  name: string;
  cnpj: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  protocol: string;
  endpoint_url: string;
  api_key: string;
  notes: string;
  status: string;
}

const defaultValues: SupportLabForm = {
  name: "",
  cnpj: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  protocol: "API",
  endpoint_url: "",
  api_key: "",
  notes: "",
  status: "active",
};

const PROTOCOLS = [
  { value: "API", label: "API REST" },
  { value: "HL7", label: "HL7 v2.x" },
  { value: "ASTM", label: "ASTM" },
  { value: "FHIR", label: "HL7 FHIR" },
  { value: "manual", label: "Manual (Planilha/E-mail)" },
];

const SupportLabSettings = ({ onBack }: Props) => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [labs, setLabs] = useState<(SupportLabForm & { id: string })[]>([]);
  const { register, handleSubmit, reset, control } = useForm<SupportLabForm>({ defaultValues });

  const onSave = (values: SupportLabForm) => {
    if (editId) {
      setLabs((prev) => prev.map((l) => (l.id === editId ? { ...values, id: editId } : l)));
      toast.success("Laboratório de apoio atualizado!");
    } else {
      setLabs((prev) => [...prev, { ...values, id: crypto.randomUUID() }]);
      toast.success("Laboratório de apoio cadastrado!");
    }
    setOpen(false);
    setEditId(null);
    reset(defaultValues);
  };

  const openEdit = (lab: SupportLabForm & { id: string }) => {
    setEditId(lab.id);
    reset(lab);
    setOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    reset(defaultValues);
    setOpen(true);
  };

  const remove = (id: string) => {
    setLabs((prev) => prev.filter((l) => l.id !== id));
    toast.success("Laboratório de apoio removido!");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Integração com Laboratório de Apoio</h1>
            <p className="text-sm text-muted-foreground">Cadastro e configuração de laboratórios terceirizados</p>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />Novo Lab. Apoio
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Protocolo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum laboratório de apoio cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                labs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="font-mono text-xs">{l.cnpj || "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{l.contact_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{l.contact_email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PROTOCOLS.find((p) => p.value === l.protocol)?.label || l.protocol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.status === "active" ? "default" : "secondary"}>
                        {l.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(l)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(l.id)}>
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
            <DialogTitle>{editId ? "Editar" : "Novo"} Laboratório de Apoio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nome do Laboratório</Label>
                <Input {...register("name", { required: true })} placeholder="Ex: Lab Central" />
              </div>
              <div className="space-y-1">
                <Label>CNPJ</Label>
                <Input {...register("cnpj")} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-1">
                <Label>Responsável</Label>
                <Input {...register("contact_name")} placeholder="Nome do contato" />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input {...register("contact_phone")} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>E-mail</Label>
                <Input {...register("contact_email")} placeholder="contato@labapoio.com.br" type="email" />
              </div>
              <div className="space-y-1">
                <Label>Protocolo de Integração</Label>
                <Controller
                  name="protocol"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROTOCOLS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
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
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>URL / Endpoint</Label>
                <Input {...register("endpoint_url")} placeholder="https://api.labapoio.com.br/v1" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Chave de API</Label>
                <Input {...register("api_key")} placeholder="Chave de autenticação" type="password" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Observações</Label>
                <Textarea {...register("notes")} placeholder="Informações adicionais sobre a integração" rows={3} />
              </div>
            </div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportLabSettings;
