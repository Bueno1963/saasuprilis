import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, FlaskConical } from "lucide-react";
import LeveyJenningsHematologia from "@/components/qc/LeveyJenningsHematologia";
import BioquimicaDailySheet from "@/components/qc/BioquimicaDailySheet";
import type { DailySheetSection } from "@/components/qc/BioquimicaDailySheet";
import NovoAnalitoSheet from "@/components/qc/NovoAnalitoSheet";
import type { ParameterSection } from "@/components/qc/NovoAnalitoSheet";
import QCManagementSettings from "@/components/settings/QCManagementSettings";

const dailySheetViews: Record<string, string> = {
  "hemato-normal": "Hematologia Nível Normal",
  "hemato-baixa": "Hematologia Baixa",
  "hemato-alta": "Hematologia Alta",
};

const HEMATOLOGIA_PRO_IN_SECTIONS: ParameterSection[] = [
  {
    section: "Eritrograma",
    parameters: [
      "Eritrócitos (hemácias)",
      "Hemoglobina",
      "Hematócrito",
      "VCM (Volume Corpuscular Médio)",
      "HCM (Hemoglobina Corpuscular Média)",
      "CHCM (Concentração de Hemoglobina Corpuscular Média)",
      "RDW (Red Cell Distribution Width)",
      "Reticulócitos",
    ],
  },
  {
    section: "Leucograma",
    parameters: [
      "Leucócitos Totais",
      "Neutrófilos",
      "Linfócitos",
      "Monócitos",
      "Eosinófilos",
      "Basófilos",
      "Bastões",
      "Metamielócitos",
    ],
  },
  {
    section: "Plaquetas",
    parameters: [
      "Plaquetas",
      "VPM (Volume Plaquetário Médio)",
      "PDW (Platelet Distribution Width)",
    ],
  },
];

const QualityControlHematologia = () => {
  const [activeView, setActiveView] = useState<string>("main");

  if (activeView === "novo-analito-pro-in-hemato") {
    return (
      <div className="p-6">
        <NovoAnalitoSheet
          onBack={() => setActiveView("main")}
          title="Lançar Parâmetros PRO-IN Hematologia"
          parameterSections={HEMATOLOGIA_PRO_IN_SECTIONS}
          marcaLabel="Reagente Marca"
          defaultMarca="Diagno"
        />
      </div>
    );
  }

  if (activeView === "novo-analito-niveis-hemato") {
    return (
      <div className="p-6">
        <NovoAnalitoSheet
          onBack={() => setActiveView("main")}
          title="Lançar Parâmetros Controle Qualidade Hematologia"
          parameterSections={HEMATOLOGIA_PRO_IN_SECTIONS}
          marcaLabel="Reagente Marca"
          defaultMarca="Diagno"
        />
      </div>
    );
  }

  if (activeView !== "main") {
    return (
      <div className="p-6">
        <BioquimicaDailySheet
          onBack={() => setActiveView("main")}
          title={dailySheetViews[activeView] || activeView}
          parameterSections={HEMATOLOGIA_PRO_IN_SECTIONS}
          defaultBrand="Diagno"
          sector="Hematologia"
          sheetType={activeView}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Qualidade Hematologia</h1>
          <p className="text-sm text-muted-foreground">Monitoramento de precisão analítica para o setor de Hematologia</p>
        </div>
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

      <QCManagementSettings
        onBack={() => {}}
        embedded
        sectorTitle="Gestão Controle de Qualidade Hematologia"
        sectorDescription="Configuração de analitos, regras de Westgard, lotes de controle, PRO-IN e PRO-EX — organizados por setor"
        proInMaterial="sangue humano"
        proInSectorLabel="Hematologia"
        proInSectorFilter="Hematologia"
        onNovoAnalitoProIn={() => setActiveView("novo-analito-pro-in-hemato")}
        onNovoAnalitoNiveis={() => setActiveView("novo-analito-niveis-hemato")}
      />
    </div>
  );
};

export default QualityControlHematologia;
