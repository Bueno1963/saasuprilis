import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConical, User, Lock, ArrowRight, Shield, Microscope, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState("tecnico");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(205,70%,35%)] to-[hsl(var(--accent))]" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">GestaLIS</span>
          </div>

          {/* Main content */}
          <div className="space-y-5 max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Sistema de Gestão{" "}
              <span className="text-[hsl(170,80%,70%)]">Laboratorial</span>
            </h1>
            <p className="text-white/75 text-sm leading-relaxed">
              O GestaLIS é um sistema de gestão laboratorial (LIS) desenvolvido para integrar processos, 
              equipamentos e informações em um único ambiente. Com interfaceamento próprio, garante 
              segurança, agilidade e confiabilidade na comunicação com analisadores, do cadastro da 
              amostra à liberação dos laudos.
            </p>
          </div>

          {/* Footer */}
          <p className="text-white/40 text-xs">© 2026 GestaLIS — Todos os direitos reservados</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">GestaLIS</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? "Acessar Sistema" : "Criar Conta"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin ? "Entre com suas credenciais" : "Preencha os dados para cadastro"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Dr. João Silva"
                    required={!isLogin}
                    className="pl-10 h-11 border-border/60 focus:border-accent"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Digite seu usuário"
                  required
                  className="pl-10 h-11 border-border/60 focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  minLength={6}
                  className="pl-10 h-11 border-border/60 focus:border-accent"
                />
              </div>
            </div>

            {isLogin && (
              <div className="space-y-2">
                <Label>Perfil de acesso</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "admin", label: "Admin", icon: Shield },
                    { value: "tecnico", label: "Técnico", icon: Microscope },
                    { value: "recepcao", label: "Recepção", icon: ClipboardList },
                  ].map((p) => {
                    const Icon = p.icon;
                    const selected = selectedRole === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setSelectedRole(p.value)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                          selected
                            ? "border-accent bg-accent/10 text-accent shadow-sm"
                            : "border-border/60 text-muted-foreground hover:border-accent/40 hover:bg-muted/50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-medium gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-lg shadow-accent/25 transition-all"
            >
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
