import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Archive, Trash2, MapPin, Thermometer, Clock, Plus, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

interface StoredSample {
  id: string;
  barcode: string;
  patientName: string;
  material: string;
  collectedAt: string;
  storedAt: string;
  expiresAt: string;
  gallery: string;
  rack: string;
  position: string;
  temperature: string;
  status: "armazenado" | "em_uso" | "expurgado";
  notes?: string;
}

const MOCK_SAMPLES: StoredSample[] = [
  { id: "1", barcode: "SOR-20260301-001", patientName: "Maria Silva", material: "Soro", collectedAt: "2026-03-01", storedAt: "2026-03-01", expiresAt: "2026-03-08", gallery: "G1", rack: "R01", position: "A3", temperature: "2-8°C", status: "armazenado" },
  { id: "2", barcode: "SOR-20260302-002", patientName: "João Santos", material: "Plasma", collectedAt: "2026-03-02", storedAt: "2026-03-02", expiresAt: "2026-03-09", gallery: "G1", rack: "R02", position: "B1", temperature: "2-8°C", status: "armazenado" },
  { id: "3", barcode: "SOR-20260228-003", patientName: "Ana Oliveira", material: "Urina", collectedAt: "2026-02-28", storedAt: "2026-02-28", expiresAt: "2026-03-03", gallery: "G2", rack: "R01", position: "C5", temperature: "2-8°C", status: "expurgado" },
  { id: "4", barcode: "SOR-20260303-004", patientName: "Carlos Pereira", material: "Soro", collectedAt: "2026-03-03", storedAt: "2026-03-03", expiresAt: "2026-03-10", gallery: "G1", rack: "R01", position: "A4", temperature: "-20°C", status: "em_uso" },
  { id: "5", barcode: "SOR-20260304-005", patientName: "Fernanda Lima", material: "Sangue Total", collectedAt: "2026-03-04", storedAt: "2026-03-04", expiresAt: "2026-03-11", gallery: "G2", rack: "R03", position: "D2", temperature: "2-8°C", status: "armazenado" },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  armazenado: { label: "Armazenado", variant: "default" },
  em_uso: { label: "Em Uso", variant: "secondary" },
  expurgado: { label: "Expurgado", variant: "destructive" },
};

const SorotecaPage = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGallery, setFilterGallery] = useState("all");
  const [samples, setSamples] = useState<StoredSample[]>(MOCK_SAMPLES);
  const [expurgoDialog, setExpurgoDialog] = useState(false);
  const [selectedForExpurgo, setSelectedForExpurgo] = useState<string[]>([]);
  const [editDialog, setEditDialog] = useState(false);
  const [editingSample, setEditingSample] = useState<StoredSample | null>(null);
  const [editGallery, setEditGallery] = useState("");
  const [editRack, setEditRack] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editTemperature, setEditTemperature] = useState("");

  const openEdit = (sample: StoredSample) => {
    setEditingSample(sample);
    setEditGallery(sample.gallery);
    setEditRack(sample.rack);
    setEditPosition(sample.position);
    setEditTemperature(sample.temperature);
    setEditDialog(true);
  };

  const handleSaveLocation = () => {
    if (!editingSample) return;
    setSamples(prev => prev.map(s =>
      s.id === editingSample.id
        ? { ...s, gallery: editGallery, rack: editRack, position: editPosition, temperature: editTemperature }
        : s
    ));
    toast.success("Localização atualizada com sucesso");
    setEditDialog(false);
    setEditingSample(null);
  };

  const filtered = samples.filter(s => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterGallery !== "all" && s.gallery !== filterGallery) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.barcode.toLowerCase().includes(q) || s.patientName.toLowerCase().includes(q) || s.material.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: samples.filter(s => s.status === "armazenado").length,
    emUso: samples.filter(s => s.status === "em_uso").length,
    expurgados: samples.filter(s => s.status === "expurgado").length,
    vencendo: samples.filter(s => s.status === "armazenado" && new Date(s.expiresAt) <= addDays(new Date(), 2)).length,
  };

  const galleries = [...new Set(samples.map(s => s.gallery))];

  const handleExpurgo = () => {
    toast.success(`${selectedForExpurgo.length} amostra(s) marcada(s) para expurgo`);
    setExpurgoDialog(false);
    setSelectedForExpurgo([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Soroteca</h1>
          <p className="text-sm text-muted-foreground">Gestão de armazenamento, pesquisa e expurgo de amostras</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
          const expiring = samples.filter(s => s.status === "armazenado" && new Date(s.expiresAt) <= new Date());
          if (expiring.length === 0) {
            toast.info("Nenhuma amostra vencida para expurgo");
            return;
          }
          setSelectedForExpurgo(expiring.map(s => s.id));
          setExpurgoDialog(true);
        }}>
          <Trash2 className="h-4 w-4" />
          Expurgo Automático
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Archive className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground mt-1">Armazenadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <PackageOpen className="h-5 w-5 mx-auto mb-1 text-warning" />
            <p className="text-3xl font-bold text-warning">{stats.emUso}</p>
            <p className="text-sm text-muted-foreground mt-1">Em Uso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-critical" />
            <p className="text-3xl font-bold text-critical">{stats.vencendo}</p>
            <p className="text-sm text-muted-foreground mt-1">Próximas do Vencimento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Trash2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-3xl font-bold text-muted-foreground">{stats.expurgados}</p>
            <p className="text-sm text-muted-foreground mt-1">Expurgadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código, paciente ou material..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="armazenado">Armazenado</SelectItem>
            <SelectItem value="em_uso">Em Uso</SelectItem>
            <SelectItem value="expurgado">Expurgado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterGallery} onValueChange={setFilterGallery}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Galeria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {galleries.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Coleta</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1"><MapPin className="h-3.5 w-3.5" /> Localização</div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1"><Thermometer className="h-3.5 w-3.5" /> Temp.</div>
                </TableHead>
                <TableHead className="text-center">Validade</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma amostra encontrada</TableCell></TableRow>
              ) : (
                filtered.map(s => {
                  const isExpiring = s.status === "armazenado" && new Date(s.expiresAt) <= addDays(new Date(), 2);
                  return (
                    <TableRow key={s.id} className={isExpiring ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-xs">{s.barcode}</TableCell>
                      <TableCell className="font-medium">{s.patientName}</TableCell>
                      <TableCell>{s.material}</TableCell>
                      <TableCell className="text-xs">{format(new Date(s.collectedAt), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-center text-xs font-mono">{s.gallery} / {s.rack} / {s.position}</TableCell>
                      <TableCell className="text-center text-xs">{s.temperature}</TableCell>
                      <TableCell className={`text-center text-xs ${isExpiring ? "text-critical font-semibold" : ""}`}>
                        {format(new Date(s.expiresAt), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusMap[s.status]?.variant || "outline"}>
                          {statusMap[s.status]?.label || s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expurgo Dialog */}
      <Dialog open={expurgoDialog} onOpenChange={setExpurgoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Expurgo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {selectedForExpurgo.length} amostra(s) vencida(s) serão marcadas como expurgadas. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpurgoDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleExpurgo}>Confirmar Expurgo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SorotecaPage;
