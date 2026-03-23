import { useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Search, Filter, Database, Upload, FileText, Eye } from "lucide-react";
import IntegrationDetailPage from "./IntegrationDetailPage";

interface Props {
  onBack: () => void;
  docsSlot?: ReactNode;
}

const IntegrationsListPage = ({ onBack, docsSlot }: Props) => {
  const qc = useQueryClient();
  const [detailId, setDetailId] = useState<string | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterProtocol, setFilterProtocol] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Protocol bank state
  const [showBank, setShowBank] = useState(false);
  const [showBankAdd, setShowBankAdd] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("integrations").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: bankItems = [], isLoading: bankLoading } = useQuery({
    queryKey: ["protocol-bank"],
    queryFn: async () => {
      const { data, error } = await supabase.from("integration_protocol_bank" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("integrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integração removida!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeBank = useMutation({
    mutationFn: async (item: any) => {
      if (item.file_url) {
        const path = item.file_url.split("/protocol-bank/")[1];
        if (path) await supabase.storage.from("protocol-bank").remove([decodeURIComponent(path)]);
      }
      const { error } = await supabase.from("integration_protocol_bank" as any).delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol-bank"] });
      toast.success("Protocolo removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleBankUpload = async () => {
    if (!bankName.trim() || !bankFile) {
      toast.error("Preencha o nome e selecione um PDF");
      return;
    }
    setUploading(true);
    try {
      const ext = bankFile.name.split(".").pop();
      const filePath = `${Date.now()}-${bankName.replace(/\s+/g, "_")}.${ext}`;
      const { error: upErr } = await supabase.storage.from("protocol-bank").upload(filePath, bankFile);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("protocol-bank").getPublicUrl(filePath);
      const { error } = await supabase.from("integration_protocol_bank" as any).insert({
        name: bankName.trim(),
        file_name: bankFile.name,
        file_url: urlData.publicUrl,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["protocol-bank"] });
      toast.success("Protocolo adicionado ao banco!");
      setBankName("");
      setBankFile(null);
      setShowBankAdd(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  if (detailId !== undefined) {
    return <IntegrationDetailPage integrationId={detailId} onBack={() => setDetailId(undefined)} />;
  }

  const searchLower = search.toLowerCase();
  const filtered = items.filter(item =>
    (filterType === "all" || item.type === filterType) &&
    (filterProtocol === "all" || item.protocol === filterProtocol) &&
    (filterStatus === "all" || item.status === filterStatus) &&
    (search === "" ||
      item.name.toLowerCase().includes(searchLower) ||
      (item.endpoint_url || "").toLowerCase().includes(searchLower))
  );

  const uniqueTypes = [...new Set(items.map(i => i.type).filter(Boolean))];
  const uniqueProtocols = [...new Set(items.map(i => i.protocol).filter(Boolean))];
  const hasFilters = filterType !== "all" || filterProtocol !== "all" || filterStatus !== "all" || search !== "";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} integraç{items.length !== 1 ? "ões" : "ão"} · Gerencie conexões com sistemas externos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowBank(true)}>
            <Database className="h-4 w-4 mr-2" />Banco de Protocolos
          </Button>
          <Button onClick={() => setDetailId(null)}>
            <Plus className="h-4 w-4 mr-2" />Nova Integração
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou endpoint..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {uniqueTypes.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterProtocol} onValueChange={setFilterProtocol}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Protocolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Protocolos</SelectItem>
                  {uniqueProtocols.map(p => (
                    <SelectItem key={p} value={p!}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="text-xs h-9" onClick={() => { setSearch(""); setFilterType("all"); setFilterProtocol("all"); setFilterStatus("all"); }}>
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Protocolo</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {hasFilters ? "Nenhuma integração encontrada com os filtros aplicados" : "Nenhuma integração cadastrada"}
                </TableCell></TableRow>
              ) : filtered.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailId(item.id)}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{item.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{item.protocol}</Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-[220px] truncate font-mono text-muted-foreground">{item.endpoint_url || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "active" ? "default" : "secondary"}>
                      {item.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDetailId(item.id); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); remove.mutate(item.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      {filtered.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Exibindo <span className="font-semibold text-foreground">{filtered.length}</span> de {items.length} integraç{items.length !== 1 ? "ões" : "ão"}
          {" · "}<span className="text-emerald-500 font-medium">{items.filter(i => i.status === "active").length} ativa{items.filter(i => i.status === "active").length !== 1 ? "s" : ""}</span>
        </p>
      )}

      {/* Docs slot */}
      {docsSlot}

      {/* Protocol Bank Dialog */}
      <Dialog open={showBank} onOpenChange={setShowBank}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Banco de Protocolos de Integração
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">PDFs de protocolos de interfaceamento de equipamentos</p>
              <Button size="sm" onClick={() => setShowBankAdd(true)}>
                <Upload className="h-4 w-4 mr-2" />Importar PDF
              </Button>
            </div>
            {bankLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
            ) : bankItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum protocolo cadastrado</p>
                <p className="text-xs">Clique em "Importar PDF" para adicionar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankItems.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{b.file_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {b.file_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={b.file_url} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" /></a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => removeBank.mutate(b)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Protocol Dialog */}
      <Dialog open={showBankAdd} onOpenChange={setShowBankAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Protocolo PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome do Protocolo *</Label>
              <Input
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                placeholder="Ex: MaxBIO200B - Protocolo HL7"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Arquivo PDF *</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => setBankFile(e.target.files?.[0] || null)}
              />
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {bankFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{bankFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Clique para selecionar um PDF</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBankAdd(false)}>Cancelar</Button>
            <Button onClick={handleBankUpload} disabled={uploading}>
              {uploading ? "Enviando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationsListPage;
