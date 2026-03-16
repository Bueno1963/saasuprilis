import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FlaskConical, BarChart3, Shield, Zap, Users, FileText, Monitor,
  CheckCircle2, ArrowRight, ChevronDown, Star, Microscope,
  ClipboardCheck, Send, Phone, Mail, Stethoscope, Cpu, Receipt,
  Clock, Globe, Check, X, BookOpen, Sparkles, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import heroMockupImg from "@/assets/saas-hero-mockup.png";

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  { icon: ClipboardCheck, title: "Gestão Completa", desc: "Controle total de processos, do cadastro de pacientes à entrega de resultados." },
  { icon: FlaskConical, title: "Rastreabilidade", desc: "Acompanhe cada amostra em tempo real com código de barras e identificação única." },
  { icon: BarChart3, title: "Relatórios Inteligentes", desc: "Dashboards com KPIs para tomada de decisões estratégicas." },
  { icon: Shield, title: "Segurança & LGPD", desc: "Dados protegidos com criptografia e conformidade regulatória." },
  { icon: Zap, title: "Agilidade Total", desc: "Reduza o tempo de entrega de laudos com automação e integração." },
  { icon: Monitor, title: "Portal Online", desc: "Resultados online para pacientes e médicos com acesso seguro." },
  { icon: BookOpen, title: "Gestão de POPs", desc: "Controle digital de POPs em conformidade com a RDC da ANVISA." },
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
  { value: "98%", label: "Satisfação" },
  { value: "500+", label: "Laboratórios" },
  { value: "15+", label: "Anos" },
  { value: "200+", label: "Equipamentos" },
];

const plans = [
  {
    name: "Aprendiz",
    price: "171",
    desc: "Para laboratórios que iniciam sua digitalização.",
    tag: null,
    analyses: "150 análises/mês",
    users: "2 usuários",
    locations: "1 sede",
    activation: "R$ 3.103",
    activationDiscount: null,
    highlight: false,
  },
  {
    name: "Companheiro",
    price: "498",
    desc: "Workflow completo e entrega digital de resultados.",
    tag: "Mais popular",
    analyses: "500 análises/mês",
    users: "5 usuários",
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
    desc: "Para redes com alto volume e múltiplas sedes.",
    tag: null,
    analyses: "1.000 análises/mês",
    users: "15 usuários",
    locations: "Até 3 sedes",
    activation: "R$ 1.552",
    activationDiscount: "50%",
    activationOriginal: "R$ 3.103",
    highlight: false,
    discount: "30% desconto por análise",
  },
  {
    name: "Lab Instalado",
    price: null,
    desc: "Integração sob medida para +1.500 análises/mês.",
    tag: null,
    analyses: "+1.500 análises/mês",
    users: "Ilimitados",
    locations: "Ilimitadas",
    activation: "Na cotação",
    activationDiscount: null,
    highlight: false,
  },
];

const comparisonFeatures = [
  { name: "Usuários incluídos", values: ["2", "5", "15", "Ilimitados"] },
  { name: "Sedes", values: ["1", "1", "Até 3", "Ilimitadas"] },
  { name: "Interface de equipamentos", values: [false, "Até 3", "Middleware", "Middleware"] },
  { name: "LIS (fluxo de laboratório)", values: ["Manual", "Básico", "Completo", "Completo"] },
  { name: "Portal de pacientes", values: ["Básico", "Completo", "Premium", "Premium"] },
  { name: "Portal médico", values: [false, "Completo", "+ IA", "+ IA"] },
  { name: "Alertas de valores críticos", values: [false, false, true, true] },
  { name: "Assinatura eletrônica", values: [false, false, true, true] },
  { name: "Marca branca", values: [false, "Logo/cores", "Completa", "Completa"] },
  { name: "Dashboard / Métricas", values: [false, "Operacionais", "KPIs + IA", "KPIs + IA"] },
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
    <div className="min-h-screen bg-[hsl(220,20%,4%)] font-sans text-white overflow-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[hsl(220,20%,6%)]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/saas" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(170,55%,45%)] to-[hsl(170,70%,35%)] flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              Supri<span className="text-[hsl(170,55%,55%)]">LIS</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#inicio" className="text-white/50 hover:text-white transition-colors">Início</a>
            <a href="#funcionalidades" className="text-white/50 hover:text-white transition-colors">Recursos</a>
            <a href="#modulos" className="text-white/50 hover:text-white transition-colors">Módulos</a>
            <a href="#planos" className="text-white/50 hover:text-white transition-colors">Planos</a>
            <a href="#contato" className="text-white/50 hover:text-white transition-colors">Contato</a>
          </div>
          <a href="#contato">
            <Button size="sm" className="rounded-full px-5 text-sm bg-gradient-to-r from-[hsl(170,55%,45%)] to-[hsl(170,70%,40%)] hover:opacity-90 text-white font-semibold border-0 shadow-[0_0_20px_hsl(170,55%,45%,0.3)]">
              Começar Grátis
            </Button>
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section id="inicio" className="relative pt-20 pb-32 md:pt-28 md:pb-40">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[hsl(170,55%,45%)]/[0.08] blur-[120px] animate-[pulse_6s_ease-in-out_infinite]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-[hsl(220,60%,50%)]/[0.06] blur-[100px] animate-[pulse_8s_ease-in-out_infinite_2s]" />
          <div className="absolute -bottom-20 left-1/3 w-[350px] h-[350px] rounded-full bg-[hsl(280,50%,50%)]/[0.05] blur-[100px] animate-[pulse_7s_ease-in-out_infinite_1s]" />
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="animate-fade-in [animation-duration:0.5s]">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-[hsl(170,55%,60%)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sistema de Gestão Laboratorial
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight animate-fade-in [animation-duration:0.7s] [animation-delay:0.1s] [animation-fill-mode:backwards]">
                SUPRI
                <span className="bg-gradient-to-r from-[hsl(170,55%,55%)] via-[hsl(170,65%,50%)] to-[hsl(190,60%,50%)] bg-clip-text text-transparent">
                  LIS
                </span>
              </h1>

              <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-lg animate-fade-in [animation-duration:0.7s] [animation-delay:0.2s] [animation-fill-mode:backwards]">
                O sistema de gestão laboratorial mais completo do mercado. Automatize processos, reduza erros e entregue resultados com velocidade.
              </p>

              <div className="flex flex-wrap gap-4 pt-2 animate-fade-in [animation-duration:0.7s] [animation-delay:0.3s] [animation-fill-mode:backwards]">
                <a href="#contato">
                  <Button size="lg" className="rounded-full px-8 h-14 text-base bg-gradient-to-r from-[hsl(170,55%,45%)] to-[hsl(170,70%,40%)] text-white shadow-[0_0_40px_hsl(170,55%,45%,0.3)] font-bold border-0 hover:opacity-90 hover-scale">
                    Começar Grátis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a href="#funcionalidades">
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base border border-white/10 text-white/70 bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.08] hover-scale font-semibold">
                    <Play className="w-4 h-4 mr-2" />
                    Ver Demo
                  </Button>
                </a>
              </div>

              {/* Inline stats */}
              <div className="flex gap-8 pt-4 animate-fade-in [animation-duration:0.7s] [animation-delay:0.4s] [animation-fill-mode:backwards]">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-extrabold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{s.value}</p>
                    <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup with glassmorphism frame */}
            <div className="relative flex justify-center animate-fade-in [animation-duration:0.8s] [animation-delay:0.3s] [animation-fill-mode:backwards]">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(170,55%,45%)]/20 to-[hsl(220,60%,50%)]/10 rounded-2xl blur-2xl" />
              <div className="relative p-2 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/[0.1] shadow-2xl">
                <img
                  src={heroMockupImg}
                  alt="Sistema SUPRILIS - Dashboard"
                  className="w-full max-w-xl rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section id="funcionalidades" className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(170,55%,55%)]">Recursos</span>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Tudo que seu laboratório <span className="bg-gradient-to-r from-[hsl(170,55%,55%)] to-[hsl(190,60%,50%)] bg-clip-text text-transparent">precisa</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Tecnologia de ponta para otimizar cada etapa do fluxo laboratorial
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.06] hover:border-[hsl(170,55%,45%)]/20 transition-all duration-300 hover:shadow-[0_8px_32px_hsl(170,55%,45%,0.08)]"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(170,55%,45%)]/20 to-[hsl(170,55%,45%)]/5 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_hsl(170,55%,45%,0.15)] transition-shadow duration-300">
                  <f.icon className="w-6 h-6 text-[hsl(170,55%,55%)]" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white/90">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Módulos ── */}
      <section id="modulos" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(170,55%,55%)]">Módulos</span>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Soluções <span className="bg-gradient-to-r from-[hsl(170,55%,55%)] to-[hsl(190,60%,50%)] bg-clip-text text-transparent">integradas</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {modules.map((m) => (
              <div key={m.title} className="group relative p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-300 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(170,55%,45%)]/15 to-[hsl(220,60%,50%)]/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  <m.icon className="w-7 h-7 text-[hsl(170,55%,55%)]" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white/90">{m.title}</h3>
                <p className="text-sm text-white/40">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefícios ── */}
      <section id="beneficios" className="relative py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(170,55%,55%)]">Vantagens</span>
                <h2 className="text-3xl md:text-4xl font-extrabold mt-3">
                  Por que escolher o <span className="bg-gradient-to-r from-[hsl(170,55%,55%)] to-[hsl(190,60%,50%)] bg-clip-text text-transparent">SUPRILIS</span>?
                </h2>
              </div>
              <ul className="space-y-4">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm group">
                    <div className="w-6 h-6 rounded-full bg-[hsl(170,55%,45%)]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[hsl(170,55%,45%)]/20 transition-colors">
                      <Check className="w-3.5 h-3.5 text-[hsl(170,55%,55%)]" />
                    </div>
                    <span className="text-white/60 group-hover:text-white/80 transition-colors">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <div key={s.label} className="p-6 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] text-center hover:bg-white/[0.07] transition-all duration-300">
                  <p className="text-3xl md:text-4xl font-extrabold bg-gradient-to-br from-[hsl(170,55%,55%)] to-[hsl(190,60%,50%)] bg-clip-text text-transparent">{s.value}</p>
                  <p className="text-xs text-white/40 mt-2">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Planos ── */}
      <section id="planos" className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(170,55%,45%)]/[0.02] to-transparent pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(170,55%,55%)]">Preços</span>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Planos <span className="bg-gradient-to-r from-[hsl(170,55%,55%)] to-[hsl(190,60%,50%)] bg-clip-text text-transparent">SUPRILIS</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Da amostra ao resultado. Escolha o plano ideal para o seu volume.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-2xl p-6 flex flex-col transition-all duration-300 relative",
                  plan.highlight
                    ? "bg-gradient-to-b from-[hsl(170,55%,45%)]/10 to-white/[0.04] border-[hsl(170,55%,45%)]/30 border shadow-[0_0_40px_hsl(170,55%,45%,0.1)] scale-[1.02]"
                    : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]"
                )}
              >
                {plan.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[hsl(170,55%,45%)] to-[hsl(170,70%,40%)] text-white text-xs font-bold whitespace-nowrap shadow-[0_0_20px_hsl(170,55%,45%,0.4)]">
                    {plan.tag}
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-white/90">{plan.name}</h3>
                  <p className="text-xs text-white/30 mt-1">{plan.desc}</p>
                </div>
                <div className="mb-1 text-[10px] text-white/30 uppercase tracking-wider">Taxa mensal</div>
                <div className="mb-3">
                  {plan.price ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-white/40">R$</span>
                      <span className="text-4xl font-extrabold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{plan.price}</span>
                      <span className="text-sm text-white/40">/mês</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-white/50">Personalizado</span>
                  )}
                </div>
                {(plan as any).discount && (
                  <span className="text-xs text-[hsl(170,55%,55%)] font-semibold mb-3">{(plan as any).discount}</span>
                )}
                <ul className="space-y-2.5 mb-6 flex-1 text-sm">
                  <li className="flex items-center gap-2 text-white/50"><Check className="w-4 h-4 text-[hsl(170,55%,55%)] shrink-0" />{plan.analyses}</li>
                  <li className="flex items-center gap-2 text-white/50"><Check className="w-4 h-4 text-[hsl(170,55%,55%)] shrink-0" />{plan.users}</li>
                  <li className="flex items-center gap-2 text-white/50"><Check className="w-4 h-4 text-[hsl(170,55%,55%)] shrink-0" />{plan.locations}</li>
                </ul>
                <a href="#contato">
                  <Button
                    className={cn(
                      "w-full rounded-full h-11 font-semibold",
                      plan.highlight
                        ? "bg-gradient-to-r from-[hsl(170,55%,45%)] to-[hsl(170,70%,40%)] text-white border-0 shadow-[0_0_20px_hsl(170,55%,45%,0.3)]"
                        : "bg-white/[0.06] text-white/70 border border-white/10 hover:bg-white/[0.1]"
                    )}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.price ? "Começar" : "Contatar vendas"}
                  </Button>
                </a>
                <div className="mt-4 pt-4 border-t border-white/[0.06] text-center">
                  <p className="text-[10px] text-white/25 uppercase tracking-wider">Ativação</p>
                  <div className="mt-1">
                    {plan.activationDiscount ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-white/70">{plan.activation}</span>
                        <span className="text-xs bg-[hsl(170,55%,45%)]/15 text-[hsl(170,55%,55%)] px-2 py-0.5 rounded-full font-bold">-{plan.activationDiscount}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-white/50">{plan.activation}</span>
                    )}
                    {(plan as any).activationOriginal && (
                      <p className="text-xs text-white/20 line-through">{(plan as any).activationOriginal}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Comparison Table ── */}
          <div className="mt-20">
            <h3 className="text-xl font-bold text-center mb-8 text-white/80">Comparação de funcionalidades</h3>
            <p className="text-center text-xs text-white/25 mb-4">← Deslize para ver todos os planos →</p>
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left p-4 font-semibold text-white/60">Funcionalidade</th>
                    <th className="text-center p-4 font-semibold text-white/60">
                      Aprendiz<br /><span className="text-xs text-white/25 font-normal">R$ 171/mês</span>
                    </th>
                    <th className="text-center p-4 font-semibold text-white/80 bg-[hsl(170,55%,45%)]/[0.05]">
                      Companheiro<br /><span className="text-xs text-white/30 font-normal">R$ 498/mês</span>
                    </th>
                    <th className="text-center p-4 font-semibold text-white/60">
                      Mestre<br /><span className="text-xs text-white/25 font-normal">R$ 809/mês</span>
                    </th>
                    <th className="text-center p-4 font-semibold text-white/60">
                      Lab Instalado<br /><span className="text-xs text-white/25 font-normal">Personalizado</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feat, idx) => (
                    <tr key={feat.name} className={cn("border-b border-white/[0.04]", idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]")}>
                      <td className="p-4 font-medium text-white/50">{feat.name}</td>
                      {feat.values.map((val, i) => (
                        <td key={i} className={cn("p-4 text-center", i === 1 && "bg-[hsl(170,55%,45%)]/[0.05]")}>
                          {val === true ? (
                            <Check className="w-5 h-5 text-[hsl(170,55%,55%)] mx-auto" />
                          ) : val === false ? (
                            <X className="w-4 h-4 text-white/10 mx-auto" />
                          ) : (
                            <span className="text-sm text-white/40">{val}</span>
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
      <section id="contato" className="relative py-24 md:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(170,55%,45%)]/[0.06] blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(220,60%,50%)]/[0.04] blur-[100px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(170,55%,55%)]">Comece agora</span>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              14 dias <span className="bg-gradient-to-r from-[hsl(170,55%,55%)] to-[hsl(190,60%,50%)] bg-clip-text text-transparent">grátis</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Cadastre seu laboratório e experimente o SupriLIS sem compromisso.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/35 pt-2">
              <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[hsl(170,55%,55%)]" />Trial gratuito</span>
              <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[hsl(170,55%,55%)]" />Sem cartão</span>
              <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[hsl(170,55%,55%)]" />Suporte incluso</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 pt-8">
              <div className="flex items-center gap-3 text-white/50">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[hsl(170,55%,55%)]" />
                </div>
                <span>(11) 0000-0000</span>
              </div>
              <div className="flex items-center gap-3 text-white/50">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[hsl(170,55%,55%)]" />
                </div>
                <span>contato@suprilis.com.br</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <h3 className="text-lg font-bold mb-6 text-white/90">Cadastre seu laboratório</h3>
              {formSent ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[hsl(170,55%,45%)]/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-[hsl(170,55%,55%)]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Laboratório criado!</h3>
                  <p className="text-white/40 text-sm">Seu trial de 14 dias começou. Redirecionando...</p>
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
                      <label className="text-sm font-medium mb-1.5 block text-white/60">Nome do Laboratório *</label>
                      <Input
                        placeholder="Laboratório São Paulo"
                        required
                        value={onboardForm.lab_name}
                        onChange={(e) => setOnboardForm({ ...onboardForm, lab_name: e.target.value })}
                        className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(170,55%,45%)]/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block text-white/60">CNPJ</label>
                      <Input
                        placeholder="00.000.000/0000-00"
                        value={onboardForm.cnpj}
                        onChange={(e) => setOnboardForm({ ...onboardForm, cnpj: e.target.value })}
                        className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(170,55%,45%)]/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block text-white/60">Responsável *</label>
                    <Input
                      placeholder="Nome do responsável técnico"
                      required
                      value={onboardForm.responsible_name}
                      onChange={(e) => setOnboardForm({ ...onboardForm, responsible_name: e.target.value })}
                      className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(170,55%,45%)]/50"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block text-white/60">E-mail *</label>
                      <Input
                        type="email"
                        placeholder="admin@seulab.com.br"
                        required
                        value={onboardForm.email}
                        onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                        className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(170,55%,45%)]/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block text-white/60">Senha *</label>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                        value={onboardForm.password}
                        onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                        className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-[hsl(170,55%,45%)]/50"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full h-12 text-base bg-gradient-to-r from-[hsl(170,55%,45%)] to-[hsl(170,70%,40%)] text-white font-bold border-0 shadow-[0_0_30px_hsl(170,55%,45%,0.3)] hover:opacity-90"
                  >
                    {isSubmitting ? "Criando..." : "Criar Laboratório — Grátis 14 dias"}
                  </Button>
                  <p className="text-xs text-center text-white/20">
                    Ao se cadastrar, você concorda com nossos termos de uso.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(170,55%,45%)] to-[hsl(170,70%,35%)] flex items-center justify-center">
                <FlaskConical className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-lg font-extrabold">
                Supri<span className="text-[hsl(170,55%,55%)]">LIS</span>
              </span>
            </div>
            <p className="text-xs text-white/20">
              © {new Date().getFullYear()} SupriLIS — Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SaaSLandingPage;
