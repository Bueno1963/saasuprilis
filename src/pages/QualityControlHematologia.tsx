import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, FlaskConical, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import LeveyJenningsHematologia from "@/components/qc/LeveyJenningsHematologia";
import BioquimicaDailySheet from "@/components/qc/BioquimicaDailySheet";
import type { DailySheetSection } from "@/components/qc/BioquimicaDailySheet";
import NovoAnalitoSheet from "@/components/qc/NovoAnalitoSheet";
import type { ParameterSection } from "@/components/qc/NovoAnalitoSheet";
import QCManagementSettings from "@/components/settings/QCManagementSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const dailySheetViews: Record<string, string> = {
  "hemato-normal": "Hematologia Nível Normal",
  "hemato-baixa": "Hematologia Baixa",
  "hemato-alta": "Hematologia Alta",
};

const DEFAULT_SECTIONS: ParameterSection[] = [
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
  const [sections, setSections] = useState<ParameterSection[]>(() => {
    const saved = localStorage.getItem("hemato-qc-sections");
    return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
  });
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [editParams, setEditParams] = useState<string[]>([]);
  const [newParamName, setNewParamName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "section" | "param"; sectionIdx: number; paramIdx?: number } | null>(null);

  const saveSections = (updated: ParameterSection[]) => {
    setSections(updated);
    localStorage.setItem("hemato-qc-sections", JSON.stringify(updated));
  };

  const openEditSection = (idx: number) => {
    setEditingSectionIdx(idx);
    setEditSectionName(sections[idx].section);
    setEditParams([...sections[idx].parameters]);
    setNewParamName("");
  };

  const saveEditSection = () => {
    if (editingSectionIdx === null) return;
    const updated = [...sections];
    updated[editingSectionIdx] = { section: editSectionName.trim() || updated[editingSectionIdx].section, parameters: editParams.filter(p => p.trim()) };
    saveSections(updated);
    setEditingSectionIdx(null);
    toast.success("Seção atualizada com sucesso");
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const updated = [...sections];
    if (deleteConfirm.type === "section") {
      updated.splice(deleteConfirm.sectionIdx, 1);
      toast.success("Seção excluída");
    } else if (deleteConfirm.type === "param" && deleteConfirm.paramIdx !== undefined) {
      updated[deleteConfirm.sectionIdx].parameters.splice(deleteConfirm.paramIdx, 1);
      toast.success("Parâmetro excluído");
    }
    saveSections(updated);
    setDeleteConfirm(null);
    if (editingSectionIdx !== null && deleteConfirm.type === "param") {
      setEditParams([...updated[deleteConfirm.sectionIdx].parameters]);
    }
  };

  const addParamToEdit = () => {
    if (!newParamName.trim()) return;
    setEditParams([...editParams, newParamName.trim()]);
    setNewParamName("");
  };

  const removeParamFromEdit = (idx: number) => {
    setEditParams(editParams.filter((_, i) => i !== idx));
  };

  const addNewSection = () => {
    const updated = [...sections, { section: `Nova Seção ${sections.length + 1}`, parameters: [] }];
    saveSections(updated);
    openEditSection(updated.length - 1);
  };

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

      <LeveyJenningsHematologia />

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
