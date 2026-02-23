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
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  phase?: "pre" | "analytical" | "post";
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Pacientes", href: "/pacientes", icon: Users, phase: "pre" },
  { title: "Pedidos", href: "/pedidos", icon: ClipboardList, phase: "pre" },
  { title: "Amostras", href: "/amostras", icon: TestTubes, phase: "pre" },
  { title: "Mapa de Trabalho", href: "/worklist", icon: FlaskConical, phase: "analytical" },
  { title: "Controle de Qualidade", href: "/qc", icon: BarChart3, phase: "analytical" },
  { title: "Resultados", href: "/resultados", icon: FileCheck, phase: "post" },
  {
    title: "Laudos",
    href: "/laudos",
    icon: FileDown,
    phase: "post",
    children: [
      { title: "Validar Exames", href: "/laudos/validar", icon: ShieldCheck },
      { title: "Liberar Exames", href: "/laudos/liberar", icon: Unlock },
      { title: "Pedidos Incompletos", href: "/laudos/incompletos", icon: AlertTriangle },
      { title: "Imprimir Exames", href: "/laudos/imprimir", icon: Printer },
      { title: "Cadastro de Laudos", href: "/laudos/cadastro", icon: FilePlus2 },
    ],
  },
  { title: "Configurações", href: "/configuracoes", icon: Settings },
];
