import { FileText, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockPOPs = [
  { id: 1, code: "POP-001", title: "Coleta de Sangue Venoso", sector: "Coleta", version: "3.0", status: "Vigente", updatedAt: "2025-01-15" },
  { id: 2, code: "POP-002", title: "Processamento de Amostras", sector: "Pré-Analítico", version: "2.1", status: "Vigente", updatedAt: "2025-02-10" },
  { id: 3, code: "POP-003", title: "Controle de Qualidade Interno", sector: "Analítico", version: "4.0", status: "Vigente", updatedAt: "2025-03-01" },
  { id: 4, code: "POP-004", title: "Liberação de Laudos", sector: "Pós-Analítico", version: "1.2", status: "Em Revisão", updatedAt: "2025-03-10" },
  { id: 5, code: "POP-005", title: "Descarte de Resíduos", sector: "Biossegurança", version: "2.0", status: "Vigente", updatedAt: "2024-12-20" },
  { id: 6, code: "POP-006", title: "Calibração de Equipamentos", sector: "Manutenção", version: "1.0", status: "Rascunho", updatedAt: "2025-03-12" },
];

const POPsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">POPs</h1>
          <p className="text-sm text-muted-foreground">Procedimentos Operacionais Padrão</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo POP
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar POP..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockPOPs.map((pop) => (
          <Card key={pop.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground">{pop.code}</span>
                </div>
                <Badge
                  variant={pop.status === "Vigente" ? "default" : pop.status === "Em Revisão" ? "secondary" : "outline"}
                >
                  {pop.status}
                </Badge>
              </div>
              <CardTitle className="text-base mt-2">{pop.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{pop.sector}</span>
                <span>v{pop.version}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Atualizado em {new Date(pop.updatedAt).toLocaleDateString("pt-BR")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default POPsPage;
