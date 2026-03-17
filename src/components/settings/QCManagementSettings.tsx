import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, Trash2, Filter, Beaker, Globe, Info, Target, Crosshair } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
  embedded?: boolean;
  onNovoAnalitoProIn?: () => void;
  onNovoAnalitoNiveis?: () => void;
}

// Hook to get distinct sectors from exam_catalog
const useSectors = () => {
  const { data = [] } = useQuery({
    queryKey: ["qc_sectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_catalog").select("sector").not("sector", "is", null).order("sector");
      if (error) throw error;
      const unique = [...new Set(data.map(d => d.sector).filter(Boolean))] as string[];
      return unique;
    },
  });
  return data;
};

// Sector filter bar component
const SectorFilter = ({ value, onChange, sectors }: { value: string; onChange: (v: string) => void; sectors: string[] }) => (
  <div className="flex items-center gap-2">
    <Filter className="w-4 h-4 text-muted-foreground" />
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] h-8 text-sm">
        <SelectValue placeholder="Todos os setores" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">Todos os setores</SelectItem>
        {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

// ─── Analytes Tab ───
const AnalytesTab = ({ onNovoAnalito }: { onNovoAnalito?: () => void }) => {
  const qc = useQueryClient();
  const sectors = useSectors();
  const [sectorFilter, setSectorFilter] = useState("__all__");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ analyte_name: "", equipment: "", level: "N1", lot_number: "", target_mean: "", target_sd: "", unit: "", material: "", sector: "" });

  const { data: items = [] } = useQuery({
    queryKey: ["qc_analyte_configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("qc_analyte_configs").select("*").order("sector").order("analyte_name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (sectorFilter === "__all__") return items;
    return items.filter((i: any) => i.sector === sectorFilter);
  }, [items, sectorFilter]);

  // Group by sector
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of filtered) {
      const s = (item as any).sector || "Sem setor";
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(item);
    }
    return map;
  }, [filtered]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, target_mean: Number(form.target_mean), target_sd: Number(form.target_sd) };
      if (editing) {
        const { error } = await supabase.from("qc_analyte_configs").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("qc_analyte_configs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["qc_analyte_configs"] }); setOpen(false); toast.success("Analito salvo"); },
    onError: () => toast.error("Erro ao salvar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("qc_analyte_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["qc_analyte_configs"] }); toast.success("Removido"); },
  });

  const openNew = () => { setEditing(null); setForm({ analyte_name: "", equipment: "", level: "N1", lot_number: "", target_mean: "", target_sd: "", unit: "", material: "", sector: sectorFilter !== "__all__" ? sectorFilter : "" }); setOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ analyte_name: item.analyte_name, equipment: item.equipment, level: item.level, lot_number: item.lot_number, target_mean: String(item.target_mean), target_sd: String(item.target_sd), unit: item.unit, material: item.material, sector: item.sector || "" }); setOpen(true); };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectorFilter value={sectorFilter} onChange={setSectorFilter} sectors={sectors} />
        <Button size="sm" onClick={onNovoAnalito || openNew}><Plus className="w-4 h-4 mr-1" /> Lançar Parâmetros Controle Qualidade</Button>
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum analito cadastrado{sectorFilter !== "__all__" ? " neste setor" : ""}</p>}

      {[...grouped.entries()].map(([sector, sectorItems]) => (
        <div key={sector} className="mb-6 border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border-b border-border">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide">{sector}</h3>
            <span className="text-xs text-muted-foreground ml-auto">({sectorItems.length} analito{sectorItems.length !== 1 ? "s" : ""})</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analito</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Média Alvo</TableHead>
                <TableHead>DP Alvo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectorItems.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.analyte_name}</TableCell>
                  <TableCell>{item.equipment || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{item.level}</Badge></TableCell>
                  <TableCell>{item.lot_number || "—"}</TableCell>
                  <TableCell>{item.target_mean}</TableCell>
                  <TableCell>{item.target_sd}</TableCell>
                  <TableCell>{item.unit || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Analito" : "Novo Analito"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Analito *</Label><Input value={form.analyte_name} onChange={e => setForm(f => ({ ...f, analyte_name: e.target.value }))} /></div>
            <div><Label>Setor *</Label>
              <Select value={form.sector} onValueChange={v => setForm(f => ({ ...f, sector: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                <SelectContent>{sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Equipamento</Label><Input value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} /></div>
            <div><Label>Nível</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="N1">N1</SelectItem><SelectItem value="N2">N2</SelectItem><SelectItem value="N3">N3</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Nº Lote</Label><Input value={form.lot_number} onChange={e => setForm(f => ({ ...f, lot_number: e.target.value }))} /></div>
            <div><Label>Material</Label><Input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} /></div>
            <div><Label>Média Alvo *</Label><Input type="number" value={form.target_mean} onChange={e => setForm(f => ({ ...f, target_mean: e.target.value }))} /></div>
            <div><Label>DP Alvo *</Label><Input type="number" value={form.target_sd} onChange={e => setForm(f => ({ ...f, target_sd: e.target.value }))} /></div>
            <div><Label>Unidade</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={() => save.mutate()} disabled={!form.analyte_name || !form.sector || save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── Westgard Rules Tab ───
const defaultRules = [
  { rule_code: "1-2s", rule_name: "1-2s (Alerta)", description: "Um resultado excede ±2DP da média. Regra de alerta, não rejeição.", rule_type: "warning" },
  { rule_code: "1-3s", rule_name: "1-3s (Rejeição)", description: "Um resultado excede ±3DP da média. Erro aleatório.", rule_type: "rejection" },
  { rule_code: "2-2s", rule_name: "2-2s (Rejeição)", description: "Dois resultados consecutivos excedem ±2DP na mesma direção. Erro sistemático.", rule_type: "rejection" },
  { rule_code: "R-4s", rule_name: "R-4s (Rejeição)", description: "Diferença de 4DP entre dois controles dentro da mesma corrida. Erro aleatório.", rule_type: "rejection" },
  { rule_code: "4-1s", rule_name: "4-1s (Rejeição)", description: "Quatro resultados consecutivos excedem ±1DP na mesma direção. Erro sistemático.", rule_type: "rejection" },
  { rule_code: "10x", rule_name: "10x (Rejeição)", description: "Dez resultados consecutivos no mesmo lado da média. Erro sistemático.", rule_type: "rejection" },
];

const WestgardTab = () => {
  const qc = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ["qc_westgard_rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("qc_westgard_rules").select("*").order("rule_code");
      if (error) throw error;
      return data;
    },
  });

  const seedRules = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("qc_westgard_rules").insert(defaultRules.map(r => ({ ...r, enabled: true })));
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["qc_westgard_rules"] }); toast.success("Regras padrão criadas"); },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("qc_westgard_rules").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["qc_westgard_rules"] }),
  });

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Regras de Westgard aplicáveis ao controle interno da qualidade.</p>
        {rules.length === 0 && <Button size="sm" onClick={() => seedRules.mutate()}><Plus className="w-4 h-4 mr-1" /> Carregar Regras Padrão</Button>}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="w-24">Ativo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma regra cadastrada. Clique em "Carregar Regras Padrão".</TableCell></TableRow>}
          {rules.map((r: any) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono font-medium">{r.rule_code}</TableCell>
              <TableCell>{r.rule_name}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs">{r.description}</TableCell>
              <TableCell><Badge variant={r.rule_type === "rejection" ? "destructive" : "secondary"}>{r.rule_type === "rejection" ? "Rejeição" : "Alerta"}</Badge></TableCell>
              <TableCell><Switch checked={r.enabled} onCheckedChange={v => toggle.mutate({ id: r.id, enabled: v })} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

// ─── Control Lots Tab ───
const LotsTab = () => {
  const qc = useQueryClient();
  const sectors = useSectors();
  const [sectorFilter, setSectorFilter] = useState("__all__");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ lot_number: "", manufacturer: "", analyte_name: "", level: "N1", expected_mean: "", expected_sd: "", unit: "", expiry_date: "", notes: "", sector: "" });

  const { data: lots = [] } = useQuery({
    queryKey: ["qc_control_lots"],
    queryFn: async () => {
      const { data, error } = await supabase.from("qc_control_lots").select("*").order("sector").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (sectorFilter === "__all__") return lots;
    return lots.filter((l: any) => l.sector === sectorFilter);
  }, [lots, sectorFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const lot of filtered) {
      const s = (lot as any).sector || "Sem setor";
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(lot);
    }
    return map;
  }, [filtered]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, expected_mean: Number(form.expected_mean), expected_sd: Number(form.expected_sd), expiry_date: form.expiry_date || null };
      if (editing) {
        const { error } = await supabase.from("qc_control_lots").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("qc_control_lots").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["qc_control_lots"] }); setOpen(false); toast.success("Lote salvo"); },
    onError: () => toast.error("Erro ao salvar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("qc_control_lots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["qc_control_lots"] }); toast.success("Removido"); },
  });

  const openNew = () => { setEditing(null); setForm({ lot_number: "", manufacturer: "", analyte_name: "", level: "N1", expected_mean: "", expected_sd: "", unit: "", expiry_date: "", notes: "", sector: sectorFilter !== "__all__" ? sectorFilter : "" }); setOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ lot_number: item.lot_number, manufacturer: item.manufacturer, analyte_name: item.analyte_name, level: item.level, expected_mean: String(item.expected_mean), expected_sd: String(item.expected_sd), unit: item.unit, expiry_date: item.expiry_date || "", notes: item.notes || "", sector: item.sector || "" }); setOpen(true); };

  const statusLabel: Record<string, string> = { vigente: "Vigente", vencido: "Vencido", aberto: "Aberto" };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectorFilter value={sectorFilter} onChange={setSectorFilter} sectors={sectors} />
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo Lote</Button>
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum lote cadastrado{sectorFilter !== "__all__" ? " neste setor" : ""}</p>}

      {[...grouped.entries()].map(([sector, sectorLots]) => (
        <div key={sector} className="mb-6 border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border-b border-border">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide">{sector}</h3>
            <span className="text-xs text-muted-foreground ml-auto">({sectorLots.length} lote{sectorLots.length !== 1 ? "s" : ""})</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Lote</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Analito</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Média</TableHead>
                <TableHead>DP</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectorLots.map((lot: any) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-medium">{lot.lot_number}</TableCell>
                  <TableCell>{lot.manufacturer || "—"}</TableCell>
                  <TableCell>{lot.analyte_name || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{lot.level}</Badge></TableCell>
                  <TableCell>{lot.expected_mean}</TableCell>
                  <TableCell>{lot.expected_sd}</TableCell>
                  <TableCell>{lot.expiry_date ? new Date(lot.expiry_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell><Badge variant={lot.status === "vencido" ? "destructive" : "secondary"}>{statusLabel[lot.status] || lot.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lot)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(lot.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Lote" : "Novo Lote"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nº Lote *</Label><Input value={form.lot_number} onChange={e => setForm(f => ({ ...f, lot_number: e.target.value }))} /></div>
            <div><Label>Setor *</Label>
              <Select value={form.sector} onValueChange={v => setForm(f => ({ ...f, sector: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                <SelectContent>{sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fabricante</Label><Input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} /></div>
            <div><Label>Analito</Label><Input value={form.analyte_name} onChange={e => setForm(f => ({ ...f, analyte_name: e.target.value }))} /></div>
            <div><Label>Nível</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="N1">N1</SelectItem><SelectItem value="N2">N2</SelectItem><SelectItem value="N3">N3</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Média Esperada *</Label><Input type="number" value={form.expected_mean} onChange={e => setForm(f => ({ ...f, expected_mean: e.target.value }))} /></div>
            <div><Label>DP Esperado *</Label><Input type="number" value={form.expected_sd} onChange={e => setForm(f => ({ ...f, expected_sd: e.target.value }))} /></div>
            <div><Label>Unidade</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
            <div><Label>Validade</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={() => save.mutate()} disabled={!form.lot_number || !form.sector || save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── PRO-IN Tab (Controle Interno) ───
const ProINTab = ({ onNovoAnalito }: { onNovoAnalito?: () => void }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ analyte_name: "", equipment: "", level: "N1", lot_number: "", target_mean: "", target_sd: "", unit: "", material: "Soro humano liofilizado", sector: "Bioquímica" });

  const { data: items = [] } = useQuery({
    queryKey: ["qc_analyte_configs", "pro-in"],
    queryFn: async () => {
      const { data, error } = await supabase.from("qc_analyte_configs").select("*").eq("sector", "Bioquímica").order("analyte_name");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, target_mean: Number(form.target_mean), target_sd: Number(form.target_sd) };
      if (editing) {
        const { error } = await supabase.from("qc_analyte_configs").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("qc_analyte_configs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["qc_analyte_configs"] }); setOpen(false); toast.success("Analito salvo"); },
    onError: () => toast.error("Erro ao salvar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("qc_analyte_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["qc_analyte_configs"] }); toast.success("Removido"); },
  });

  const openNew = () => { setEditing(null); setForm({ analyte_name: "", equipment: "", level: "N1", lot_number: "", target_mean: "", target_sd: "", unit: "", material: "Soro humano liofilizado", sector: "Bioquímica" }); setOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ analyte_name: item.analyte_name, equipment: item.equipment, level: item.level, lot_number: item.lot_number, target_mean: String(item.target_mean), target_sd: String(item.target_sd), unit: item.unit, material: item.material, sector: item.sector || "Bioquímica" }); setOpen(true); };

  return (
    <>
      {/* Info card */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 p-4">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-2 text-sm">
            <h4 className="font-bold text-blue-800 dark:text-blue-300">Controle Interno da Qualidade (PRO-IN) — PNCQ</h4>
            <p className="text-blue-700 dark:text-blue-400">Ferramenta contínua que utiliza <strong>soro humano liofilizado</strong> (bioquímica) para monitorar a rotina laboratorial.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <div className="bg-white/70 dark:bg-blue-900/30 rounded-md p-2.5 border border-blue-100 dark:border-blue-800">
                <p className="font-semibold text-blue-800 dark:text-blue-300 text-xs uppercase tracking-wide">Finalidade</p>
                <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">Detectar erros analíticos rapidamente (variações aleatórias ou sistemáticas) antes da emissão de laudos.</p>
              </div>
              <div className="bg-white/70 dark:bg-blue-900/30 rounded-md p-2.5 border border-blue-100 dark:border-blue-800">
                <p className="font-semibold text-blue-800 dark:text-blue-300 text-xs uppercase tracking-wide">Diferencial</p>
                <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">O PNCQ oferece o "PRO-IN em Tempo Real", usando seus próprios valores para estabelecer a "impressão digital" (média e DP) da metodologia.</p>
              </div>
              <div className="bg-white/70 dark:bg-blue-900/30 rounded-md p-2.5 border border-blue-100 dark:border-blue-800">
                <p className="font-semibold text-blue-800 dark:text-blue-300 text-xs uppercase tracking-wide">Foco</p>
                <p className="text-blue-700 dark:text-blue-400 text-xs mt-1"><strong>Precisão</strong> (reprodutibilidade) — Monitora a consistência dos resultados ao longo do tempo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector header */}
      <div className="mb-4 border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-primary/10 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Bioquímica — PRO-IN</h3>
            <span className="text-xs text-muted-foreground">({items.length} analito{items.length !== 1 ? "s" : ""})</span>
          </div>
           <Button size="sm" onClick={onNovoAnalito || openNew}><Plus className="w-4 h-4 mr-1" /> Lançar Parâmetros Pro IN</Button>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum analito cadastrado para Bioquímica</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analito</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Média Alvo</TableHead>
                <TableHead>DP Alvo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.analyte_name}</TableCell>
                  <TableCell>{item.equipment || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{item.level}</Badge></TableCell>
                  <TableCell>{item.lot_number || "—"}</TableCell>
                  <TableCell>{item.target_mean}</TableCell>
                  <TableCell>{item.target_sd}</TableCell>
                  <TableCell>{item.unit || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Analito PRO-IN" : "Novo Analito PRO-IN"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Analito *</Label><Input value={form.analyte_name} onChange={e => setForm(f => ({ ...f, analyte_name: e.target.value }))} /></div>
            <div><Label>Equipamento</Label><Input value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} /></div>
            <div><Label>Nível</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="N1">N1</SelectItem><SelectItem value="N2">N2</SelectItem><SelectItem value="N3">N3</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Nº Lote</Label><Input value={form.lot_number} onChange={e => setForm(f => ({ ...f, lot_number: e.target.value }))} /></div>
            <div><Label>Material</Label><Input value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} /></div>
            <div><Label>Média Alvo *</Label><Input type="number" value={form.target_mean} onChange={e => setForm(f => ({ ...f, target_mean: e.target.value }))} /></div>
            <div><Label>DP Alvo *</Label><Input type="number" value={form.target_sd} onChange={e => setForm(f => ({ ...f, target_sd: e.target.value }))} /></div>
            <div><Label>Unidade</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={() => save.mutate()} disabled={!form.analyte_name || save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── PRO-EX Tab (Controle Externo) ───
const ProEXTab = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ lot_number: "", manufacturer: "PNCQ", analyte_name: "", level: "N1", expected_mean: "", expected_sd: "", unit: "", expiry_date: "", notes: "", sector: "Bioquímica" });

  const { data: lots = [] } = useQuery({
    queryKey: ["qc_control_lots", "pro-ex"],
    queryFn: async () => {
      const { data, error } = await supabase.from("qc_control_lots").select("*").eq("sector", "Bioquímica").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, expected_mean: Number(form.expected_mean), expected_sd: Number(form.expected_sd), expiry_date: form.expiry_date || null };
      if (editing) {
        const { error } = await supabase.from("qc_control_lots").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("qc_control_lots").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["qc_control_lots"] }); setOpen(false); toast.success("Amostra salva"); },
    onError: () => toast.error("Erro ao salvar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("qc_control_lots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["qc_control_lots"] }); toast.success("Removido"); },
  });

  const openNew = () => { setEditing(null); setForm({ lot_number: "", manufacturer: "PNCQ", analyte_name: "", level: "N1", expected_mean: "", expected_sd: "", unit: "", expiry_date: "", notes: "", sector: "Bioquímica" }); setOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ lot_number: item.lot_number, manufacturer: item.manufacturer, analyte_name: item.analyte_name, level: item.level, expected_mean: String(item.expected_mean), expected_sd: String(item.expected_sd), unit: item.unit, expiry_date: item.expiry_date || "", notes: item.notes || "", sector: item.sector || "Bioquímica" }); setOpen(true); };

  const statusLabel: Record<string, string> = { vigente: "Vigente", vencido: "Vencido", aberto: "Aberto" };

  return (
    <>
      {/* Info card */}
      <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 p-4">
        <div className="flex items-start gap-3">
          <Crosshair className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="space-y-2 text-sm">
            <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Controle Externo da Qualidade (PRO-EX) — PNCQ</h4>
            <p className="text-emerald-700 dark:text-emerald-400">Ensaio de Proficiência — amostras desconhecidas enviadas mensalmente, analisadas e avaliadas pelo PNCQ.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <div className="bg-white/70 dark:bg-emerald-900/30 rounded-md p-2.5 border border-emerald-100 dark:border-emerald-800">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wide">Funcionamento</p>
                <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-1">Amostras desconhecidas são enviadas mensalmente, analisadas e os resultados enviados ao PNCQ para avaliação.</p>
              </div>
              <div className="bg-white/70 dark:bg-emerald-900/30 rounded-md p-2.5 border border-emerald-100 dark:border-emerald-800">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wide">Importância</p>
                <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-1">Obrigatório pela ANVISA para avaliar a exatidão dos resultados, permitindo a comparação com outros laboratórios.</p>
              </div>
              <div className="bg-white/70 dark:bg-emerald-900/30 rounded-md p-2.5 border border-emerald-100 dark:border-emerald-800">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wide">Foco</p>
                <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-1"><strong>Exatidão</strong> (concordância com o valor verdadeiro) — Compara resultados entre laboratórios.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector header */}
      <div className="mb-4 border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-primary/10 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Bioquímica — PRO-EX</h3>
            <span className="text-xs text-muted-foreground">({lots.length} amostra{lots.length !== 1 ? "s" : ""})</span>
          </div>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Nova Amostra</Button>
        </div>

        {lots.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma amostra de proficiência cadastrada</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Lote</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Analito</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Média</TableHead>
                <TableHead>DP</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map((lot: any) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-medium">{lot.lot_number}</TableCell>
                  <TableCell>{lot.manufacturer || "—"}</TableCell>
                  <TableCell>{lot.analyte_name || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{lot.level}</Badge></TableCell>
                  <TableCell>{lot.expected_mean}</TableCell>
                  <TableCell>{lot.expected_sd}</TableCell>
                  <TableCell>{lot.expiry_date ? new Date(lot.expiry_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell><Badge variant={lot.status === "vencido" ? "destructive" : "secondary"}>{statusLabel[lot.status] || lot.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lot)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(lot.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Amostra PRO-EX" : "Nova Amostra PRO-EX"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nº Lote *</Label><Input value={form.lot_number} onChange={e => setForm(f => ({ ...f, lot_number: e.target.value }))} /></div>
            <div><Label>Provedor</Label><Input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} /></div>
            <div><Label>Analito</Label><Input value={form.analyte_name} onChange={e => setForm(f => ({ ...f, analyte_name: e.target.value }))} /></div>
            <div><Label>Nível</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="N1">N1</SelectItem><SelectItem value="N2">N2</SelectItem><SelectItem value="N3">N3</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Média Esperada *</Label><Input type="number" value={form.expected_mean} onChange={e => setForm(f => ({ ...f, expected_mean: e.target.value }))} /></div>
            <div><Label>DP Esperado *</Label><Input type="number" value={form.expected_sd} onChange={e => setForm(f => ({ ...f, expected_sd: e.target.value }))} /></div>
            <div><Label>Unidade</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
            <div><Label>Validade</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
            <div className="col-span-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={() => save.mutate()} disabled={!form.lot_number || save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── Main ───
const QCManagementSettings = ({ onBack, embedded, onNovoAnalitoProIn, onNovoAnalitoNiveis }: Props) => {
  return (
    <div className={embedded ? "space-y-4" : "p-6 space-y-4"}>
      {!embedded && (
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
      )}
      <div>
        <h2 className="text-xl font-bold text-foreground">Gestão Controle de Qualidade</h2>
        <p className="text-sm text-muted-foreground">Configuração de analitos, regras de Westgard, lotes de controle, PRO-IN e PRO-EX — organizados por setor</p>
      </div>
      <Tabs defaultValue="pro-in">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pro-in" className="gap-1.5"><Target className="w-3.5 h-3.5" />PRO-IN</TabsTrigger>
          <TabsTrigger value="pro-ex" className="gap-1.5"><Crosshair className="w-3.5 h-3.5" />PRO-EX</TabsTrigger>
          <TabsTrigger value="analytes">Analitos / Níveis</TabsTrigger>
          <TabsTrigger value="westgard">Regras Westgard</TabsTrigger>
          <TabsTrigger value="lots">Lotes de Controle</TabsTrigger>
        </TabsList>
        <TabsContent value="pro-in"><Card><CardContent className="pt-6"><ProINTab onNovoAnalito={onNovoAnalitoProIn} /></CardContent></Card></TabsContent>
        <TabsContent value="pro-ex"><Card><CardContent className="pt-6"><ProEXTab /></CardContent></Card></TabsContent>
        <TabsContent value="analytes"><Card><CardContent className="pt-6"><AnalytesTab onNovoAnalito={onNovoAnalitoNiveis} /></CardContent></Card></TabsContent>
        <TabsContent value="westgard"><Card><CardContent className="pt-6"><WestgardTab /></CardContent></Card></TabsContent>
        <TabsContent value="lots"><Card><CardContent className="pt-6"><LotsTab /></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
};

export default QCManagementSettings;
