import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
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
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import heroLabImg from "@/assets/hero-lab.jpg";
import logoDraDielem from "@/assets/logo-dra-dielem.jpg";

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

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "#" },
    { label: "Institucional", href: "#sobre", hasDropdown: true },
    { label: "Unidades", href: "#sobre" },
    { label: "Convênios", href: "/landing/convenios" },
    { label: "Exames", href: "/landing/exames" },
    { label: "Coletas", href: "/landing/coletas" },
    { label: "Vacinas", href: "#servicos" },
    { label: "Acesso Admin", href: "/auth" },
    { label: "Contato", href: "#contato" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top bar - contact info */}
      <div className="bg-[hsl(0,0%,96%)] text-sm hidden md:block border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a
              href="tel:+5511999999999"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="w-4 h-4 text-[hsl(205,78%,35%)]" />
              Central de Atendimento: (11) 99999-9999
            </a>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4 text-[hsl(142,70%,35%)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.79 23.329l4.47-1.47A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.587-5.932-1.608l-.425-.252-2.652.872.89-2.583-.277-.44A9.77 9.77 0 012.182 12 9.818 9.818 0 0112 2.182 9.818 9.818 0 0121.818 12 9.818 9.818 0 0112 21.818z"/>
              </svg>
              (11) 99999-9999
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/portal-paciente">
              <Button
                size="sm"
                className="rounded h-9 px-5 text-xs font-semibold bg-[hsl(205,78%,25%)] hover:bg-[hsl(205,78%,30%)] text-white"
              >
                Resultados de Exames
              </Button>
            </Link>
            <Link to="/portal-paciente?tab=agendamento">
              <Button
                size="sm"
                className="rounded h-9 px-5 text-xs font-semibold bg-[hsl(205,78%,45%)] hover:bg-[hsl(205,78%,50%)] text-white"
              >
                Agende seu Exame
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-[100px] flex items-center justify-between">
          <Link to="/landing" className="flex items-center">
            <img
              src={logoDraDielem}
              alt="Laboratório Dra. Dielem Feijó"
              className="h-[88px] w-auto max-w-[348px] object-contain"
            />
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium text-foreground hover:text-[hsl(205,78%,45%)] transition-colors flex items-center gap-1"
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-foreground hover:text-[hsl(205,78%,45%)] transition-colors flex items-center gap-1"
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
                </a>
              )
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-border/40",
            mobileMenuOpen ? "max-h-[600px]" : "max-h-0"
          )}
        >
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-medium text-foreground hover:text-[hsl(205,78%,45%)] transition-colors border-b border-border/30 last:border-0"
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-medium text-foreground hover:text-[hsl(205,78%,45%)] transition-colors border-b border-border/30 last:border-0"
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </a>
              )
            )}
            <div className="flex flex-col gap-2 pt-4">
              <Link to="/portal-paciente" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded h-10 text-sm font-semibold bg-[hsl(205,78%,25%)] hover:bg-[hsl(205,78%,30%)] text-white">
                  Resultados de Exames
                </Button>
              </Link>
              <Link to="/portal-paciente?tab=agendamento" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded h-10 text-sm font-semibold bg-[hsl(205,78%,45%)] hover:bg-[hsl(205,78%,50%)] text-white">
                  Agende seu Exame
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero — curved blue overlay inspired by Dom Bosco */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background image */}
        <img
          src={heroLabImg}
          alt="Laboratório clínico moderno"
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="eager"
        />
        {/* Subtle gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(205,78%,20%)]/85 via-[hsl(205,78%,25%)]/50 to-transparent" />
        {/* Decorative curved accent line */}
        <div className="absolute inset-0 pointer-events-none">
          <svg
            viewBox="0 0 1440 580"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <path
              d="M0,580 L380,580 C430,580 480,560 520,530 C575,485 610,415 620,335 C630,255 610,180 565,135 C535,110 500,95 460,90"
              fill="none"
              stroke="hsl(205,78%,60%)"
              strokeWidth="1.5"
              strokeOpacity="0.25"
            />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 w-full py-16 md:py-20">
          <div className="max-w-xl space-y-5">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight animate-fade-in [animation-duration:0.6s]">
              Cuidando da sua saúde com precisão e tecnologia.
            </h1>
            <p className="text-base md:text-lg text-white/75 leading-relaxed max-w-md animate-fade-in [animation-duration:0.6s] [animation-delay:0.15s] [animation-fill-mode:backwards]">
              Resultados rápidos, atendimento humanizado e laudos disponíveis
              online para você e seu médico.
            </p>
            <div className="flex flex-wrap gap-3 pt-3 animate-fade-in [animation-duration:0.6s] [animation-delay:0.3s] [animation-fill-mode:backwards]">
              <Link to="/portal-paciente">
                <Button
                  size="lg"
                  className="rounded-full px-7 h-12 text-sm bg-white text-[hsl(205,78%,25%)] hover:bg-white/90 shadow-lg font-semibold hover-scale"
                >
                  Consultar Resultados
                </Button>
              </Link>
              <Link to="/portal-medico">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-7 h-12 text-sm border-2 border-white text-white bg-white/10 hover:bg-white/20 hover-scale font-semibold"
                >
                  Portal do Médico
                </Button>
              </Link>
            </div>
          </div>
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
                alt="Equipe laboratorial VEROLIS"
                className="rounded-2xl shadow-xl w-full h-[360px] object-cover"
              />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-[hsl(205,78%,28%)] flex items-center justify-center shadow-lg">
                <Activity className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="space-y-5">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
                Laboratório de Análises Clínicas{" "}
                <span className="text-[hsl(205,78%,45%)]">VEROLIS</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                O VEROLIS é um Sistema de Informação Laboratorial (LIS) na nuvem
                que gerencia todo o fluxo do laboratório — da recepção do
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

      {/* Footer */}
      <footer className="bg-[hsl(210,50%,15%)] text-white py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={logoDraDielem} alt="Laboratório Dra. Dielem Feijó" className="h-[62px] w-auto object-contain brightness-0 invert" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
              <Link
                to="/portal-paciente"
                className="hover:text-white transition-colors"
              >
                Portal do Paciente
              </Link>
              <Link
                to="/portal-medico"
                className="hover:text-white transition-colors"
              >
                Portal do Médico
              </Link>
              <Link
                to="/auth"
                className="hover:text-white transition-colors"
              >
                Acesso Interno
              </Link>
            </div>
          </div>
          <p className="text-xs text-white/40 text-center mt-8">
            © {new Date().getFullYear()} Laboratório Dra. Dielem Feijó — Todos os direitos reservados.
            Em conformidade com a LGPD (Lei nº 13.709/2018).
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
