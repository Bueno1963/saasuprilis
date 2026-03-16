import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  CalendarCheck,
  MonitorSmartphone,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  FileText,
  Shield,
  Phone,
  Mail,
  HelpCircle,
  MapPin,
  Stethoscope,
  FlaskConical,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import heroLabImg from "@/assets/hero-lab-modern.jpg";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

const serviceCards = [
  {
    icon: Building2,
    title: "Nossas Unidades",
    description:
      "Informações sobre nossas unidades, horário de funcionamento e localização.",
    link: "/portal-paciente",
    linkText: "Acessar agora",
  },
  {
    icon: CalendarCheck,
    title: "Agendamento Online",
    description:
      "Agende seus exames e garanta um atendimento ainda mais rápido.",
    link: "/portal-paciente",
    linkText: "Acessar agora",
  },
  {
    icon: FileText,
    title: "Resultados de Exames",
    description:
      "Tenha acesso aos resultados dos seus exames sem sair de casa.",
    link: "/portal-paciente",
    linkText: "Acessar agora",
  },
];

const quickAccessExams = [
  "Hemograma Completo",
  "Glicemia em Jejum",
  "Colesterol Total",
  "TSH e T4 Livre",
];

const quickAccessServices = [
  { label: "Coleta em Unidade", icon: Building2 },
  { label: "Coleta Domiciliar", icon: MapPin },
  { label: "Coleta Empresarial", icon: Stethoscope },
  { label: "Coleta Infantil", icon: FlaskConical },
];

const faqItems = [
  {
    question: "Como acesso meus resultados de exames?",
    answer:
      "Acesse o Portal do Paciente com o número do seu pedido e data de nascimento. Seus resultados estarão disponíveis assim que liberados pelo laboratório.",
  },
  {
    question: "Quais tipos de exames são realizados?",
    answer:
      "Realizamos exames de análises clínicas em diversas especialidades: bioquímica, hematologia, imunologia, microbiologia, parasitologia, uroanálise e muito mais.",
  },
  {
    question: "Quanto tempo leva para os resultados ficarem prontos?",
    answer:
      "O prazo varia de acordo com o tipo de exame. Exames de rotina geralmente ficam prontos em até 24 horas. Exames especializados podem levar até 7 dias úteis.",
  },
  {
    question: "Preciso de pedido médico para realizar exames?",
    answer:
      "Sim, para a maioria dos exames é necessário apresentar o pedido médico no momento da coleta. Alguns exames de rotina podem ser realizados sem pedido.",
  },
  {
    question: "O médico solicitante pode acessar meus resultados?",
    answer:
      "Sim, através do Portal do Médico, o profissional que solicitou seus exames pode acompanhar os resultados em tempo real, de forma segura e auditada.",
  },
];

const landingNavLinks = [
  { label: "Home", href: "#" },
  { label: "Institucional", href: "#sobre", hasDropdown: true },
  { label: "Unidades", href: "#sobre" },
  { label: "Convênios", href: "/landing/convenios" },
  { label: "Exames", href: "/landing/exames" },
  { label: "Coletas", href: "/landing/coletas" },
  { label: "Vacinas", href: "/landing/vacinas" },
  { label: "Acesso Admin", href: "/auth" },
  { label: "Contato", href: "#contato" },
];

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background font-sans">
      <LandingNavbar navLinksOverride={landingNavLinks} />

      {/* Hero — Full-Screen Parallax */}
      <section className="relative h-screen min-h-[600px] max-h-[900px] flex items-center justify-center overflow-hidden">
        {/* Parallax background */}
        <div
          className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{ backgroundImage: `url(${heroLabImg})` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(205,78%,12%)]/80 via-[hsl(205,78%,18%)]/60 to-[hsl(205,78%,25%)]/80" />

        {/* Animated floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-white/20 animate-[pulse_3s_ease-in-out_infinite]" />
          <div className="absolute top-[30%] right-[15%] w-3 h-3 rounded-full bg-white/10 animate-[pulse_4s_ease-in-out_infinite_0.5s]" />
          <div className="absolute bottom-[25%] left-[20%] w-1.5 h-1.5 rounded-full bg-white/15 animate-[pulse_3.5s_ease-in-out_infinite_1s]" />
          <div className="absolute top-[50%] right-[25%] w-2.5 h-2.5 rounded-full bg-white/10 animate-[pulse_5s_ease-in-out_infinite_0.3s]" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto px-6 space-y-8">
          {/* Trust badge */}
          <div className="animate-fade-in [animation-duration:0.5s]">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase text-white/90 bg-white/10 backdrop-blur-md border border-white/20">
              <Shield className="w-3.5 h-3.5" />
              Referência em Análises Clínicas
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight animate-fade-in [animation-duration:0.7s] [animation-delay:0.15s] [animation-fill-mode:backwards]">
            Cuidando da sua saúde
            <br />
            <span className="bg-gradient-to-r from-white via-[hsl(205,78%,75%)] to-[hsl(205,78%,55%)] bg-clip-text text-transparent">
              com precisão e tecnologia
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto leading-relaxed animate-fade-in [animation-duration:0.7s] [animation-delay:0.3s] [animation-fill-mode:backwards]">
            Resultados rápidos, atendimento humanizado e laudos disponíveis
            online para você e seu médico.
          </p>

          {/* CTA buttons with glassmorphism */}
          <div className="flex flex-wrap justify-center gap-4 pt-2 animate-fade-in [animation-duration:0.7s] [animation-delay:0.45s] [animation-fill-mode:backwards]">
            <Link to="/portal-paciente">
              <Button
                size="lg"
                className="rounded-full px-8 h-14 text-base bg-white text-[hsl(205,78%,22%)] hover:bg-white/90 shadow-[0_8px_32px_rgba(255,255,255,0.25)] font-bold hover-scale"
              >
                Consultar Resultados
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/portal-medico">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-14 text-base border-2 border-white/30 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 hover-scale font-bold"
              >
                Portal do Médico
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 pt-6 animate-fade-in [animation-duration:0.7s] [animation-delay:0.6s] [animation-fill-mode:backwards]">
            {[
              { value: "+10.000", label: "Exames realizados" },
              { value: "6", label: "Especialidades" },
              { value: "24h", label: "Resultados online" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="text-xs md:text-sm text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-[pulse_2s_ease-in-out_infinite]">
          <ChevronDown className="w-6 h-6 text-white/40" />
        </div>
      </section>

      {/* Service cards — dark blue band like Dom Bosco */}
      <section className="bg-[hsl(210,50%,15%)] py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {serviceCards.map((card) => (
              <Link
                key={card.title}
                to={card.link}
                className="group flex flex-col gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(205,78%,45%)]/20 flex items-center justify-center shrink-0">
                    <card.icon className="w-6 h-6 text-[hsl(205,78%,55%)]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white text-lg">
                      {card.title}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {card.description}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(205,78%,55%)] group-hover:text-[hsl(205,78%,65%)] transition-colors">
                      {card.linkText}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About section — image left, text right like Dom Bosco */}
      <section id="sobre" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <img
                src={heroLabImg}
                alt="Equipe laboratorial Dra. Dielem Feijó"
                className="rounded-2xl shadow-xl w-full h-[360px] object-cover"
              />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-[hsl(205,78%,28%)] flex items-center justify-center shadow-lg">
                <FlaskConical className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-5">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
                Laboratório{" "}
                <span className="text-[hsl(205,78%,45%)]">Dra. Dielem Feijó</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                O Laboratório Dra. Dielem Feijó é um laboratório de análises clínicas
                que gerencia todo o fluxo — da recepção do
                paciente à entrega do laudo. Com rastreabilidade total, controle
                de qualidade integrado e portais dedicados para pacientes e
                médicos.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Simples, preciso e em conformidade com a LGPD.</strong>{" "}
                Possuímos equipe especializada nas áreas de Bioquímica,
                Hematologia, Imunologia, Microbiologia, Parasitologia e
                Uroanálise.
              </p>
              <Link to="/portal-paciente">
                <Button className="rounded-full px-6 mt-2">
                  Saiba mais
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick access — Coletas & Exames side by side */}
      <section id="servicos" className="py-16 md:py-20 bg-muted/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Coletas */}
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Acesso Rápido{" "}
                <span className="text-[hsl(205,78%,45%)]">Coletas</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickAccessServices.map((item) => (
                  <Link
                    key={item.label}
                    to="/portal-paciente"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50 hover:shadow-md hover:border-[hsl(205,78%,45%)]/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[hsl(205,78%,45%)]/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[hsl(205,78%,45%)]" />
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-[hsl(205,78%,45%)] transition-colors">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Exames */}
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Acesso Rápido{" "}
                <span className="text-[hsl(205,78%,45%)]">Exames</span>
              </h2>
              <div className="space-y-2">
                {quickAccessExams.map((exam) => (
                  <Link
                    key={exam}
                    to="/portal-paciente"
                    className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 hover:shadow-md hover:border-[hsl(205,78%,45%)]/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <FlaskConical className="w-4 h-4 text-[hsl(205,78%,45%)]" />
                      <span className="text-sm font-medium text-foreground group-hover:text-[hsl(205,78%,45%)] transition-colors">
                        {exam}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(205,78%,45%)] transition-colors" />
                  </Link>
                ))}
              </div>
              <Link
                to="/portal-paciente"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(205,78%,45%)] hover:text-[hsl(205,78%,55%)] transition-colors"
              >
                Ver todos os exames
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="duvidas" className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Dúvidas frequentes
          </h2>

          <div className="divide-y divide-border">
            {faqItems.map((item, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between py-5 text-left group"
                >
                  <span className="font-medium text-foreground text-[15px] pr-4 group-hover:text-[hsl(205,78%,45%)] transition-colors">
                    {item.question}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    openFaq === idx ? "max-h-60 pb-5" : "max-h-0"
                  )}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-20 bg-[hsl(205,78%,28%)]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Acesse seus resultados agora
          </h2>
          <p className="text-white/70 max-w-xl mx-auto">
            Com o número do pedido e sua data de nascimento, você consulta seus
            laudos de forma segura e instantânea.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/portal-paciente">
              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-base bg-white text-[hsl(205,78%,28%)] hover:bg-white/90"
              >
                Consultar Resultados
              </Button>
            </Link>
            <Link to="/portal-medico">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base border-white/40 text-white hover:bg-white/10"
              >
                Portal do Médico
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact / Help */}
      <section id="contato" className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <HelpCircle className="w-10 h-10 text-[hsl(205,78%,45%)] mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">
            Precisa de ajuda?
          </h2>
          <p className="text-muted-foreground">
            Entre em contato com nossa equipe de atendimento para tirar suas
            dúvidas.
          </p>
          <div className="flex flex-wrap justify-center gap-8 pt-4 text-sm">
            <a
              href="mailto:contato@labdradielem.com.br"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
              contato@labdradielem.com.br
            </a>
            <a
              href="tel:+5511999999999"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="w-4 h-4" />
              (11) 99999-9999
            </a>
          </div>
        </div>
      </section>

      <LandingFooter showLogo />
    </div>
  );
};

export default LandingPage;
