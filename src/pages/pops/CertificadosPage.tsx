import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Award, Plus, Search, Filter, Eye, Edit2, Trash2, Upload, Download, Calendar, AlertTriangle, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "calibracao", label: "Calibração" },
  { value: "treinamento", label: "Treinamento" },
  { value: "acreditacao", label: "Acreditação" },
  { value: "alvara", label: "Alvará / Licença" },
  { value: "manutencao", label: "Manutenção" },
  { value: "fornecedor", label: "Fornecedor / Reagente" },
  { value: "outro", label: "Outro" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  vigente: { label: "Vigente", variant: "default" },
  vencido: { label: "Vencido", variant: "destructive" },
  proximo_vencimento: { label: "Próx. Vencimento", variant: "secondary" },
  arquivado: { label: "Arquivado", variant: "outline" },
};

const INITIAL_FORM = {
  title: "",
  category: "calibracao",
  issuer: "",
  certificate_number: "",
  issue_date: "",
  expiry_date: "",
  related_equipment: "",
  related_employee: "",
  notes: "",
  status: "vigente",
};

const CertificadosPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const getComputedStatus = (cert: any) => {
    if (!cert.expiry_date) return cert.status;
    const today = new Date();
    const expiry = new Date(cert.expiry_date);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return "vencido";
    if (daysUntilExpiry <= 30) return "proximo_vencimento";
    return cert.status;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let fileUrl = editing?.file_url || "";
      let fileName = editing?.file_name || "";

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("certificates").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("certificates").getPublicUrl(path);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }

      const payload = {
        ...form,
        file_url: fileUrl,
        file_name: fileName,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        created_by: user?.id || null,
      };

      if (editing) {
        const { error } = await supabase.from("certificates").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("certificates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: editing ? "Certificado atualizado" : "Certificado cadastrado" });
      closeForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certificates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({ title: "Certificado excluído" });
    },
  });

  const openForm = (cert?: any) => {
    if (cert) {
      setEditing(cert);
      setForm({
        title: cert.title || "",
        category: cert.category || "calibracao",
        issuer: cert.issuer || "",
        certificate_number: cert.certificate_number || "",
        issue_date: cert.issue_date || "",
        expiry_date: cert.expiry_date || "",
        related_equipment: cert.related_equipment || "",
        related_employee: cert.related_employee || "",
        notes: cert.notes || "",
        status: cert.status || "vigente",
      });
    } else {
      setEditing(null);
      setForm(INITIAL_FORM);
    }
    setFile(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setFile(null);
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const filtered = certificates.filter((cert: any) => {
    const matchSearch = !search || cert.title.toLowerCase().includes(search.toLowerCase()) || (cert.certificate_number || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || cert.category === categoryFilter;
    const computedStatus = getComputedStatus(cert);
    const matchStatus = statusFilter === "all" || computedStatus === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const stats = {
    total: certificates.length,
    vigente: certificates.filter((c: any) => getComputedStatus(c) === "vigente").length,
    vencido: certificates.filter((c: any) => getComputedStatus(c) === "vencido").length,
    proximo: certificates.filter((c: any) => getComputedStatus(c) === "proximo_vencimento").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Arquivo de Certificados
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de certificados de calibração, treinamento, acreditação e licenças
          </p>
        </div>
        <Button className="gap-2" onClick={() => openForm()}>
          <Plus className="h-4 w-4" />
          Novo Certificado
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Award className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{stats.vigente}</p><p className="text-xs text-muted-foreground">Vigentes</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div><p className="text-2xl font-bold">{stats.proximo}</p><p className="text-xs text-muted-foreground">Próx. Vencimento</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-2xl font-bold">{stats.vencido}</p><p className="text-xs text-muted-foreground">Vencidos</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar certificado..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="vigente">Vigente</SelectItem>
            <SelectItem value="proximo_vencimento">Próx. Vencimento</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificado</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Emissor</TableHead>
                <TableHead>Nº Certificado</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum certificado encontrado</TableCell></TableRow>
              ) : (
                filtered.map((cert: any) => {
                  const computedStatus = getComputedStatus(cert);
                  const statusCfg = STATUS_CONFIG[computedStatus] || STATUS_CONFIG.vigente;
                  const catLabel = CATEGORIES.find((c) => c.value === cert.category)?.label || cert.category;

                  return (
                    <TableRow key={cert.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{cert.title}</p>
                          {cert.related_equipment && <p className="text-xs text-muted-foreground">Equip.: {cert.related_equipment}</p>}
                          {cert.related_employee && <p className="text-xs text-muted-foreground">Colab.: {cert.related_employee}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{catLabel}</Badge></TableCell>
                      <TableCell className="text-sm">{cert.issuer || "—"}</TableCell>
                      <TableCell className="text-sm font-mono">{cert.certificate_number || "—"}</TableCell>
                      <TableCell className="text-sm">{cert.issue_date ? new Date(cert.issue_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-sm">{cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell><Badge variant={statusCfg.variant}>{statusCfg.label}</Badge></TableCell>
                      <TableCell>
                        {cert.file_url ? (
                          <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" /> {cert.file_name || "Abrir"}
                          </a>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(cert)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(cert.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Certificado" : "Novo Certificado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input placeholder="Ex: Certificado de Calibração — Espectrofotômetro" value={form.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => update("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nº do Certificado</Label>
                <Input placeholder="Ex: CAL-2025-0042" value={form.certificate_number} onChange={(e) => update("certificate_number", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Emissor / Entidade</Label>
              <Input placeholder="Ex: INMETRO, Empresa X" value={form.issuer} onChange={(e) => update("issuer", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Emissão</Label>
                <Input type="date" value={form.issue_date} onChange={(e) => update("issue_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data de Validade</Label>
                <Input type="date" value={form.expiry_date} onChange={(e) => update("expiry_date", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Equipamento Relacionado</Label>
                <Input placeholder="Ex: Espectrofotômetro UV-Vis" value={form.related_equipment} onChange={(e) => update("related_equipment", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Colaborador Relacionado</Label>
                <Input placeholder="Ex: Maria Silva" value={form.related_employee} onChange={(e) => update("related_employee", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Arquivo (PDF, imagem)</Label>
              <div className="flex items-center gap-3">
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {editing?.file_url && !file && (
                  <a href={editing.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline whitespace-nowrap">
                    Arquivo atual
                  </a>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Informações adicionais..." rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button className="gap-2" onClick={() => saveMutation.mutate()} disabled={!form.title || uploading || saveMutation.isPending}>
              <Upload className="h-4 w-4" />
              {uploading ? "Enviando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificadosPage;
