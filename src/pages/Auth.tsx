import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import suprilisLogo from "@/assets/logo-suprilis.png";

const Auth = () => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Digite seu email");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Email de recuperação enviado!");
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Falha ao autenticar");

      // Verify super_admin role — block everyone else
      const { data: member } = await supabase
        .from("tenant_members")
        .select("role, tenant_id, tenants(slug, name)")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (member?.role !== "super_admin") {
        await supabase.auth.signOut();
        const slug = (member?.tenants as any)?.slug;
        toast.error(
          slug
            ? `Acesso restrito ao Super Admin SUPRILIS. Use o login do seu laboratório: /login/${slug}`
            : "Acesso restrito ao Super Admin SUPRILIS."
        );
        return;
      }

      toast.success("Bem-vindo, Super Admin SUPRILIS!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-[860px] min-h-[480px] rounded-2xl overflow-hidden shadow-2xl border border-border/40">
        {/* Left Panel — SUPRILIS Branding */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(215,32%,38%)] via-[hsl(195,38%,42%)] to-[hsl(170,55%,45%)]" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10 flex flex-col justify-between p-7 w-full">
            <img src={suprilisLogo} alt="SUPRILIS" className="h-12 w-auto object-contain bg-white/95 rounded-lg px-3 py-2 self-start" />
            <div className="space-y-3 max-w-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
                Super Admin SUPRILIS
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">
                Painel da{" "}
                <span className="text-[hsl(170,80%,80%)]">Plataforma SaaS</span>
              </h1>
              <p className="text-white/75 text-xs leading-relaxed">
                Acesso exclusivo ao painel de gestão SUPRILIS — controle de laboratórios-clientes,
                planos, faturamento e métricas globais. Cada laboratório possui sua própria URL de
                acesso (<code className="text-white/90">/login/[slug]</code>).
              </p>
            </div>
            <p className="text-white/40 text-[10px]">© 2026 SUPRILIS — Todos os direitos reservados</p>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-card">
          <div className="w-full max-w-sm space-y-5">
            <div className="lg:hidden flex justify-center mb-2">
              <img src={suprilisLogo} alt="SUPRILIS" className="h-10 w-auto object-contain" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold mb-2">
                <ShieldCheck className="w-3 h-3" />
                Acesso restrito
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {isForgotPassword ? "Recuperar Senha" : "Super Admin SUPRILIS"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isForgotPassword
                  ? "Digite seu email para receber o link de recuperação"
                  : "Painel da plataforma SaaS — acesso exclusivo ao time SUPRILIS"}
              </p>
            </div>

            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email-recover">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-recover"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Digite seu email"
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 gap-2 rounded-xl">
                  {loading ? "Aguarde..." : "Enviar Link de Recuperação"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setIsForgotPassword(false)} className="text-sm text-primary hover:underline">
                    Voltar ao login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="superadmin@suprilis.com.br"
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-accent hover:underline">
                      Esqueci minha senha
                    </button>
                  </div>
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
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 gap-2 rounded-xl bg-[hsl(170,55%,45%)] hover:bg-[hsl(170,55%,38%)]">
                  {loading ? "Aguarde..." : "Entrar no Painel"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>

                <div className="pt-3 border-t border-border/40 space-y-2 text-center">
                  <p className="text-xs text-muted-foreground">É usuário de um laboratório?</p>
                  <Link to="/saas" className="text-xs text-accent hover:underline">
                    Acesse pela URL do seu laboratório (/login/[slug])
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
