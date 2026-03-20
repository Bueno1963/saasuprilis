import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useUserRole } from "@/hooks/useUserRole";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Orders from "./pages/Orders";
import Samples from "./pages/Samples";
import Worklist from "./pages/Worklist";
import WorklistLabApoio from "./pages/WorklistLabApoio";
import QualityControl from "./pages/QualityControl";
import QualityControlHematologia from "./pages/QualityControlHematologia";

import Laudos from "./pages/Laudos";
import LiberarExames from "./pages/laudos/LiberarExames";
import PedidosIncompletos from "./pages/laudos/PedidosIncompletos";
import ImprimirExames from "./pages/laudos/ImprimirExames";
import ValidarExames from "./pages/laudos/ValidarExames";
import CadastroLaudos from "./pages/laudos/CadastroLaudos";
import ExamesLiberados from "./pages/laudos/ExamesLiberados";
import SettingsPage from "./pages/SettingsPage";
import SuperAdminPage from "./pages/SuperAdminPage";

import RecepcaoPage from "./pages/RecepcaoPage";
import AgendamentoPage from "./pages/recepcao/AgendamentoPage";
import FinanceiroPage from "./pages/FinanceiroPage";
import POPsPage from "./pages/POPsPage";
import CertificadosPage from "./pages/pops/CertificadosPage";
import ManutencaoCalendarioPage from "./pages/pops/ManutencaoCalendarioPage";
import PlanoContasPage from "./pages/financeiro/PlanoContasPage";
import DREPage from "./pages/financeiro/DREPage";
import ContasPagarPage from "./pages/financeiro/ContasPagarPage";
import ContasReceberPage from "./pages/financeiro/ContasReceberPage";
import LancamentosPage from "./pages/financeiro/LancamentosPage";
import RazaoContabilPage from "./pages/financeiro/RazaoContabilPage";
import BalancetePage from "./pages/financeiro/BalancetePage";
import ImportarExtratoPage from "./pages/financeiro/ImportarExtratoPage";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PortalPaciente from "./pages/portal/PortalPaciente";
import PortalMedico from "./pages/portal/PortalMedico";
import PortalResultados from "./pages/portal/PortalResultados";
import LandingPage from "./pages/LandingPage";
import ColetasPage from "./pages/landing/ColetasPage";
import ExamesPage from "./pages/landing/ExamesPage";
import ConveniosPage from "./pages/landing/ConveniosPage";
import VacinasPage from "./pages/landing/VacinasPage";
import SaaSLandingPage from "./pages/SaaSLandingPage";

const queryClient = new QueryClient();

const DynamicGuard = ({ route, children }: { route: string; children: React.ReactNode }) => {
  const { isRouteAllowed, isLoading } = useRolePermissions();
  const { role, isLoading: roleLoading } = useUserRole();
  if (isLoading || roleLoading) return null;
  // For child routes like /laudos/validar, check parent route /laudos
  const parentRoute = route.split("/").slice(0, 2).join("/") || route;
  if (!isRouteAllowed(route) && !isRouteAllowed(parentRoute)) {
    // Recepcao always goes to /recepcao, others to /pacientes
    if (role === "recepcao") return <Navigate to="/recepcao" replace />;
    return <Navigate to="/pacientes" replace />;
  }
  return <>{children}</>;
};

const DefaultRedirect = () => {
  const { isRouteAllowed, isLoading } = useRolePermissions();
  const { role, isLoading: roleLoading } = useUserRole();
  if (isLoading || roleLoading) return null;
  if (role === "recepcao") return <Navigate to="/recepcao" replace />;
  if (isRouteAllowed("/")) return <Dashboard />;
  return <Navigate to="/pacientes" replace />;
};

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DefaultRedirect />} />
        <Route path="/pacientes" element={<DynamicGuard route="/pacientes"><Patients /></DynamicGuard>} />
        <Route path="/pedidos" element={<DynamicGuard route="/pedidos"><Orders /></DynamicGuard>} />
        <Route path="/amostras" element={<DynamicGuard route="/amostras"><Samples /></DynamicGuard>} />
        <Route path="/worklist" element={<DynamicGuard route="/worklist"><Worklist /></DynamicGuard>} />
        <Route path="/controle-qualidade" element={<DynamicGuard route="/controle-qualidade"><QualityControl /></DynamicGuard>} />
        <Route path="/controle-qualidade-hematologia" element={<DynamicGuard route="/controle-qualidade-hematologia"><QualityControlHematologia /></DynamicGuard>} />
        
        <Route path="/laudos" element={<DynamicGuard route="/laudos"><Laudos /></DynamicGuard>} />
        <Route path="/laudos/validar" element={<DynamicGuard route="/laudos/validar"><ValidarExames /></DynamicGuard>} />
        <Route path="/laudos/liberar" element={<DynamicGuard route="/laudos/liberar"><LiberarExames /></DynamicGuard>} />
        <Route path="/laudos/liberados" element={<DynamicGuard route="/laudos/liberados"><ExamesLiberados /></DynamicGuard>} />
        <Route path="/laudos/incompletos" element={<DynamicGuard route="/laudos/incompletos"><PedidosIncompletos /></DynamicGuard>} />
        <Route path="/laudos/imprimir" element={<DynamicGuard route="/laudos/imprimir"><ImprimirExames /></DynamicGuard>} />
        <Route path="/laudos/cadastro" element={<DynamicGuard route="/laudos/cadastro"><CadastroLaudos /></DynamicGuard>} />
        <Route path="/configuracoes" element={<DynamicGuard route="/configuracoes"><SettingsPage /></DynamicGuard>} />
        <Route path="/admin" element={<DynamicGuard route="/admin"><SuperAdminPage /></DynamicGuard>} />
        <Route path="/financeiro" element={<DynamicGuard route="/financeiro"><FinanceiroPage /></DynamicGuard>} />
        <Route path="/financeiro/plano-contas" element={<DynamicGuard route="/financeiro"><PlanoContasPage /></DynamicGuard>} />
        <Route path="/financeiro/dre" element={<DynamicGuard route="/financeiro"><DREPage /></DynamicGuard>} />
        <Route path="/financeiro/contas-pagar" element={<DynamicGuard route="/financeiro"><ContasPagarPage /></DynamicGuard>} />
        <Route path="/financeiro/contas-receber" element={<DynamicGuard route="/financeiro"><ContasReceberPage /></DynamicGuard>} />
        <Route path="/financeiro/lancamentos" element={<DynamicGuard route="/financeiro"><LancamentosPage /></DynamicGuard>} />
        <Route path="/financeiro/razao" element={<DynamicGuard route="/financeiro"><RazaoContabilPage /></DynamicGuard>} />
        <Route path="/financeiro/balancete" element={<DynamicGuard route="/financeiro"><BalancetePage /></DynamicGuard>} />
        <Route path="/financeiro/importar-extrato" element={<DynamicGuard route="/financeiro"><ImportarExtratoPage /></DynamicGuard>} />
        <Route path="/recepcao" element={<DynamicGuard route="/recepcao"><RecepcaoPage /></DynamicGuard>} />
        <Route path="/pops" element={<DynamicGuard route="/pops"><POPsPage /></DynamicGuard>} />
        <Route path="/pops/certificados" element={<DynamicGuard route="/pops"><CertificadosPage /></DynamicGuard>} />
        <Route path="/pops/manutencoes" element={<DynamicGuard route="/pops"><ManutencaoCalendarioPage /></DynamicGuard>} />
        <Route path="/recepcao/agendamento" element={<DynamicGuard route="/recepcao"><AgendamentoPage /></DynamicGuard>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const AuthRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/portal-paciente" element={<PortalPaciente />} />
            <Route path="/portal-medico" element={<PortalMedico />} />
            <Route path="/portal-resultados" element={<PortalResultados />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/landing/coletas" element={<ColetasPage />} />
            <Route path="/landing/exames" element={<ExamesPage />} />
            <Route path="/landing/convenios" element={<ConveniosPage />} />
            <Route path="/landing/vacinas" element={<VacinasPage />} />
            <Route path="/saas" element={<SaaSLandingPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
