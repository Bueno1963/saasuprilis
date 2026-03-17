import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, FlaskConical } from "lucide-react";
import BioquimicaDailySheet from "@/components/qc/BioquimicaDailySheet";

const dailySheetViews: Record<string, string> = {
  "hemato-normal": "Hematologia Nível Normal",
  "hemato-baixa": "Hematologia Baixa",
  "hemato-alta": "Hematologia Alta",
};

const QualityControlHematologia = () => {
  const [activeView, setActiveView] = useState<string>("main");

  if (activeView !== "main") {
    return (
      <div className="p-6">
        <BioquimicaDailySheet
          onBack={() => setActiveView("main")}
          title={dailySheetViews[activeView] || activeView}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Controle de Qualidade Hematologia</h1>
        <p className="text-sm text-muted-foreground">Monitoramento de precisão analítica para o setor de Hematologia</p>
      </div>

      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <FlaskConical className="h-4 w-4" />
              Lançamentos Diários
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setActiveView("hemato-normal")}>Hematologia Nível Normal</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("hemato-baixa")}>Hematologia Baixa</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("hemato-alta")}>Hematologia Alta</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hematologia — Controle de Qualidade</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Selecione um lançamento diário acima para registrar os controles de qualidade do setor de Hematologia.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityControlHematologia;
