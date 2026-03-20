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
          parameterSections={sections}
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
          parameterSections={sections}
          marcaLabel="Reagente Marca"
          defaultMarca="Diagno"
        />
      </div>
    );
  }

  if (activeView.startsWith("lj-")) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveView("main")}>
            <span className="text-lg">←</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {activeView === "lj-hemato-normal" ? "Levey-Jennings — Hematologia Normal" : activeView === "lj-hemato-baixa" ? "Levey-Jennings — Hematologia Baixa" : "Levey-Jennings — Hematologia Alta"}
            </h1>
            <p className="text-sm text-muted-foreground">Gráfico de controle estatístico de processo</p>
          </div>
        </div>
        <LeveyJenningsHematologia />
      </div>
    );
  }

  if (activeView !== "main") {
    return (
      <div className="p-6">
        <BioquimicaDailySheet
          onBack={() => setActiveView("main")}
          title={dailySheetViews[activeView] || activeView}
          parameterSections={sections}
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
            <DropdownMenuItem onClick={() => setActiveView("hemato-normal")}>Hematologia Normal</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("hemato-baixa")}>Hematologia Baixa</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("hemato-alta")}>Hematologia Alta</DropdownMenuItem>
            <DropdownMenuItem className="mt-1 border-t pt-1" onClick={() => setActiveView("lj-hemato-normal")}>
              Levey-Jennings — Normal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("lj-hemato-baixa")}>
              Levey-Jennings — Baixa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveView("lj-hemato-alta")}>
              Levey-Jennings — Alta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Seções de Parâmetros com Editar/Excluir */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Parâmetros Hematológicos</CardTitle>
          <Button variant="outline" size="sm" onClick={addNewSection}>
            <Plus className="h-4 w-4 mr-1" /> Nova Seção
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-foreground">{sec.section}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSection(sIdx)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ type: "section", sectionIdx: sIdx })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sec.parameters.map((p, pIdx) => (
                  <span key={pIdx} className="text-xs bg-background border rounded-md px-2 py-1 text-muted-foreground">{p}</span>
                ))}
                {sec.parameters.length === 0 && <span className="text-xs text-muted-foreground italic">Nenhum parâmetro</span>}
              </div>
            </div>
          ))}
          {sections.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma seção cadastrada</p>}
        </CardContent>
      </Card>

      {/* Dialog Editar Seção */}
      <Dialog open={editingSectionIdx !== null} onOpenChange={(open) => !open && setEditingSectionIdx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Seção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome da Seção</label>
              <Input value={editSectionName} onChange={e => setEditSectionName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Parâmetros</label>
              <div className="space-y-1.5 mt-1 max-h-48 overflow-y-auto">
                {editParams.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={p} onChange={e => { const u = [...editParams]; u[i] = e.target.value; setEditParams(u); }} className="h-8 text-sm" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => removeParamFromEdit(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input placeholder="Novo parâmetro..." value={newParamName} onChange={e => setNewParamName(e.target.value)} onKeyDown={e => e.key === "Enter" && addParamToEdit()} className="h-8 text-sm" />
                <Button variant="outline" size="sm" onClick={addParamToEdit} disabled={!newParamName.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSectionIdx(null)}>Cancelar</Button>
            <Button onClick={saveEditSection}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteConfirm?.type === "section"
              ? `Deseja excluir a seção "${sections[deleteConfirm.sectionIdx]?.section}" e todos os seus parâmetros?`
              : "Deseja excluir este parâmetro?"}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
