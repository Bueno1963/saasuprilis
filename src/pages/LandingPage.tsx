import { Link } from "react-router-dom";
import { Activity, ArrowRight, CheckCircle, Shield, Zap, BarChart3, TestTubes, FileCheck, Users, Clock, Lock, Globe, ChevronRight, Star, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: TestTubes,
    title: "Gestão de Amostras",
    description: "Rastreabilidade total do ciclo de vida da amostra, da coleta à liberação do laudo.",
  },
  {
    icon: BarChart3,
    title: "Controle de Qualidade",
    description: "Regras de Westgard automáticas, gráficos Levey-Jennings e alertas em tempo real.",
  },
  {
    icon: FileCheck,
    title: "Laudos Digitais",
    description: "Geração, validação e liberação de laudos com assinatura eletrônica e rastreabilidade.",
  },
  {
    icon: Users,
    title: "Portal do Paciente",
    description: "Acesso seguro aos resultados via código do pedido, com compliance LGPD.",
  },
  {
    icon: Shield,
    title: "Segurança & LGPD",
    description: "Controle de acesso por perfil (RBAC), auditoria completa e criptografia de dados.",
  },
  {
    icon: Zap,
    title: "Integrações",
    description: "Conecte equipamentos via ASTM/HL7 e integre com sistemas externos via API REST.",
  },
];

const benefits = [
  { value: "99.9%", label: "Uptime garantido" },
  { value: "3x", label: "Mais produtividade" },
  { value: "<2min", label: "Tempo médio de laudo" },
  { value: "100%", label: "Rastreabilidade" },
];

const testimonials = [
  {
    name: "Dra. Marina Oliveira",
    role: "Diretora Técnica — Laboratório Diagnóstica",
    text: "O VEROLIS transformou nossa operação. A rastreabilidade completa e o controle de qualidade integrado nos deram confiança total nos resultados.",
    stars: 5,
  },
  {
    name: "Dr. Ricardo Mendes",
    role: "Patologista Clínico — LabCenter",
    text: "A interface é intuitiva e o portal do paciente reduziu em 70% as ligações para retirada de laudos. Excelente investimento.",
    stars: 5,
  },
  {
    name: "Ana Paula Santos",
    role: "Gerente de TI — Rede BioVida",
    text: "A integração com nossos equipamentos foi rápida e o suporte técnico é excepcional. Recomendo fortemente.",
    stars: 5,
  },
];

const phases = [
  { label: "Pré-Analítica", color: "from-amber-500 to-orange-500", items: ["Recepção e cadastro", "Agendamento", "Coleta e triagem"] },
  { label: "Analítica", color: "from-blue-500 to-cyan-500", items: ["Mapa de trabalho", "Interfaceamento", "Controle de qualidade"] },
  { label: "Pós-Analítica", color: "from-emerald-500 to-teal-500", items: ["Validação de resultados", "Liberação de laudos", "Portal do paciente"] },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">VEROLIS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#fluxo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como funciona</a>
            <a href="#depoimentos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contato</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <a href="#contato">
              <Button size="sm" className="shadow-lg shadow-primary/20">
                Solicitar Demo
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="w-3.5 h-3.5" />
              Sistema de Informação Laboratorial
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              Gestão laboratorial{" "}
              <span className="text-gradient">inteligente</span>{" "}
              e completa
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Do cadastro do paciente à entrega do laudo — o VEROLIS automatiza e rastreia cada etapa do seu laboratório com segurança e conformidade LGPD.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="#contato">
                <Button size="lg" className="text-base px-8 shadow-xl shadow-primary/25 h-12">
                  Agendar Demonstração
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <a href="#funcionalidades">
                <Button variant="outline" size="lg" className="text-base px-8 h-12">
                  Conhecer Funcionalidades
                </Button>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto">
            {benefits.map((b) => (
              <div key={b.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-gradient">{b.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Tudo que seu laboratório precisa
            </h2>
            <p className="text-muted-foreground mt-4">
              Uma plataforma completa para gerenciar todas as fases do processo laboratorial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/60 hover:border-primary/20">
                <CardContent className="pt-6 pb-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow / Phases */}
      <section id="fluxo" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Como funciona</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Fluxo laboratorial completo
            </h2>
            <p className="text-muted-foreground mt-4">
              O VEROLIS cobre as três fases do processo laboratorial com rastreabilidade total.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {phases.map((phase, idx) => (
              <div key={phase.label} className="relative">
                <div className={cn("h-1.5 rounded-full bg-gradient-to-r mb-6", phase.color)} />
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold text-foreground text-lg">{phase.label}</h3>
                </div>
                <ul className="space-y-3">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">Diferenciais</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Por que escolher o VEROLIS?
              </h2>
              <div className="space-y-5 pt-2">
                {[
                  { icon: Lock, title: "Segurança de ponta", desc: "Criptografia, RBAC, auditoria completa e conformidade total com a LGPD." },
                  { icon: Clock, title: "Implementação rápida", desc: "Onboarding em até 7 dias com migração de dados e treinamento da equipe." },
                  { icon: Globe, title: "100% na nuvem", desc: "Sem instalação, sem servidor local. Acesse de qualquer lugar, a qualquer hora." },
                ].map((d) => (
                  <div key={d.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <d.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{d.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{d.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Visual card mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-card rounded-2xl border border-border shadow-2xl p-8 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">VEROLIS LIS</p>
                    <p className="text-xs text-muted-foreground">Dashboard — Hoje</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Pedidos Hoje", value: "47", color: "text-primary" },
                    { label: "Laudos Liberados", value: "38", color: "text-emerald-600" },
                    { label: "Amostras Pendentes", value: "12", color: "text-amber-600" },
                    { label: "CQ Aprovados", value: "100%", color: "text-primary" },
                  ].map((s) => (
                    <div key={s.label} className="bg-muted/50 rounded-xl p-4">
                      <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Depoimentos</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              O que dizem nossos clientes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/60">
                <CardContent className="pt-6 pb-6 space-y-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "{t.text}"
                  </p>
                  <div className="pt-2 border-t border-border">
                    <p className="font-medium text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contato" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center space-y-4 mb-10">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">Contato</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Pronto para modernizar seu laboratório?
              </h2>
              <p className="text-muted-foreground">
                Agende uma demonstração gratuita e descubra como o VEROLIS pode transformar sua operação.
              </p>
            </div>

            <Card className="border-border/60 shadow-xl">
              <CardContent className="pt-8 pb-8">
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
                    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
                    const lab = (form.elements.namedItem("lab") as HTMLInputElement).value;
                    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
                    const subject = encodeURIComponent(`Demo VEROLIS — ${lab}`);
                    const body = encodeURIComponent(`Nome: ${name}\nEmail: ${email}\nLaboratório: ${lab}\nTelefone: ${phone}`);
                    window.location.href = `mailto:contato@verolis.com.br?subject=${subject}&body=${body}`;
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-sm font-medium text-foreground">Nome</label>
                      <input
                        id="name"
                        name="name"
                        required
                        placeholder="Seu nome completo"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="seu@email.com"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="lab" className="text-sm font-medium text-foreground">Laboratório</label>
                      <input
                        id="lab"
                        name="lab"
                        required
                        placeholder="Nome do laboratório"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="text-sm font-medium text-foreground">Telefone</label>
                      <input
                        id="phone"
                        name="phone"
                        placeholder="(00) 00000-0000"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full h-12 text-base shadow-lg shadow-primary/20">
                    Solicitar Demonstração Gratuita
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-center gap-8 mt-10 text-sm text-muted-foreground">
              <a href="mailto:contato@verolis.com.br" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="w-4 h-4" /> contato@verolis.com.br
              </a>
              <a href="tel:+5511999999999" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="w-4 h-4" /> (11) 99999-9999
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">VEROLIS</span>
              <span className="text-xs text-muted-foreground">Sistema de Informação Laboratorial</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/portal-paciente" className="hover:text-foreground transition-colors">Portal do Paciente</Link>
              <Link to="/portal-medico" className="hover:text-foreground transition-colors">Portal do Médico</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">Acesso ao Sistema</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} VEROLIS — Todos os direitos reservados. Em conformidade com a LGPD (Lei nº 13.709/2018).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
