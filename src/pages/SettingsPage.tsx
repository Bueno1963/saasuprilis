import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Cpu, FlaskConical, HeartHandshake, Users, Plug, Printer } from "lucide-react";
import LabSettings from "@/components/settings/LabSettings";
import EquipmentSettings from "@/components/settings/EquipmentSettings";
import ExamCatalogSettings from "@/components/settings/ExamCatalogSettings";
import InsuranceSettings from "@/components/settings/InsuranceSettings";
import UsersSettings from "@/components/settings/UsersSettings";
import IntegrationsSettings from "@/components/settings/IntegrationsSettings";

type Section = "menu" | "lab" | "equipment" | "exams" | "insurance" | "users" | "integrations";

const sections = [
  { key: "lab" as Section, title: "Laboratório", desc: "Nome, CNPJ, responsável técnico e dados cadastrais", icon: Building2 },
  { key: "equipment" as Section, title: "Equipamentos", desc: "Gerenciamento de analisadores e protocolos de interfaceamento", icon: Cpu },
  { key: "exams" as Section, title: "Exames", desc: "Catálogo de exames, valores de referência e regras de decisão", icon: FlaskConical },
  { key: "insurance" as Section, title: "Convênios", desc: "Tabelas de preços, regras de faturamento e glosas", icon: HeartHandshake },
  { key: "users" as Section, title: "Usuários", desc: "Controle de acesso, perfis e permissões do sistema", icon: Users },
  { key: "integrations" as Section, title: "Integrações", desc: "HL7, ASTM, API externas e portal de resultados", icon: Plug },
];

const SettingsPage = () => {
  const [section, setSection] = useState<Section>("menu");

  const goBack = () => setSection("menu");

  if (section === "lab") return <LabSettings onBack={goBack} />;
  if (section === "equipment") return <EquipmentSettings onBack={goBack} />;
  if (section === "exams") return <ExamCatalogSettings onBack={goBack} />;
  if (section === "insurance") return <InsuranceSettings onBack={goBack} />;
  if (section === "users") return <UsersSettings onBack={goBack} />;
  if (section === "integrations") return <IntegrationsSettings onBack={goBack} />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Configurações do sistema laboratorial</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map(({ key, title, desc, icon: Icon }) => (
          <Card
            key={key}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSection(key)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <span className="block text-sm font-bold text-foreground">{title}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
