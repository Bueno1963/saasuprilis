import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FlaskConical,
  BarChart3,
  Shield,
  Zap,
  Users,
  FileText,
  Monitor,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Star,
  Microscope,
  ClipboardCheck,
  Thermometer,
  Send,
  Phone,
  Mail,
  Clock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import saasHeroImg from "@/assets/saas-hero-mockup.png";

/* ──────────────────────────── DATA ──────────────────────────── */

const features = [
  { icon: ClipboardCheck, title: "Recepção & Cadastro", desc: "Cadastro de pacientes, pedidos, agendamento online e gestão de convênios em uma interface unificada." },
  { icon: FlaskConical, title: "Worklist & Amostras", desc: "Rastreabilidade total da amostra com código de barras, controle de temperatura e não-conformidades." },
  { icon: BarChart3, title: "Controle de Qualidade", desc: "Gráficos de Levey-Jennings, regras de Westgard e alertas automáticos para desvios." },
  { icon: FileText, title: "Laudos & Resultados", desc: "Validação técnica, liberação com assinatura digital e portal online para pacientes e médicos." },
  { icon: Monitor, title: "Portais Online", desc: "Portal do Paciente e Portal do Médico para consulta de resultados em tempo real, compatível com LGPD." },
  { icon: Shield, title: "LGPD & Segurança", desc: "Isolamento multi-tenant, auditoria completa, controle de acesso baseado em papéis (RBAC)." },
];

const phases = [
  { color: "hsl(38,92%,50%)", label: "Pré-Analítica", items: ["Recepção", "Cadastro", "Agendamento", "Coleta", "Triagem"] },
  { color: "hsl(205,78%,45%)", label: "Analítica", items: ["Worklist", "Interfaceamento", "CQ Interno", "Digitação", "Revisão"] },
  { color: "hsl(152,60%,40%)", label: "Pós-Analítica", items: ["Validação", "Liberação", "Laudo PDF", "Portal Online", "Faturamento"] },
];

const plans = [
  {
    name: "Starter",
    price: "299",
    desc: "Para laboratórios iniciando a digitalização",
    limit: "Até 500 exames/mês",
    features: ["Cadastro de pacientes e pedidos", "Worklist e rastreabilidade", "Laudos em PDF", "Portal do Paciente", "Suporte por email"],
    highlight: false,
  },
  {
    name: "Professional",
    price: "599",
    desc: "Para laboratórios em crescimento",
    limit: "Até 2.000 exames/mês",
    features: ["Tudo do Starter", "Portal do Médico", "Controle de Qualidade completo", "Financeiro integrado", "Integrações HL7/ASTM", "Suporte prioritário"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    desc: "Para redes e grandes laboratórios",
    limit: "Exames ilimitados",
    features: ["Tudo do Professional", "Multi-unidades", "Branding personalizado", "API dedicada", "SLA garantido", "Gerente de conta dedicado"],
    highlight: false,
  },
];

const testimonials = [
  { name: "Dra. Camila Reis", role: "Diretora Técnica — LabVida", text: "Desde que migramos para o SupriLIS, nosso tempo de liberação de laudos caiu 60%. A rastreabilidade é impecável.", stars: 5 },
  { name: "Dr. Rafael Mendes", role: "Patologista Clínico — LabExcel", text: "O controle de qualidade integrado e os alertas automáticos nos dão uma tranquilidade enorme na rotina analítica.", stars: 5 },
  { name: "Ana Paula Ferreira", role: "Gerente Administrativa — DiagCenter", text: "O módulo financeiro e o faturamento de convênios simplificaram muito nossa operação. Recomendo sem ressalvas.", stars: 5 },
];

const faqItems = [
  { q: "Quanto tempo leva para implantar?", a: "A implantação básica leva de 3 a 7 dias úteis. Nossa equipe cuida de toda a configuração, migração de dados e treinamento da equipe." },
  { q: "Preciso instalar algo nos computadores?", a: "Não! O SupriLIS é 100% web (SaaS). Basta um navegador moderno e conexão com a internet. Funciona em qualquer dispositivo." },
  { q: "Meus dados ficam seguros?", a: "Sim. Utilizamos criptografia de ponta, isolamento de dados por laboratório (multi-tenant), backups automáticos e estamos em conformidade com a LGPD." },
  { q: "Posso migrar meus dados de outro sistema?", a: "Sim! Oferecemos serviço de migração assistida para importar pacientes, exames e histórico do seu sistema atual." },
  { q: "Existe contrato de fidelidade?", a: "Não. Nossos planos são mensais sem fidelidade. Você pode cancelar a qualquer momento sem multa." },
];

/* ──────────────────────────── COMPONENT ──────────────────────────── */

const SaaSLandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formSent, setFormSent] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/saas" className="flex items-center gap-2">
            <Microscope className="w-7 h-7 text-[hsl(205,78%,45%)]" />
            <span className="text-lg font-bold text-foreground tracking-tight">
              Supri<span className="text-[hsl(205,78%,45%)]">LIS</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#planos" className="text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <a href="#depoimentos" className="text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#contato" className="text-muted-foreground hover:text-foreground transition-colors">Contato</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-sm">Entrar</Button>
            </Link>
            <a href="#contato">
              <Button size="sm" className="rounded-full px-5 text-sm bg-[hsl(205,78%,45%)] hover:bg-[hsl(205,78%,40%)] text-white">
                Teste Grátis
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(205,78%,20%)]/5 via-transparent to-[hsl(205,78%,45%)]/5" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(205,78%,45%)]/10 border border-[hsl(205,78%,45%)]/20 text-sm text-[hsl(205,78%,45%)] font-medium">
                <Zap className="w-3.5 h-3.5" />
                Sistema 100% na nuvem
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight">
                O sistema laboratorial que{" "}
                <span className="text-[hsl(205,78%,45%)]">acelera seus resultados</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Gerencie todo o ciclo laboratorial — da recepção ao laudo — com rastreabilidade total, 
                controle de qualidade integrado e portais online para pacientes e médicos.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#contato">
                  <Button size="lg" className="rounded-full px-8 h-12 text-base bg-[hsl(205,78%,45%)] hover:bg-[hsl(205,78%,40%)] text-white shadow-lg">
                    Começar Agora
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a href="#como-funciona">
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base">
                    Ver Demonstração
                  </Button>
                </a>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[hsl(152,60%,40%)]" /> 14 dias grátis</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[hsl(152,60%,40%)]" /> Sem cartão</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[hsl(152,60%,40%)]" /> Suporte incluso</span>
              </div>
            </div>
            <div className="relative">
              <img
                src={saasHeroImg}
                alt="SupriLIS Dashboard"
                className="w-full max-w-lg mx-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-[hsl(210,50%,15%)] py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "150+", label: "Laboratórios" },
            { value: "2M+", label: "Laudos emitidos" },
            { value: "99.9%", label: "Uptime" },
            { value: "< 2s", label: "Tempo de resposta" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-white/60 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Tudo que seu laboratório precisa em um só lugar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Do cadastro de pacientes à emissão de laudos, cobrimos todas as fases do processo laboratorial.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:border-[hsl(205,78%,45%)]/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[hsl(205,78%,45%)]/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-[hsl(205,78%,45%)]" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como Funciona (phases) ── */}
      <section id="como-funciona" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Fluxo laboratorial completo
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cobertura de ponta a ponta em todas as fases do processo laboratorial.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {phases.map((phase, idx) => (
              <div key={phase.label} className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: phase.color }}
                  >
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{phase.label}</h3>
                </div>
                <ul className="space-y-3">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: phase.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-5 -right-4 text-muted-foreground/30">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos ── */}
      <section id="planos" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Planos que cabem no seu laboratório
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece com 14 dias grátis. Sem cartão de crédito, sem compromisso.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-2xl border p-8 flex flex-col transition-all",
                  plan.highlight
                    ? "border-[hsl(205,78%,45%)] bg-[hsl(205,78%,45%)]/5 shadow-lg scale-[1.02] relative"
                    : "border-border/50 bg-card hover:shadow-md"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[hsl(205,78%,45%)] text-white text-xs font-semibold">
                    Mais Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  {plan.price !== "Sob consulta" ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{plan.limit}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-[hsl(152,60%,40%)] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#contato">
                  <Button
                    className={cn(
                      "w-full rounded-full h-11",
                      plan.highlight
                        ? "bg-[hsl(205,78%,45%)] hover:bg-[hsl(205,78%,40%)] text-white"
                        : ""
                    )}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.price === "Sob consulta" ? "Falar com Vendas" : "Começar Teste Grátis"}
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Depoimentos ── */}
      <section id="depoimentos" className="py-20 md:py-28 bg-[hsl(210,50%,15%)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-3 mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              O que nossos clientes dizem
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Laboratórios de todo o Brasil confiam no SupriLIS.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-white/50">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Perguntas frequentes
          </h2>
          <div className="divide-y divide-border">
            {faqItems.map((item, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between py-5 text-left group"
                >
                  <span className="font-medium text-foreground text-[15px] pr-4 group-hover:text-[hsl(205,78%,45%)] transition-colors">
                    {item.q}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                <div className={cn("overflow-hidden transition-all duration-300", openFaq === idx ? "max-h-60 pb-5" : "max-h-0")}>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contato / Cadastro ── */}
      <section id="contato" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Pronto para transformar seu laboratório?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Preencha o formulário e nossa equipe entrará em contato em até 24 horas para agendar uma demonstração personalizada.
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 text-[hsl(205,78%,45%)]" />
                  (11) 99999-9999
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-[hsl(205,78%,45%)]" />
                  comercial@suprilis.com.br
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-[hsl(205,78%,45%)]" />
                  Seg a Sex, 8h às 18h
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4 text-[hsl(205,78%,45%)]" />
                  www.suprilis.com.br
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border/50 shadow-lg">
              {formSent ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-[hsl(152,60%,40%)] mx-auto" />
                  <h3 className="text-xl font-bold text-foreground">Mensagem enviada!</h3>
                  <p className="text-muted-foreground text-sm">
                    Nossa equipe entrará em contato em breve. Obrigado pelo interesse!
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); setFormSent(true); }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Nome</label>
                      <Input placeholder="Seu nome" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Laboratório</label>
                      <Input placeholder="Nome do laboratório" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                      <Input type="email" placeholder="seu@email.com" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                      <Input placeholder="(00) 00000-0000" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Mensagem</label>
                    <Textarea placeholder="Conte-nos sobre seu laboratório e suas necessidades..." rows={4} />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-full h-12 text-base bg-[hsl(205,78%,45%)] hover:bg-[hsl(205,78%,40%)] text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Solicitar Demonstração
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Ao enviar, você concorda com nossa política de privacidade.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[hsl(210,50%,12%)] text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Microscope className="w-6 h-6 text-[hsl(205,78%,55%)]" />
                <span className="text-lg font-bold">
                  Supri<span className="text-[hsl(205,78%,55%)]">LIS</span>
                </span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Sistema de Informação Laboratorial completo e na nuvem.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Produto</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Suporte</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#contato" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status do Sistema</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6">
            <p className="text-xs text-white/30 text-center">
              © {new Date().getFullYear()} SupriLIS — Sistema de Informação Laboratorial. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SaaSLandingPage;
