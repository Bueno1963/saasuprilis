import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { navItems, type AppRole } from "@/lib/navigation";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Orders from "./pages/Orders";
import Samples from "./pages/Samples";
import Worklist from "./pages/Worklist";
import QualityControl from "./pages/QualityControl";
import Results from "./pages/Results";
import Laudos from "./pages/Laudos";
import LiberarExames from "./pages/laudos/LiberarExames";
import PedidosIncompletos from "./pages/laudos/PedidosIncompletos";
import ImprimirExames from "./pages/laudos/ImprimirExames";
import ValidarExames from "./pages/laudos/ValidarExames";
import CadastroLaudos from "./pages/laudos/CadastroLaudos";
import SettingsPage from "./pages/SettingsPage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RoleGuard = ({ allowedRoles, children, fallback = "/" }: { allowedRoles?: AppRole[]; children: React.ReactNode; fallback?: string }) => {
  const { role, isLoading } = useUserRole();
  if (isLoading) return null;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to={fallback} replace />;
  return <>{children}</>;
};

const getAllowedRoles = (href: string): AppRole[] | undefined => {
  for (const item of navItems) {
    if (item.href === href) return item.allowedRoles;
    if (item.children) {
      for (const child of item.children) {
        if (child.href === href) return item.allowedRoles;
      }
    }
  }
  return undefined;
};

const GuardedRoute = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const roles = getAllowedRoles(href);
  return <RoleGuard allowedRoles={roles}>{children}</RoleGuard>;
};

const DefaultRedirect = () => {
  const { role } = useUserRole();
  if (role === "recepcao") return <Navigate to="/pacientes" replace />;
  return <Dashboard />;
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
        <Route path="/pacientes" element={<GuardedRoute href="/pacientes"><Patients /></GuardedRoute>} />
        <Route path="/pedidos" element={<GuardedRoute href="/pedidos"><Orders /></GuardedRoute>} />
        <Route path="/amostras" element={<GuardedRoute href="/amostras"><Samples /></GuardedRoute>} />
        <Route path="/worklist" element={<GuardedRoute href="/worklist"><Worklist /></GuardedRoute>} />
        <Route path="/qc" element={<GuardedRoute href="/qc"><QualityControl /></GuardedRoute>} />
        <Route path="/resultados" element={<GuardedRoute href="/resultados"><Results /></GuardedRoute>} />
        <Route path="/laudos" element={<GuardedRoute href="/laudos"><Laudos /></GuardedRoute>} />
        <Route path="/laudos/validar" element={<GuardedRoute href="/laudos/validar"><ValidarExames /></GuardedRoute>} />
        <Route path="/laudos/liberar" element={<GuardedRoute href="/laudos/liberar"><LiberarExames /></GuardedRoute>} />
        <Route path="/laudos/incompletos" element={<GuardedRoute href="/laudos/incompletos"><PedidosIncompletos /></GuardedRoute>} />
        <Route path="/laudos/imprimir" element={<GuardedRoute href="/laudos/imprimir"><ImprimirExames /></GuardedRoute>} />
        <Route path="/laudos/cadastro" element={<GuardedRoute href="/laudos/cadastro"><CadastroLaudos /></GuardedRoute>} />
        <Route path="/configuracoes" element={<GuardedRoute href="/configuracoes"><SettingsPage /></GuardedRoute>} />
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
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
