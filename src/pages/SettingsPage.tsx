import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Configurações do sistema laboratorial</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: "Laboratório", desc: "Nome, CNPJ, responsável técnico e dados cadastrais" },
          { title: "Equipamentos", desc: "Gerenciamento de analisadores e protocolos de interfaceamento" },
          { title: "Exames", desc: "Catálogo de exames, valores de referência e regras de decisão" },
          { title: "Convênios", desc: "Tabelas de preços, regras de faturamento e glosas" },
          { title: "Usuários", desc: "Controle de acesso, perfis e permissões do sistema" },
          { title: "Integrações", desc: "HL7, ASTM, API externas e portal de resultados" },
        ].map(item => (
          <Card key={item.title} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
