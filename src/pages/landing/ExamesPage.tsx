import { Link } from "react-router-dom";
import { Activity, Phone, ArrowRight, ChevronDown, Menu, X, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const examCategories = [
  {
    title: "Exames Especiais",
    exams: [
      "Espermograma",
      "Prolactina",
      "Progesterona",
      "Cortisol",
      "Ferritina",
      "Insulina",
      "TSH (hormônio da tireoide)",
      "Estradiol",
      "Toxicológico",
      "COVID-19",
      "Teste do Pezinho",
      "Citologia Geral",
    ],
  },
  {
    title: "Genéticos",
    exams: [
      "Teste de Paternidade",
      "Saúde da Mulher",
      "Nutrição Personalizada",
      "ECA Predisposição à Celulite",
      "Perfect Skin",
      "Síndrome do X Frágil e Síndrome de Ataxia",
      "Screening de Portadores de Alelos Recessivos",
      "Farmacogenética do HIV",
      "Risco Genético a Obesidade",
      "Perfil Genético de Risco Cardiovascular",
      "Obesidade Pós-Gestacional Gene GNB3",
      "Risco de Desenvolvimento de Doença de Alzheimer",
      "Teste de Intolerância ao Glúten e Doença Celíaca",
      "Perfil de Aptidão Física GenoGym",
      "Risco Genético de Melanoma",
      "Intolerância Alimentar",
    ],
  },
];

const faqExames = [
  {
    question: "Os exames de sangue só podem ser coletados pela manhã?",
    answer:
      "A maioria dos exames podem ser coletados a qualquer hora do dia. Outros, como o ferro e o cortisol, apresentam um ritmo circadiano com valores diferentes nos horários da manhã e à tarde.",
  },
  {
    question: "Posso fazer atividade física antes de realizar exames de sangue?",
    answer:
      "Não recomendamos atividade física antes da realização de exames de sangue, uma vez que muitos deles sofrem interferências como: glicose, leucócitos, CPK, prolactina, etc.",
  },
  {
    question: 'Água "quebra" o jejum?',
    answer:
      "Não. A ingestão de água suficiente para satisfazer a hidratação normal não significa que o jejum tenha sido quebrado. Convém lembrar que o excesso pode interferir nos exames de urina.",
  },
];

const ExamesPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const navLinks = [
    { label: "Home", href: "/landing" },
    { label: "Institucional", href: "/landing", hasDropdown: true },
    { label: "Unidades", href: "/landing#sobre" },
    { label: "Convênios", href: "/landing#servicos" },
    { label: "Exames", href: "/landing/exames" },
    { label: "Coletas", href: "/landing/coletas" },
    { label: "Vacinas", href: "/landing#servicos" },
    { label: "Blog", href: "/landing#duvidas" },
    { label: "Contato", href: "/landing#contato" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top bar */}
      <div className="bg-[hsl(0,0%,96%)] text-sm hidden md:block border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="tel:+5511999999999" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-4 h-4 text-[hsl(205,78%,35%)]" />
              Central de Atendimento: (11) 99999-9999
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/portal-paciente">
              <Button size="sm" className="rounded h-9 px-5 text-xs font-semibold bg-[hsl(205,78%,25%)] hover:bg-[hsl(205,78%,30%)] text-white">
                Resultados de Exames
              </Button>
            </Link>
            <Link to="/portal-paciente?tab=agendamento">
              <Button size="sm" className="rounded h-9 px-5 text-xs font-semibold bg-[hsl(205,78%,45%)] hover:bg-[hsl(205,78%,50%)] text-white">
                Agende seu Exame
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[hsl(205,78%,28%)] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight text-foreground">VEROLIS</span>
              <span className="text-[10px] text-muted-foreground tracking-wide">Laboratório</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.href} className="text-sm font-medium text-foreground hover:text-[hsl(205,78%,45%)] transition-colors flex items-center gap-1">
                {link.label}
                {link.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
              </Link>
            ))}
          </div>

          <button className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className={cn("md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-border/40", mobileMenuOpen ? "max-h-[600px]" : "max-h-0")}>
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between py-3 text-sm font-medium text-foreground hover:text-[hsl(205,78%,45%)] transition-colors border-b border-border/30 last:border-0">
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              <Link to="/portal-paciente" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded h-10 text-sm font-semibold bg-[hsl(205,78%,25%)] hover:bg-[hsl(205,78%,30%)] text-white">Resultados de Exames</Button>
              </Link>
              <Link to="/portal-paciente?tab=agendamento" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded h-10 text-sm font-semibold bg-[hsl(205,78%,45%)] hover:bg-[hsl(205,78%,50%)] text-white">Agende seu Exame</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="bg-[hsl(0,0%,97%)] border-b border-border/30">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/landing" className="hover:text-[hsl(205,78%,45%)] transition-colors">Home</Link>
            <span>&gt;</span>
            <span>Institucional</span>
            <span>&gt;</span>
            <span className="text-[hsl(205,78%,45%)] font-medium">Exames</span>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="bg-[hsl(205,78%,28%)] py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">Exames</h1>
        </div>
      </section>

      {/* Exam Categories */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          {examCategories.map((category) => (
            <div key={category.title} className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-muted-foreground">{category.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.exams.map((exam) => (
                  <div
                    key={exam}
                    className="group flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 hover:shadow-md hover:border-[hsl(205,78%,45%)]/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FlaskConical className="w-4 h-4 text-[hsl(205,78%,45%)] shrink-0" />
                      <span className="text-sm font-medium text-foreground group-hover:text-[hsl(205,78%,45%)] transition-colors">
                        {exam}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(205,78%,45%)] transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-muted/40">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8">Perguntas Frequentes</h2>
          <div className="divide-y divide-border">
            {faqExames.map((item, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between py-5 text-left group"
                >
                  <span className="font-medium text-foreground text-[15px] pr-4 group-hover:text-[hsl(205,78%,45%)] transition-colors">
                    {item.question}
                  </span>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground shrink-0 transition-transform", openFaq === idx && "rotate-180")} />
                </button>
                <div className={cn("overflow-hidden transition-all duration-300", openFaq === idx ? "max-h-60 pb-5" : "max-h-0")}>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[hsl(210,50%,15%)] text-white py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[hsl(205,78%,45%)] flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">VEROLIS</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
              <Link to="/portal-paciente" className="hover:text-white transition-colors">Portal do Paciente</Link>
              <Link to="/portal-medico" className="hover:text-white transition-colors">Portal do Médico</Link>
              <Link to="/auth" className="hover:text-white transition-colors">Acesso Interno</Link>
            </div>
          </div>
          <p className="text-xs text-white/40 text-center mt-8">
            © {new Date().getFullYear()} VEROLIS — Todos os direitos reservados. Em conformidade com a LGPD (Lei nº 13.709/2018).
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ExamesPage;
