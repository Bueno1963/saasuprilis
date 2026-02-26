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
} from "lucide-react";

export type AppRole = "admin" | "tecnico" | "recepcao";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  phase?: "pre" | "analytical" | "post";
  children?: NavItem[];
  allowedRoles?: AppRole[];
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, allowedRoles: ["admin", "tecnico"] },
  { title: "Recepção", href: "/recepcao", icon: ConciergeBell, phase: "pre", allowedRoles: ["admin", "recepcao"] },
  { title: "Pacientes", href: "/pacientes", icon: Users, phase: "pre", allowedRoles: ["admin", "tecnico", "recepcao"] },
  { title: "Pedidos", href: "/pedidos", icon: ClipboardList, phase: "pre", allowedRoles: ["admin", "tecnico", "recepcao"] },
  { title: "Amostras", href: "/amostras", icon: TestTubes, phase: "pre", allowedRoles: ["admin", "tecnico", "recepcao"] },
  { title: "Mapa de Trabalho", href: "/worklist", icon: FlaskConical, phase: "analytical", allowedRoles: ["admin", "tecnico"] },
  { title: "Controle de Qualidade", href: "/qc", icon: BarChart3, phase: "analytical", allowedRoles: ["admin", "tecnico"] },
  { title: "Resultados", href: "/resultados", icon: FileCheck, phase: "post", allowedRoles: ["admin", "tecnico"] },
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
      { title: "Pedidos Incompletos", href: "/laudos/incompletos", icon: AlertTriangle },
      { title: "Imprimir Exames", href: "/laudos/imprimir", icon: Printer },
      { title: "Cadastro de Laudos", href: "/laudos/cadastro", icon: FilePlus2 },
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
      { title: "Razão Contábil", href: "/financeiro/razao", icon: BookOpen },
      { title: "Balancete", href: "/financeiro/balancete", icon: Scale },
    ],
  },
  { title: "Configurações", href: "/configuracoes", icon: Settings, allowedRoles: ["admin"] },
];
