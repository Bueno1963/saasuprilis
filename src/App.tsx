import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
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
        <Route path="/" element={<Dashboard />} />
        <Route path="/pacientes" element={<Patients />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/amostras" element={<Samples />} />
        <Route path="/worklist" element={<Worklist />} />
        <Route path="/qc" element={<QualityControl />} />
        <Route path="/resultados" element={<Results />} />
        <Route path="/laudos" element={<Laudos />} />
        <Route path="/laudos/validar" element={<ValidarExames />} />
        <Route path="/laudos/liberar" element={<LiberarExames />} />
        <Route path="/laudos/incompletos" element={<PedidosIncompletos />} />
        <Route path="/laudos/imprimir" element={<ImprimirExames />} />
        <Route path="/laudos/cadastro" element={<CadastroLaudos />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
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
