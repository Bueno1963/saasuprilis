import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, ArrowRight, FlaskConical, Building2 } from "lucide-react";
import { toast } from "sonner";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
}

const LoginTenant = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Load tenant by slug
  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url, primary_color")
        .eq("slug", slug)
        .maybeSingle();
      setTenant(data as TenantInfo | null);
      setTenantLoading(false);
    })();
  }, [slug]);

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
    if (!tenant) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Falha ao autenticar");

      // Verify the user belongs to THIS tenant
      const { data: member } = await supabase
        .from("tenant_members")
        .select("role, tenant_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!member || member.tenant_id !== tenant.id) {
        await supabase.auth.signOut();
        toast.error(`Este usuário não pertence ao laboratório ${tenant.name}.`);
        return;
      }

      // Block super_admin from using tenant login (they use /auth)
      if (member.role === "super_admin") {
        await supabase.auth.signOut();
        toast.error("Super Admins SUPRILIS devem usar a tela /auth.");
        navigate("/auth");
        return;
      }

      toast.success(`Bem-vindo ao ${tenant.name}!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando laboratório...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold">Laboratório não encontrado</h1>
          <p className="text-sm text-muted-foreground">
            Não encontramos um laboratório com o identificador <code className="text-foreground">{slug}</code>.
            Verifique a URL ou entre em contato com o administrador do seu laboratório.
          </p>
          <Link to="/saas" className="inline-block text-sm text-primary hover:underline">
            Voltar à página da SUPRILIS
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.primary_color || "#1a73e8";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-[860px] min-h-[480px] rounded-2xl overflow-hidden shadow-2xl border border-border/40">
        {/* Left — Tenant branding */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 60%, ${primaryColor}88 100%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10 flex flex-col justify-between p-7 w-full">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-12 w-auto object-contain bg-white/95 rounded-lg px-3 py-2 self-start" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="space-y-3 max-w-sm">
              <h1 className="text-2xl font-bold text-white leading-tight">{tenant.name}</h1>
              <p className="text-white/75 text-xs leading-relaxed">
                Sistema de Gestão Laboratorial — acesso ao módulo operacional do laboratório.
                Use suas credenciais corporativas para entrar.
              </p>
            </div>
            <p className="text-white/40 text-[10px]">
              Powered by <span className="text-white/60 font-semibold">SUPRILIS</span>
            </p>
          </div>
        </div>

        {/* Right — Form */}
        <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-card">
          <div className="w-full max-w-sm space-y-5">
            <div className="lg:hidden flex flex-col items-center gap-2 mb-2">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <span className="text-sm font-semibold text-foreground">{tenant.name}</span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">
                {isForgotPassword ? "Recuperar Senha" : "Acessar Sistema"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isForgotPassword ? "Digite seu email para receber o link" : `Login dos colaboradores — ${tenant.name}`}
              </p>
            </div>

            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email-recover">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email-recover" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="pl-10 h-11" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 gap-2 rounded-xl">
                  {loading ? "Aguarde..." : "Enviar Link"}
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
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="pl-10 h-11" />
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
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Digite sua senha" required minLength={6} className="pl-10 h-11" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 gap-2 rounded-xl text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading ? "Aguarde..." : "Entrar"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginTenant;
