import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Cpu, FlaskConical, HeartHandshake, Users, Plug } from "lucide-react";
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
          <button
            key={key}
            onClick={() => setSection(key)}
            className="group relative rounded-xl px-6 py-5 text-left transition-all duration-200
              bg-gradient-to-b from-[hsl(210,95%,48%)] via-[hsl(215,90%,40%)] to-[hsl(220,85%,32%)]
              shadow-[0_4px_12px_hsl(220,85%,25%/0.35),inset_0_1px_1px_hsl(210,100%,75%/0.5)]
              hover:shadow-[0_6px_20px_hsl(220,85%,25%/0.5),inset_0_1px_1px_hsl(210,100%,75%/0.5)]
              hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[0_2px_6px_hsl(220,85%,25%/0.3)]
              border border-[hsl(210,70%,35%/0.4)]
              overflow-hidden"
          >
            {/* Glossy shine overlay */}
            <div className="absolute inset-x-0 top-0 h-[45%] rounded-t-xl bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3">
              <Icon className="h-6 w-6 text-white drop-shadow-sm shrink-0" />
              <div>
                <span className="block text-sm font-bold text-white drop-shadow-sm">{title}</span>
                <span className="block text-xs text-white/75 mt-0.5 leading-snug">{desc}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
