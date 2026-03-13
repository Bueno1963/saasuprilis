import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Search, Filter, Eye, Edit2, Trash2, CheckCircle2, Clock, AlertTriangle, BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import POPFormDialog from "@/components/pops/POPFormDialog";
import POPViewDialog from "@/components/pops/POPViewDialog";
import { generatePopPdf } from "@/lib/generate-pop-pdf";

const CATEGORIES = [
  { value: "pre_analitica", label: "Fase Pré-Analítica", description: "Coleta, transporte, recepção e triagem de amostras" },
  { value: "analitica", label: "Fase Analítica", description: "Procedimentos técnicos, métodos e controle de qualidade" },
  { value: "pos_analitica", label: "Fase Pós-Analítica", description: "Liberação de resultados, laudos e entrega" },
  { value: "biosseguranca", label: "Biossegurança", description: "Descarte de resíduos, EPIs, acidentes biológicos" },
  { value: "gestao_qualidade", label: "Gestão da Qualidade", description: "Auditorias internas, não conformidades, indicadores" },
  { value: "equipamentos", label: "Equipamentos", description: "Calibração, manutenção preventiva/corretiva" },
  { value: "recursos_humanos", label: "Recursos Humanos", description: "Treinamento, competências, educação continuada" },
  { value: "infraestrutura", label: "Infraestrutura", description: "Limpeza, climatização, controle ambiental" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ComponentType<{ className?: string }> }> = {
  vigente: { label: "Vigente", variant: "default", icon: CheckCircle2 },
  rascunho: { label: "Rascunho", variant: "outline", icon: Clock },
  em_revisao: { label: "Em Revisão", variant: "secondary", icon: Edit2 },
  obsoleto: { label: "Obsoleto", variant: "destructive", icon: AlertTriangle },
};

const POPsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingPop, setEditingPop] = useState<any>(null);
  const [viewingPop, setViewingPop] = useState<any>(null);

  const { data: pops = [], isLoading } = useQuery({
    queryKey: ["pops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pops")
        .select("*")
        .order("code", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pops"] });
      toast({ title: "POP excluído com sucesso" });
    },
  });

  const filtered = pops.filter((pop: any) => {
    const matchSearch = !search || pop.title.toLowerCase().includes(search.toLowerCase()) || pop.code.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || pop.category === categoryFilter;
    const matchStatus = statusFilter === "all" || pop.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const stats = {
    total: pops.length,
    vigente: pops.filter((p: any) => p.status === "vigente").length,
    em_revisao: pops.filter((p: any) => p.status === "em_revisao").length,
    rascunho: pops.filter((p: any) => p.status === "rascunho").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            POPs — Procedimentos Operacionais Padrão
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conforme RDC 978/2025 — ANVISA · Boas Práticas em Laboratórios de Análises Clínicas
          </p>
        </div>
        <Button className="gap-2" onClick={() => { setEditingPop(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo POP
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total POPs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.vigente}</p>
              <p className="text-xs text-muted-foreground">Vigentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Edit2 className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.em_revisao}</p>
              <p className="text-xs text-muted-foreground">Em Revisão</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.rascunho}</p>
              <p className="text-xs text-muted-foreground">Rascunhos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código ou título..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="vigente">Vigente</SelectItem>
            <SelectItem value="em_revisao">Em Revisão</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="obsoleto">Obsoleto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs by Category */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.value} value={c.value} className="text-xs">{c.label}</TabsTrigger>
          ))}
        </TabsList>

        {["all", ...CATEGORIES.map((c) => c.value)].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered
                  .filter((pop: any) => tab === "all" || pop.category === tab)
                  .map((pop: any) => {
                    const statusCfg = STATUS_CONFIG[pop.status] || STATUS_CONFIG.rascunho;
                    const StatusIcon = statusCfg.icon;
                    const catLabel = CATEGORIES.find((c) => c.value === pop.category)?.label || pop.category;

                    return (
                      <Card key={pop.id} className="hover:shadow-md transition-shadow group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" />
                              <span className="text-xs font-mono text-muted-foreground">{pop.code}</span>
                            </div>
                            <Badge variant={statusCfg.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <CardTitle className="text-base mt-2 leading-snug">{pop.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] font-normal">{catLabel}</Badge>
                            <span>v{pop.version}</span>
                          </div>
                          {pop.effective_date && (
                            <p className="text-xs text-muted-foreground">
                              Vigência: {new Date(pop.effective_date).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                          {pop.next_review_date && (
                            <p className="text-xs text-muted-foreground">
                              Próxima revisão: {new Date(pop.next_review_date).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                          <div className="flex items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => { setViewingPop(pop); setViewOpen(true); }}>
                              <Eye className="h-3.5 w-3.5" /> Ver
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => { setEditingPop(pop); setFormOpen(true); }}>
                              <Edit2 className="h-3.5 w-3.5" /> Editar
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => generatePopPdf(pop)}>
                              <Download className="h-3.5 w-3.5" /> PDF
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(pop.id)}>
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
            {!isLoading && filtered.filter((pop: any) => tab === "all" || pop.category === tab).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum POP encontrado</p>
                <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => { setEditingPop(null); setFormOpen(true); }}>
                  <Plus className="h-4 w-4" /> Criar POP
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <POPFormDialog open={formOpen} onOpenChange={setFormOpen} editingPop={editingPop} categories={CATEGORIES} />
      <POPViewDialog open={viewOpen} onOpenChange={setViewOpen} pop={viewingPop} categories={CATEGORIES} />
    </div>
  );
};

export default POPsPage;
