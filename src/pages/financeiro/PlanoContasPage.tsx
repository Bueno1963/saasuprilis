import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

const PlanoContasPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plano de Contas</h1>
        <p className="text-sm text-muted-foreground">Estrutura de contas contábeis do laboratório</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Plano de Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanoContasPage;
