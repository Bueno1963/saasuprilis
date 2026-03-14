import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FlaskConical, BarChart3, Shield, Zap, Users, FileText, Monitor,
  CheckCircle2, ArrowRight, ChevronDown, ChevronUp, Star, Microscope,
  ClipboardCheck, Send, Phone, Mail, Stethoscope, Cpu, Receipt,
  Clock, Globe, Check, X, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import heroMockupImg from "@/assets/saas-hero-mockup.png";

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  { icon: ClipboardCheck, title: "Gestão Completa do Laboratório", desc: "Controle total de processos, desde o cadastro de pacientes até a entrega de resultados." },
  { icon: FlaskConical, title: "Rastreabilidade de Amostras", desc: "Acompanhe cada amostra em tempo real com código de barras e identificação única." },
  { icon: BarChart3, title: "Relatórios e Indicadores", desc: "Dashboards inteligentes com KPIs para tomada de decisões estratégicas." },
  { icon: Shield, title: "Segurança e Conformidade", desc: "Dados protegidos com criptografia e conformidade com normas regulatórias." },
  { icon: Zap, title: "Agilidade nos Resultados", desc: "Reduza o tempo de entrega de laudos com automação e integração de equipamentos." },
  { icon: Monitor, title: "Portal do Paciente", desc: "Resultados online para pacientes e médicos solicitantes com acesso seguro." },
  { icon: BookOpen, title: "Gestão de POPs", desc: "Controle digital de Procedimentos Operacionais Padrão em conformidade com a RDC da ANVISA." },
];

const modules = [
  { icon: FlaskConical, title: "Análises Clínicas", desc: "Gestão completa de exames laboratoriais" },
  { icon: FileText, title: "Laudos Digitais", desc: "Emissão e assinatura digital de resultados" },
  { icon: Cpu, title: "Interfaceamento", desc: "Conexão direta com equipamentos analíticos" },
  { icon: Stethoscope, title: "Atendimento", desc: "Recepção e triagem inteligente de pacientes" },
];

const benefits = [
  "Redução de até 40% no tempo de entrega de laudos",
  "Integração com mais de 200 equipamentos laboratoriais",
  "Eliminação de erros manuais com automação completa",
  "Suporte técnico especializado 24/7",
  "Implantação rápida e sem complicações",
  "Atualizações contínuas sem custo adicional",
];

const stats = [
  { value: "98%", label: "de satisfação dos clientes" },
  { value: "500+", label: "Laboratórios atendidos" },
  { value: "15+", label: "Anos de experiência" },
  { value: "200+", label: "Equipamentos integrados" },
  { value: "24/7", label: "Suporte disponível" },
];

const plans = [
  {
    name: "Aprendiz",
    price: "171",
    desc: "Ideal para laboratórios e consultórios pequenos que iniciam sua digitalização.",
    tag: null,
    analyses: "A partir de 150 análises/mês",
    users: "Até 2 usuários",
    locations: "1 sede",
    activation: "R$ 3.103",
    activationDiscount: null,
    highlight: false,
  },
  {
    name: "Companheiro",
    price: "498",
    desc: "Para laboratórios em crescimento com workflow completo e entrega digital de resultados.",
    tag: "Mais popular",
    analyses: "A partir de 500 análises/mês",
    users: "Até 5 usuários",
    locations: "1 sede",
    activation: "R$ 2.017",
    activationDiscount: "35%",
    activationOriginal: "R$ 3.103",
    highlight: true,
    discount: "15% desconto por análise",
  },
  {
    name: "Mestre",
    price: "809",
    desc: "Solução completa para redes de laboratórios com alto volume e múltiplas sedes.",
    tag: null,
    analyses: "A partir de 1.000 análises/mês",
    users: "Até 15 usuários",
    locations: "Até 3 sedes",
    activation: "R$ 1.552",
    activationDiscount: "50%",
    activationOriginal: "R$ 3.103",
    highlight: false,
    discount: "30% desconto por análise",
  },
  {
    name: "Laboratório Instalado",
    price: null,
    desc: "Para laboratórios com mais de 1.500 análises/mês e integração sob medida.",
    tag: null,
    analyses: "Desde +1.500 análises/mês",
    users: "Usuários ilimitados",
    locations: "Sedes ilimitadas",
    activation: "Incluída na cotação",
    activationDiscount: null,
    highlight: false,
  },
];

const comparisonFeatures = [
  { name: "Usuários incluídos", values: ["2", "5", "15", "Ilimitados"] },
  { name: "Sedes", values: ["1", "1", "Até 3", "Ilimitadas"] },
  { name: "Interface de equipamentos", values: [false, "Até 3 equipamentos", "Middleware dedicado", "Middleware dedicado"] },
  { name: "LIS (fluxo de laboratório)", values: ["Manual", "Básico", "Completo", "Completo"] },
  { name: "Portal de pacientes", values: ["Básico", "Completo", "Premium", "Premium"] },
  { name: "Portal médico", values: [false, "Completo", "+ Assistente IA", "+ Assistente IA"] },
  { name: "Alertas de valores críticos", values: [false, false, true, true] },
  { name: "Assinatura eletrônica", values: [false, false, true, true] },
  { name: "Marca branca", values: [false, "Logo e cores", "Completa", "Completa"] },
  { name: "Dashboard / Métricas", values: [false, "Operacionais", "Inteligência + KPIs", "Inteligência + KPIs"] },
  { name: "Notificações WhatsApp", values: [false, false, true, true] },
  { name: "Suporte prioritário 24/7", values: [false, false, true, true] },
  { name: "Gestor de conta dedicado", values: [false, false, false, true] },
];

const SaaSLandingPage = () => {
  const navigate = useNavigate();
  const [formSent, setFormSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardForm, setOnboardForm] = useState({
    lab_name: "", cnpj: "", responsible_name: "", email: "", password: "",
  });

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/saas" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-[hsl(210,50%,25%)]">
              Supri<span className="text-[hsl(170,55%,45%)]">LIS</span>
            </span>
            <span className="hidden sm:block text-[10px] text-muted-foreground leading-tight ml-1">Sistema de Gestão<br/>Laboratorial</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#inicio" className="text-muted-foreground hover:text-foreground transition-colors">Início</a>
            <a href="#funcionalidades" className="text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#modulos" className="text-muted-foreground hover:text-foreground transition-colors">Módulos</a>
            <a href="#beneficios" className="text-muted-foreground hover:text-foreground transition-colors">Benefícios</a>
            <a href="#planos" className="text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <a href="#contato" className="text-muted-foreground hover:text-foreground transition-colors">Contato</a>
          </div>
          <a href="#contato">
            <Button size="sm" className="rounded-md px-5 text-sm bg-[hsl(170,55%,45%)] hover:bg-[hsl(170,55%,38%)] text-white font-semibold">
              Fale Conosco
            </Button>
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section id="inicio" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(210,50%,25%)] via-[hsl(200,45%,30%)] to-[hsl(170,55%,45%)]" />
        {/* Decorative wave at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0,80 C360,120 720,40 1440,80 L1440,120 L0,120 Z" fill="white" />
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-sm text-white/90 font-medium">
                Sistema para Laboratórios
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
                SUPRI<span className="text-[hsl(170,55%,55%)]">LIS</span>
              </h1>
              <p className="text-lg text-white/80 leading-relaxed max-w-lg">
                O sistema de gestão laboratorial mais completo do mercado. Automatize processos, reduza erros e entregue resultados com mais rapidez e confiabilidade.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#contato">
                  <Button size="lg" className="rounded-md px-8 h-12 text-base bg-[hsl(170,55%,45%)] hover:bg-[hsl(170,55%,38%)] text-white shadow-lg font-semibold">
                    Solicitar Demonstração
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a href="#funcionalidades">
                  <Button size="lg" variant="outline" className="rounded-md px-8 h-12 text-base border-white/30 text-white hover:bg-white/10">
                    Conhecer Recursos
                  </Button>
                </a>
              </div>
            </div>
            <div className="relative flex justify-center">
              <img
                src={heroMockupImg}
                alt="Sistema SUPRILIS - Dashboard"
                className="w-full max-w-xl rounded-xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section id="funcionalidades" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-2xl md:text-3xl font-bold">
              Funcionalidades que <span className="text-[hsl(170,55%,45%)]">transformam</span> seu laboratório
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tecnologia de ponta para otimizar cada etapa do fluxo laboratorial
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl border border-border/50 bg-white hover:shadow-lg hover:border-[hsl(170,55%,45%)]/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[hsl(170,55%,45%)]/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-[hsl(170,55%,45%)]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Módulos ── */}
      <section id="modulos" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-2xl md:text-3xl font-bold">
              Módulos do <span className="text-[hsl(170,55%,45%)]">SUPRILIS</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Soluções integradas para cada necessidade do seu laboratório
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((m) => (
              <div key={m.title} className="p-6 rounded-xl bg-white border border-border/50 hover:shadow-lg transition-all text-center">
                <div className="w-14 h-14 rounded-full bg-[hsl(170,55%,45%)]/10 flex items-center justify-center mx-auto mb-4">
                  <m.icon className="w-7 h-7 text-[hsl(170,55%,45%)]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefícios ── */}
      <section id="beneficios" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">
                Por que escolher o <span className="text-[hsl(170,55%,45%)]">SUPRILIS</span>?
              </h2>
              <p className="text-muted-foreground">
                Mais do que um sistema, uma parceria para o crescimento do seu laboratório.
              </p>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[hsl(170,55%,45%)] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="p-5 rounded-xl bg-[hsl(210,50%,25%)] text-center">
                  <p className="text-2xl md:text-3xl font-bold text-[hsl(170,55%,55%)]">{s.value}</p>
                  <p className="text-xs text-white/70 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Planos ── */}
      <section id="planos" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-2xl md:text-3xl font-bold">
              Planos <span className="text-[hsl(170,55%,45%)]">SUPRILIS</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gerencie todo o fluxo do laboratório: da amostra ao resultado. Escolha o plano ideal para o seu volume.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-xl border p-6 flex flex-col transition-all relative",
                  plan.highlight
                    ? "border-[hsl(170,55%,45%)] bg-white shadow-xl scale-[1.02]"
                    : "border-border/50 bg-white hover:shadow-md"
                )}
              >
                {plan.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[hsl(170,55%,45%)] text-white text-xs font-semibold whitespace-nowrap">
                    {plan.tag}
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
                </div>
                <div className="mb-1 text-xs text-muted-foreground">Taxa mínima mensal</div>
                <div className="mb-2">
                  {plan.price ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold">—</span>
                  )}
                </div>
                {(plan as any).discount && (
                  <span className="text-xs text-[hsl(170,55%,45%)] font-semibold mb-2">{(plan as any).discount}</span>
                )}
                <ul className="space-y-2 mb-6 flex-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[hsl(170,55%,45%)] shrink-0" />{plan.analyses}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[hsl(170,55%,45%)] shrink-0" />{plan.users}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[hsl(170,55%,45%)] shrink-0" />{plan.locations}</li>
                </ul>
                <a href="#contato">
                  <Button
                    className={cn(
                      "w-full rounded-md h-10",
                      plan.highlight
                        ? "bg-[hsl(170,55%,45%)] hover:bg-[hsl(170,55%,38%)] text-white"
                        : ""
                    )}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.price ? "Começar" : "Contatar vendas"}
                  </Button>
                </a>
                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-xs text-muted-foreground">Ativação e Implementação</p>
                  <div className="mt-1">
                    {plan.activationDiscount ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold">{plan.activation}</span>
                        <span className="text-xs bg-[hsl(170,55%,45%)]/10 text-[hsl(170,55%,45%)] px-1.5 py-0.5 rounded font-semibold">-{plan.activationDiscount}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold">{plan.activation}</span>
                    )}
                    {(plan as any).activationOriginal && (
                      <p className="text-xs text-muted-foreground line-through">{(plan as any).activationOriginal}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Comparison Table ── */}
          <div className="mt-16">
            <h3 className="text-xl font-bold text-center mb-6">Comparação de funcionalidades</h3>
            <p className="text-center text-xs text-muted-foreground mb-4">← Deslize para ver todos os planos →</p>
            <div className="overflow-x-auto rounded-xl border border-border/50 bg-white">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold">Funcionalidade</th>
                    <th className="text-center p-4 font-semibold">
                      Aprendiz<br /><span className="text-xs text-muted-foreground font-normal">R$ 171/mês</span>
                    </th>
                    <th className="text-center p-4 font-semibold bg-[hsl(170,55%,45%)]/5">
                      Companheiro<br /><span className="text-xs text-muted-foreground font-normal">R$ 498/mês</span>
                    </th>
                    <th className="text-center p-4 font-semibold">
                      Mestre<br /><span className="text-xs text-muted-foreground font-normal">R$ 809/mês</span>
                    </th>
                    <th className="text-center p-4 font-semibold">
                      Lab Instalado<br /><span className="text-xs text-muted-foreground font-normal">Personalizado</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feat, idx) => (
                    <tr key={feat.name} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="p-4 font-medium">{feat.name}</td>
                      {feat.values.map((val, i) => (
                        <td key={i} className={cn("p-4 text-center", i === 1 && "bg-[hsl(170,55%,45%)]/5")}>
                          {val === true ? (
                            <Check className="w-5 h-5 text-[hsl(170,55%,45%)] mx-auto" />
                          ) : val === false ? (
                            <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                          ) : (
                            <span className="text-sm text-muted-foreground">{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA + Cadastro ── */}
      <section id="contato" className="py-20 md:py-28 bg-gradient-to-br from-[hsl(210,50%,25%)] to-[hsl(200,45%,30%)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-4 mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Comece agora — 14 dias grátis
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Cadastre seu laboratório e experimente o SupriLIS sem compromisso. Sem cartão de crédito.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/60 pt-2">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[hsl(170,55%,55%)]" />Trial gratuito de 14 dias</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[hsl(170,55%,55%)]" />Sem cartão de crédito</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[hsl(170,55%,55%)]" />Suporte na implantação</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-white/80">
                <Phone className="w-5 h-5 text-[hsl(170,55%,55%)]" />
                <span>(11) 0000-0000</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Mail className="w-5 h-5 text-[hsl(170,55%,55%)]" />
                <span>contato@suprilis.com.br</span>
              </div>
            </div>

            <div className="p-8 rounded-xl bg-white shadow-2xl">
              <h3 className="text-lg font-bold mb-6">Cadastre seu laboratório</h3>
              {formSent ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-[hsl(170,55%,45%)] mx-auto" />
                  <h3 className="text-xl font-bold">Laboratório criado com sucesso!</h3>
                  <p className="text-muted-foreground text-sm">Seu trial de 14 dias começou. Redirecionando para o sistema...</p>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (onboardForm.password.length < 6) {
                      toast.error("A senha deve ter no mínimo 6 caracteres");
                      return;
                    }
                    setIsSubmitting(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("onboard-tenant", {
                        body: onboardForm,
                      });
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      setFormSent(true);
                      toast.success("Laboratório criado! Fazendo login...");
                      // Auto-login
                      const { error: loginErr } = await supabase.auth.signInWithPassword({
                        email: onboardForm.email,
                        password: onboardForm.password,
                      });
                      if (!loginErr) {
                        setTimeout(() => navigate("/"), 2000);
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Erro ao criar laboratório");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Nome do Laboratório *</label>
                      <Input
                        placeholder="Laboratório São Paulo"
                        required
                        value={onboardForm.lab_name}
                        onChange={(e) => setOnboardForm({ ...onboardForm, lab_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">CNPJ</label>
                      <Input
                        placeholder="00.000.000/0000-00"
                        value={onboardForm.cnpj}
                        onChange={(e) => setOnboardForm({ ...onboardForm, cnpj: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Responsável *</label>
                    <Input
                      placeholder="Nome do responsável técnico"
                      required
                      value={onboardForm.responsible_name}
                      onChange={(e) => setOnboardForm({ ...onboardForm, responsible_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">E-mail *</label>
                      <Input
                        type="email"
                        placeholder="admin@seulab.com.br"
                        required
                        value={onboardForm.email}
                        onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Senha *</label>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                        value={onboardForm.password}
                        onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-md h-12 text-base bg-[hsl(170,55%,45%)] hover:bg-[hsl(170,55%,38%)] text-white font-semibold"
                  >
                    {isSubmitting ? "Criando..." : "Criar Laboratório — Grátis por 14 dias"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Ao se cadastrar, você concorda com nossos termos de uso.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[hsl(210,50%,15%)] text-white py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold">
                Supri<span className="text-[hsl(170,55%,55%)]">LIS</span>
              </span>
              <span className="text-xs text-white/40 ml-2">Sistema de Gestão Laboratorial</span>
            </div>
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} SupriLIS — Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SaaSLandingPage;
