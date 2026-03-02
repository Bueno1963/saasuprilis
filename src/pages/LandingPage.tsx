import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Clock, CalendarCheck, MonitorSmartphone, ChevronDown, ChevronUp, ArrowRight, FileText, Shield, Phone, Mail, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import heroLabImg from "@/assets/hero-lab.jpg";

const featureCards = [
  {
    icon: Clock,
    title: "Resultados rápidos",
    description: "Laudos liberados com agilidade e precisão, disponíveis online assim que prontos.",
  },
  {
    icon: CalendarCheck,
    title: "Agendamento fácil",
    description: "Escolha o melhor dia e horário para realizar seus exames, sem filas.",
  },
  {
    icon: MonitorSmartphone,
    title: "Acesso online",
    description: "Consulte seus resultados de qualquer lugar, pelo celular ou computador.",
  },
];

const faqItems = [
  {
    question: "Como acesso meus resultados de exames?",
    answer: "Acesse o Portal do Paciente com o número do seu pedido e data de nascimento. Seus resultados estarão disponíveis assim que liberados pelo laboratório.",
  },
  {
    question: "Quais tipos de exames são realizados?",
    answer: "Realizamos exames de análises clínicas em diversas especialidades: bioquímica, hematologia, imunologia, microbiologia, parasitologia, uroanálise e muito mais.",
  },
  {
    question: "Quanto tempo leva para os resultados ficarem prontos?",
    answer: "O prazo varia de acordo com o tipo de exame. Exames de rotina geralmente ficam prontos em até 24 horas. Exames especializados podem levar até 7 dias úteis.",
  },
  {
    question: "Preciso de pedido médico para realizar exames?",
    answer: "Sim, para a maioria dos exames é necessário apresentar o pedido médico no momento da coleta. Alguns exames de rotina podem ser realizados sem pedido.",
  },
  {
    question: "O médico solicitante pode acessar meus resultados?",
    answer: "Sim, através do Portal do Médico, o profissional que solicitou seus exames pode acompanhar os resultados em tempo real, de forma segura e auditada.",
  },
];

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[hsl(205,78%,28%)] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">VEROLIS</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sobre</a>
            <a href="#duvidas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dúvidas</a>
            <a href="#contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contato</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/portal-paciente">
              <Button variant="outline" size="sm" className="rounded-full px-5 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Resultados
              </Button>
            </Link>
            <Link to="/portal-paciente">
              <Button size="sm" className="rounded-full px-5">
                Acessar Laudos
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — full-width background image style */}
      <section className="relative pt-16 min-h-[600px] md:min-h-[680px] flex items-center overflow-hidden">
        {/* Background image */}
        <img
          src={heroLabImg}
          alt="Laboratório clínico moderno"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(205,78%,18%)]/90 via-[hsl(205,60%,25%)]/75 to-[hsl(205,50%,30%)]/50" />

        <div className="relative max-w-7xl mx-auto px-6 w-full py-20">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-white leading-[1.12] tracking-tight">
              Seus exames com precisão e resultados online.
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-lg">
              Sua plataforma laboratorial completa — do agendamento à entrega do laudo digital.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/portal-paciente">
                <Button size="lg" className="rounded-full px-8 h-12 text-base bg-white text-[hsl(205,78%,28%)] hover:bg-white/90 shadow-xl">
                  Consultar Resultados
                </Button>
              </Link>
              <Link to="/portal-medico">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base border-white/40 text-white hover:bg-white/10">
                  Portal do Médico
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature cards overlapping hero bottom */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {featureCards.map((card) => (
                <div
                  key={card.title}
                  className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 md:p-8 text-center hover:shadow-2xl transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <card.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for overlapping cards */}
      <div className="h-32 md:h-40" />

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
                  <span className="font-medium text-foreground text-[15px] pr-4 group-hover:text-primary transition-colors">
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / What is VEROLIS */}
      <section id="sobre" className="py-20 md:py-28 bg-muted/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <p className="text-sm font-semibold text-primary uppercase tracking-widest">O que é o VEROLIS?</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
                Seu laboratório digital, completo e seguro.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                O VEROLIS é um Sistema de Informação Laboratorial (LIS) na nuvem que gerencia todo o fluxo do laboratório — da recepção do paciente à entrega do laudo. Com rastreabilidade total, controle de qualidade integrado e portais dedicados para pacientes e médicos. <strong>Simples, preciso e em conformidade com a LGPD.</strong>
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link to="/portal-paciente">
                  <Button className="rounded-full px-6">
                    Consultar Resultados
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/portal-medico">
                  <Button variant="outline" className="rounded-full px-6">
                    Portal do Médico
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual illustration - stylized phone/dashboard mockup */}
            <div className="flex justify-center">
              <div className="relative w-72 md:w-80">
                {/* Phone frame */}
                <div className="bg-card rounded-[2rem] border-[3px] border-foreground/10 shadow-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2 px-2 pt-2">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                      <Activity className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-bold text-foreground">VEROLIS</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Portal do Paciente</span>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-foreground">Hemograma Completo</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Hemácias</span>
                      <span className="font-medium text-foreground">5.2 M/µL</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Hemoglobina</span>
                      <span className="font-medium text-foreground">15.1 g/dL</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Leucócitos</span>
                      <span className="font-medium text-foreground">7.800 /µL</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Plaquetas</span>
                      <span className="font-medium text-foreground">245.000 /µL</span>
                    </div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] text-emerald-700 font-medium">Laudo liberado e verificado</span>
                  </div>
                </div>
              </div>
            </div>
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
            Com o número do pedido e sua data de nascimento, você consulta seus laudos de forma segura e instantânea.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/portal-paciente">
              <Button size="lg" className="rounded-full px-8 h-12 text-base bg-white text-[hsl(205,78%,28%)] hover:bg-white/90">
                Consultar Resultados
              </Button>
            </Link>
            <Link to="/portal-medico">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base border-white/40 text-white hover:bg-white/10">
                Portal do Médico
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact / Help */}
      <section id="contato" className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <HelpCircle className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Precisa de ajuda?</h2>
          <p className="text-muted-foreground">
            Entre em contato com nossa equipe de atendimento para tirar suas dúvidas.
          </p>
          <div className="flex flex-wrap justify-center gap-8 pt-4 text-sm">
            <a href="mailto:contato@verolis.com.br" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-4 h-4" />
              contato@verolis.com.br
            </a>
            <a href="tel:+5511999999999" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-4 h-4" />
              (11) 99999-9999
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground text-sm">VEROLIS</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/portal-paciente" className="hover:text-foreground transition-colors">Portal do Paciente</Link>
              <Link to="/portal-medico" className="hover:text-foreground transition-colors">Portal do Médico</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">Acesso Interno</Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6">
            © {new Date().getFullYear()} VEROLIS — Todos os direitos reservados. Em conformidade com a LGPD (Lei nº 13.709/2018).
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
