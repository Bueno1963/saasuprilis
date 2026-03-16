import { 
  Activity, 
  Users, 
  TestTubes, 
  ClipboardList, 
  BarChart3, 
  FileCheck, 
  FileDown,
  Settings,
  FlaskConical,
  LayoutDashboard,
  Unlock,
  AlertTriangle,
  Printer,
  ShieldCheck,
  FilePlus2,
  ConciergeBell,
  DollarSign,
  Receipt,
  BookOpen,
  Scale,
  Upload,
  FileText,
  Award,
  CalendarClock,
  ShieldAlert,
} from "lucide-react";

export type AppRole = "admin" | "tecnico" | "recepcao";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  phase?: "pre" | "analytical" | "post" | "quality";
  children?: NavItem[];
  allowedRoles?: AppRole[];
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, allowedRoles: ["admin", "tecnico"] },
  { title: "Recepção", href: "/recepcao", icon: ConciergeBell, phase: "pre", allowedRoles: ["admin", "recepcao"] },
  { title: "Pacientes", href: "/pacientes", icon: Users, phase: "pre", allowedRoles: ["admin", "tecnico", "recepcao"] },
  { title: "Pedidos", href: "/pedidos", icon: ClipboardList, phase: "pre", allowedRoles: ["admin", "tecnico", "recepcao"] },
  
  { title: "Amostras", href: "/amostras", icon: TestTubes, phase: "analytical", allowedRoles: ["admin", "tecnico", "recepcao"] },
  { title: "Esteira de Produção", href: "/worklist", icon: FlaskConical, phase: "analytical", allowedRoles: ["admin", "tecnico"] },
  
  {
    title: "Laudos",
    href: "/laudos",
    icon: FileDown,
    phase: "post",
    allowedRoles: ["admin", "tecnico"],
    children: [
      { title: "Validar Exames", href: "/laudos/validar", icon: ShieldCheck },
      { title: "Liberar Exames", href: "/laudos/liberar", icon: Unlock },
      { title: "Pacientes Liberados", href: "/laudos/liberados", icon: FileCheck },
      { title: "Impressão por Setor", href: "/laudos/imprimir", icon: Printer },
      { title: "Pedidos Incompletos", href: "/laudos/incompletos", icon: AlertTriangle },
    ],
  },
  
  
  {
    title: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    allowedRoles: ["admin"],
    children: [
      { title: "Plano de Contas", href: "/financeiro/plano-contas", icon: ClipboardList },
      { title: "DRE", href: "/financeiro/dre", icon: BarChart3 },
      { title: "Contas a Pagar", href: "/financeiro/contas-pagar", icon: Receipt },
      { title: "Contas a Receber", href: "/financeiro/contas-receber", icon: DollarSign },
      { title: "Lançamentos Contábeis", href: "/financeiro/lancamentos", icon: FilePlus2 },
      { title: "Importar Extrato", href: "/financeiro/importar-extrato", icon: Upload },
      { title: "Razão Contábil", href: "/financeiro/razao", icon: BookOpen },
      { title: "Balancete", href: "/financeiro/balancete", icon: Scale },
    ],
  },
  {
    title: "POPs",
    href: "/pops",
    icon: FileText,
    phase: "quality",
    allowedRoles: ["admin", "tecnico"],
    children: [
      { title: "Arquivo de Certificados", href: "/pops/certificados", icon: Award },
      { title: "Calendário Manutenções", href: "/pops/manutencoes", icon: CalendarClock },
    ],
  },
  { title: "Controle de Qualidade", href: "/controle-qualidade", icon: Activity, phase: "quality", allowedRoles: ["admin", "tecnico"] },

  {
    title: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    allowedRoles: ["admin"],
    children: [
      { title: "Plano de Contas", href: "/financeiro/plano-contas", icon: ClipboardList },
      { title: "DRE", href: "/financeiro/dre", icon: BarChart3 },
      { title: "Contas a Pagar", href: "/financeiro/contas-pagar", icon: Receipt },
      { title: "Contas a Receber", href: "/financeiro/contas-receber", icon: DollarSign },
      { title: "Lançamentos Contábeis", href: "/financeiro/lancamentos", icon: FilePlus2 },
      { title: "Importar Extrato", href: "/financeiro/importar-extrato", icon: Upload },
      { title: "Razão Contábil", href: "/financeiro/razao", icon: BookOpen },
      { title: "Balancete", href: "/financeiro/balancete", icon: Scale },
    ],
  },
  { title: "Configurações", href: "/configuracoes", icon: Settings, allowedRoles: ["admin"] },
  { title: "Super Admin", href: "/admin", icon: ShieldAlert, allowedRoles: ["admin"] },
];
