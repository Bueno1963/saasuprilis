import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Search, Filter } from "lucide-react";
import IntegrationDetailPage from "./IntegrationDetailPage";

interface Props {
  onBack: () => void;
}

const IntegrationsListPage = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const [detailId, setDetailId] = useState<string | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterProtocol, setFilterProtocol] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("integrations").select("*").order("name");
      if (error) throw error;
      return data;
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

  // Show detail page (new or edit)
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
    <div className="p-6 space-y-6 max-w-[80%] bg-foreground/10 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Integrações Cadastradas</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} integraç{items.length !== 1 ? "ões" : "ão"} · Gerencie conexões com sistemas externos
            </p>
          </div>
        </div>
        <Button onClick={() => setDetailId(null)}>
          <Plus className="h-4 w-4 mr-2" />Nova Integração
        </Button>
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
                <TableHead>Nome</TableHead>
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
    </div>
  );
};

export default IntegrationsListPage;
