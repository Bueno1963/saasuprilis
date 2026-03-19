import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, LayoutGrid, List, Monitor, Link2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";

interface Props { onBack: () => void; }

interface ExamForm {
  code: string; name: string; material: string; sector: string; method: string;
  unit: string; reference_range: string; turnaround_hours: number; price: number; status: string; equipment: string;
}

const defaultValues: ExamForm = { code: "", name: "", material: "Sangue", sector: "Bioquímica", method: "", unit: "", reference_range: "", turnaround_hours: 24, price: 0, status: "active", equipment: "" };

const DEFAULT_SECTORS = ["Bioquímica", "Hematologia", "Imunologia", "Microbiologia", "Parasitologia", "Uroanálise"];
const DEFAULT_MATERIALS = ["Sangue", "Soro", "Plasma", "Urina", "Fezes", "Líquor", "Escarro", "Swab", "Tecido"];

const SectorSelect = ({ value, onChange, sectors }: { value: string; onChange: (v: string) => void; sectors: string[] }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
      </SelectContent>
    </Select>
  );
};

const ExamCatalogSettings = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "sector" | "equipment">("sector");
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [activeEquipment, setActiveEquipment] = useState<string | null>(null);
  const [newSectorOpen, setNewSectorOpen] = useState(false);
  const [newSectorName, setNewSectorName] = useState("");
  const [newMaterialOpen, setNewMaterialOpen] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [customMaterials, setCustomMaterials] = useState<string[]>([]);
  const [customSectors, setCustomSectors] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEquipOpen, setBulkEquipOpen] = useState(false);
  const [bulkEquipValue, setBulkEquipValue] = useState("");
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

  const allSectors = useMemo(() => {
    const set = new Set(DEFAULT_SECTORS);
    customSectors.forEach((s) => set.add(s));
    items.forEach((i) => { if (i.sector) set.add(i.sector); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items, customSectors]);

  const allMaterials = useMemo(() => {
    const set = new Set(DEFAULT_MATERIALS);
    customMaterials.forEach((m) => set.add(m));
    items.forEach((i) => { if (i.material) set.add(i.material); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items, customMaterials]);

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()));

  const groupedBySector = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((item) => {
      const sector = item.sector || "Sem setor";
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const sector = item.sector || "Sem setor";
      counts[sector] = (counts[sector] || 0) + 1;
    });
    return counts;
  }, [items]);

  const displayedItems = activeSector
    ? filtered.filter((i) => (i.sector || "Sem setor") === activeSector)
    : filtered;

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

  const renderExamRow = (item: any) => (
    <TableRow key={item.id}>
      <TableCell className="font-mono">{item.code}</TableCell>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>{item.material}</TableCell>
      {viewMode === "list" && <TableCell>{item.sector}</TableCell>}
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
  );

  const tableHeaders = (
    <TableRow>
      <TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Material</TableHead>
      {viewMode === "list" && <TableHead>Setor</TableHead>}
      <TableHead>Equipamento</TableHead><TableHead>Unidade</TableHead><TableHead>Ref.</TableHead>
      <TableHead>Preço</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead>
    </TableRow>
  );

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
        <div className="flex items-center gap-2">
          {newSectorOpen ? (
            <div className="flex items-center gap-2">
              <Input placeholder="Nome do setor" value={newSectorName} onChange={(e) => setNewSectorName(e.target.value)} className="w-44" autoFocus />
              <Button size="sm" onClick={() => {
                const trimmed = newSectorName.trim();
                if (trimmed && !allSectors.includes(trimmed)) {
                  setCustomSectors((prev) => [...prev, trimmed]);
                  toast.success(`Setor "${trimmed}" cadastrado!`);
                } else if (allSectors.includes(trimmed)) {
                  toast.error("Setor já existe.");
                }
                setNewSectorOpen(false); setNewSectorName("");
              }}>OK</Button>
              <Button size="sm" variant="ghost" onClick={() => { setNewSectorOpen(false); setNewSectorName(""); }}>✕</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setNewSectorOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Setor</Button>
          )}
          {newMaterialOpen ? (
            <div className="flex items-center gap-2">
              <Input placeholder="Nome do material" value={newMaterialName} onChange={(e) => setNewMaterialName(e.target.value)} className="w-44" autoFocus />
              <Button size="sm" onClick={() => {
                const trimmed = newMaterialName.trim();
                if (trimmed && !allMaterials.includes(trimmed)) {
                  setCustomMaterials((prev) => [...prev, trimmed]);
                  toast.success(`Material "${trimmed}" cadastrado!`);
                } else if (allMaterials.includes(trimmed)) {
                  toast.error("Material já existe.");
                }
                setNewMaterialOpen(false); setNewMaterialName("");
              }}>OK</Button>
              <Button size="sm" variant="ghost" onClick={() => { setNewMaterialOpen(false); setNewMaterialName(""); }}>✕</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setNewMaterialOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Material</Button>
          )}
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Exame</Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Input placeholder="Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <div className="flex gap-1 ml-auto border rounded-lg p-1 bg-muted/40">
          <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => { setViewMode("list"); setActiveSector(null); }}>
            <List className="h-4 w-4 mr-1" />Lista
          </Button>
          <Button variant={viewMode === "sector" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("sector")}>
            <LayoutGrid className="h-4 w-4 mr-1" />Por Setor
          </Button>
        </div>
      </div>

      {viewMode === "sector" && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeSector === null ? "default" : "outline"}
            className="cursor-pointer text-sm px-3 py-1"
            onClick={() => setActiveSector(null)}
          >
            Todos ({items.length})
          </Badge>
          {Object.entries(sectorCounts).sort(([a], [b]) => a.localeCompare(b)).map(([sector, count]) => (
            <Badge
              key={sector}
              variant={activeSector === sector ? "default" : "outline"}
              className="cursor-pointer text-sm px-3 py-1"
              onClick={() => setActiveSector(activeSector === sector ? null : sector)}
            >
              {sector} ({count})
            </Badge>
          ))}
        </div>
      )}

      {viewMode === "list" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>{tableHeaders}</TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow> :
                filtered.length === 0 ? <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Nenhum exame cadastrado</TableCell></TableRow> :
                filtered.map(renderExamRow)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeSector ? (
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b bg-muted/30">
                  <h3 className="font-semibold text-foreground">{activeSector}</h3>
                  <p className="text-xs text-muted-foreground">{displayedItems.length} exame(s)</p>
                </div>
                <Table>
                  <TableHeader>{tableHeaders}</TableHeader>
                  <TableBody>
                    {displayedItems.length === 0
                      ? <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Nenhum exame encontrado</TableCell></TableRow>
                      : displayedItems.map(renderExamRow)}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            groupedBySector.map(([sector, exams]) => (
              <Card key={sector}>
                <CardContent className="p-0">
                  <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between cursor-pointer" onClick={() => setActiveSector(sector)}>
                    <div>
                      <h3 className="font-semibold text-foreground">{sector}</h3>
                      <p className="text-xs text-muted-foreground">{exams.length} exame(s)</p>
                    </div>
                    <Badge variant="secondary">{exams.length}</Badge>
                  </div>
                  <Table>
                    <TableHeader>{tableHeaders}</TableHeader>
                    <TableBody>{exams.map(renderExamRow)}</TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Exame</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Código</Label><Input {...register("code", { required: true })} /></div>
              <div className="space-y-1"><Label>Nome</Label><Input {...register("name", { required: true })} /></div>
              <div className="space-y-1">
                <Label>Material</Label>
                <Controller name="material" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {allMaterials.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1">
                <Label>Setor</Label>
                <Controller name="sector" control={control} render={({ field }) => (
                  <SectorSelect value={field.value} onChange={field.onChange} sectors={allSectors} />
                )} />
              </div>
              <div className="space-y-1"><Label>Método</Label><Input {...register("method")} /></div>
              <div className="space-y-1">
                <Label>Equipamento</Label>
                <Controller name="equipment" control={control} render={({ field }) => (
                  <Select value={field.value || "__none__"} onValueChange={v => field.onChange(v === "__none__" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
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
