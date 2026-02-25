import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlaskConical, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <FlaskConical className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Link inválido</h2>
          <p className="text-sm text-muted-foreground">
            Este link de recuperação é inválido ou já expirou.
          </p>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(205,70%,35%)] to-[hsl(var(--accent))]" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">VEROLIS</span>
          </div>
          <div className="space-y-5 max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Redefinir{" "}
              <span className="text-[hsl(170,80%,70%)]">Senha</span>
            </h1>
            <p className="text-white/75 text-sm leading-relaxed">
              Defina uma nova senha para acessar o sistema. Escolha uma senha segura com pelo menos 6 caracteres.
            </p>
          </div>
          <p className="text-white/40 text-xs">© 2026 VEROLIS — Todos os direitos reservados</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">VEROLIS</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Nova Senha</h2>
            <p className="text-sm text-muted-foreground mt-1">Digite sua nova senha abaixo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  minLength={6}
                  className="pl-10 h-11 border-border/60 focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  required
                  minLength={6}
                  className="pl-10 h-11 border-border/60 focus:border-accent"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-medium gap-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-lg shadow-accent/25 transition-all"
            >
              {loading ? "Aguarde..." : "Redefinir Senha"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
