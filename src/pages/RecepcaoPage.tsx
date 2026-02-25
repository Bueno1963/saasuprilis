import { useNavigate } from "react-router-dom";
import { UserPlus, FileCheck, FileSpreadsheet } from "lucide-react";

const sections = [
  { key: "cadastro", title: "Cadastro Pacientes", desc: "Cadastro e gerenciamento de pacientes do laboratório", icon: UserPlus, href: "/pacientes" },
  { key: "liberados", title: "Pacientes Liberados", desc: "Visualizar pacientes com exames liberados para retirada", icon: FileCheck, href: "/laudos/liberados" },
  { key: "orcamento", title: "Emissão Orçamento", desc: "Gerar orçamentos de exames para pacientes", icon: FileSpreadsheet, href: "/recepcao/orcamento" },
];

const RecepcaoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recepção</h1>
        <p className="text-sm text-muted-foreground">Atendimento e cadastro de pacientes</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map(({ key, title, desc, icon: Icon, href }) => (
          <button
            key={key}
            onClick={() => navigate(href)}
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

export default RecepcaoPage;
