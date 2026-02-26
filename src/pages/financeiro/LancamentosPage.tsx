import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePlus2 } from "lucide-react";

const LancamentosPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lançamentos Contábeis</h1>
        <p className="text-sm text-muted-foreground">Registro de lançamentos contábeis</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePlus2 className="h-5 w-5" />
            Lançamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Módulo em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LancamentosPage;
