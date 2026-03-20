import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, TestTubes, FlaskConical, Microscope, ClipboardList, BarChart3, Settings, Users, Stethoscope, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Props { onBack: () => void; }

const chapters = [
  {
    title: "Recepção / Coleta",
    icon: Users,
    content: [
      "Cadastro de pacientes com CPF, data de nascimento e convênio.",
      "Emissão de pedidos com seleção de exames do catálogo.",
      "Impressão de etiquetas com código de barras para identificação de amostras.",
      "Emissão de comprovante e declaração de comparecimento.",
      "Agendamento de coletas com calendário semanal.",
    ],
  },
  {
    title: "Amostras e Kanban",
    icon: TestTubes,
    content: [
      "Visualização Kanban com colunas: Recepção/Coleta → Triagem → Em Análise → Analisadas.",
      "Arraste amostras entre colunas para alterar o status.",
      "Registro de condição da amostra (De acordo, Hemolisada, Insuficiente, etc.).",
      "Condições específicas por material: Fezes (Larvas Visíveis, Não coletada) e Urina (Hematúria Visual, Não coletado).",
      "Somente amostras 'De acordo' seguem para análise. Demais condições geram Não Conformidade e aguardam aprovação do Administrador.",
      "Filtros por data, setor e busca por paciente/código de barras.",
    ],
  },
  {
    title: "Worklist e Digitação",
    icon: ClipboardList,
    content: [
      "Lista de trabalho com todas as amostras e seus status.",
      "Edição de resultados diretamente na worklist.",
      "Envio automático para equipamentos integrados ao triar amostras.",
      "Worklist separada para laboratório de apoio.",
    ],
  },
  {
    title: "Controle de Qualidade",
    icon: FlaskConical,
    content: [
      "Planilha diária de CQ para Bioquímica e Hematologia.",
      "Gráficos de Levey-Jennings com regras de Westgard configuráveis.",
      "Cadastro de lotes de controle com média esperada, DP e validade.",
      "Cadastro de analitos com equipamento, nível e material.",
    ],
  },
  {
    title: "Laudos (Pós-Analítico)",
    icon: FileText,
    content: [
      "Fluxo: Cadastro → Validar → Liberar → Imprimir.",
      "Validação técnica com campos obrigatórios por tipo de exame.",
      "Liberação com assinatura digital (Nome + Registro Profissional).",
      "Geração de PDF com layout personalizado por exame.",
      "Pedidos incompletos são destacados para acompanhamento.",
    ],
  },
  {
    title: "Rastreabilidade",
    icon: Microscope,
    content: [
      "Stepper visual com todas as etapas da amostra.",
      "Registro de eventos: quem alterou, quando e para qual status.",
      "Aba de Não Conformidades com severidade e ação corretiva.",
      "Monitoramento de temperatura de transporte.",
      "Relatórios de conformidade por período.",
    ],
  },
  {
    title: "Financeiro",
    icon: BarChart3,
    content: [
      "Contas a Receber e Contas a Pagar.",
      "Faturamento por convênio com lotes de cobrança (TISS).",
      "Plano de Contas contábil com lançamentos e balancete.",
      "DRE (Demonstração do Resultado do Exercício).",
      "Importação de extratos bancários com classificação automática.",
    ],
  },
  {
    title: "Configurações",
    icon: Settings,
    content: [
      "Dados do laboratório (nome, CNPJ, responsável técnico).",
      "Catálogo de Exames com setores, materiais e condições de amostra personalizáveis.",
      "Cadastro de Parâmetros para modelo de digitação de laudos.",
      "Equipamentos e protocolos de interfaceamento (HL7, ASTM).",
      "Convênios com tabela de preços e procedimentos.",
      "Gestão de Usuários com perfis de acesso (Administrador, Técnico, Recepção).",
      "Assinantes por Setor para assinatura digital de laudos.",
      "Impressoras e layouts de impressão.",
    ],
  },
  {
    title: "Portais Externos",
    icon: Stethoscope,
    content: [
      "Portal do Paciente: consulta de resultados com CPF + data de nascimento.",
      "Portal do Médico: consulta por CRM + nome do paciente.",
      "Logs de acesso auditáveis para conformidade com LGPD.",
    ],
  },
];

const UserManualSettings = ({ onBack }: Props) => {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Manual do Usuário
          </h1>
          <p className="text-sm text-muted-foreground">Guia completo de funcionalidades do sistema laboratorial</p>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {chapters.map((ch, idx) => (
          <AccordionItem key={idx} value={`ch-${idx}`} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <ch.icon className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-semibold text-foreground">{ch.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 pl-8 list-disc text-sm text-muted-foreground">
                {ch.content.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default UserManualSettings;
