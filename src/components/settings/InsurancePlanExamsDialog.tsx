import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X, Save, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insurancePlan: { id: string; name: string } | null;
}

interface ExamForm {
  procedure_code: string;
  description: string;
  price: number;
  exam_catalog_id: string | null;
}

const emptyForm: ExamForm = { procedure_code: "", description: "", price: 0, exam_catalog_id: null };

const InsurancePlanExamsDialog = ({ open, onOpenChange, insurancePlan }: Props) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ExamForm>(emptyForm);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogPopoverOpen, setCatalogPopoverOpen] = useState(false);

  const planId = insurancePlan?.id;

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["insurance_plan_exams", planId],
    queryFn: async () => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from("insurance_plan_exams")
        .select("*")
        .eq("insurance_plan_id", planId)
        .order("procedure_code");
      if (error) throw error;
      return data;
    },
    enabled: !!planId && open,
  });

  const { data: catalogExams = [] } = useQuery({
    queryKey: ["exam_catalog_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_catalog")
        .select("id, code, name, price, sector")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const filteredCatalog = catalogExams.filter(
    (e) =>
      e.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      e.code.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: async (values: ExamForm) => {
      const payload = {
        insurance_plan_id: planId!,
        procedure_code: values.procedure_code.trim(),
        description: values.description.trim(),
        price: Number(values.price),
        exam_catalog_id: values.exam_catalog_id || null,
      };
      if (editId) {
        const { error } = await supabase.from("insurance_plan_exams").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("insurance_plan_exams").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insurance_plan_exams", planId] });
      setAddOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast.success(editId ? "Exame atualizado!" : "Exame adicionado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insurance_plan_exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insurance_plan_exams", planId] });
      toast.success("Exame removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      procedure_code: item.procedure_code,
      description: item.description,
      price: item.price,
      exam_catalog_id: item.exam_catalog_id || null,
    });
    setAddOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setAddOpen(true);
  };

  const selectFromCatalog = (catalogItem: { id: string; code: string; name: string; price: number | null }) => {
    setForm({
      procedure_code: catalogItem.code,
      description: catalogItem.name,
      price: catalogItem.price || 0,
      exam_catalog_id: catalogItem.id,
    });
    setCatalogPopoverOpen(false);
    setCatalogSearch("");
  };

  const filtered = exams.filter(
    (e) =>
      e.procedure_code.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.procedure_code.trim() || !form.description.trim()) {
      toast.error("Código e descrição são obrigatórios");
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Exames — {insurancePlan?.name}
            <Badge variant="secondary" className="ml-2 text-xs">{exams.length} procedimentos</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />Adicionar
          </Button>
        </div>

        {addOpen && (
          <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg bg-muted/40 border">
            <div className="flex items-center gap-2">
              <Popover open={catalogPopoverOpen} onOpenChange={setCatalogPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    Selecionar do Catálogo
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Buscar exame no catálogo..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <ScrollArea className="h-64">
                    {filteredCatalog.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4 text-center">Nenhum exame encontrado</p>
                    ) : (
                      filteredCatalog.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b last:border-0 transition-colors"
                          onClick={() => selectFromCatalog(item)}
                        >
                          <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
                          <span className="block font-medium truncate">{item.name}</span>
                          <span className="text-xs text-muted-foreground">{item.sector} • R$ {Number(item.price || 0).toFixed(2)}</span>
                        </button>
                      ))
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {form.exam_catalog_id && (
                <Badge variant="outline" className="text-xs gap-1">
                  <BookOpen className="h-3 w-3" />
                  Vinculado ao catálogo
                  <button type="button" onClick={() => setForm({ ...form, exam_catalog_id: null })}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-1 flex-shrink-0 w-40">
                <Label className="text-xs">Código</Label>
                <Input
                  value={form.procedure_code}
                  onChange={(e) => setForm({ ...form, procedure_code: e.target.value })}
                  placeholder="02.02.01.001-5"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="DOSAGEM DE..."
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1 flex-shrink-0 w-28">
                <Label className="text-xs">Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex gap-1">
                <Button type="submit" size="sm" className="h-9" disabled={saveMutation.isPending}>
                  <Save className="h-4 w-4 mr-1" />{editId ? "Salvar" : "Adicionar"}
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => { setAddOpen(false); setEditId(null); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-28 text-right">Preço (R$)</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {search ? "Nenhum exame encontrado para esta busca" : "Nenhum exame cadastrado para este convênio"}
                </TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.procedure_code}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        {item.description}
                        {(item as any).exam_catalog_id && (
                          <span title="Vinculado ao catálogo"><BookOpen className="h-3 w-3 text-primary flex-shrink-0" /></span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {Number(item.price).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMutation.mutate(item.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InsurancePlanExamsDialog;
