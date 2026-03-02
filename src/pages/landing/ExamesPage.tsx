import { Link } from "react-router-dom";
import { Phone, ChevronDown, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingBreadcrumb from "@/components/landing/LandingBreadcrumb";

const examCategories = [
  {
    title: "Exames Especiais",
    exams: [
      "Espermograma", "Prolactina", "Progesterona", "Cortisol", "Ferritina",
      "Insulina", "TSH (hormônio da tireoide)", "Estradiol", "Toxicológico",
      "COVID-19", "Teste do Pezinho", "Citologia Geral",
    ],
  },
  {
    title: "Genéticos",
    exams: [
      "Teste de Paternidade", "Saúde da Mulher", "Nutrição Personalizada",
      "ECA Predisposição à Celulite", "Perfect Skin",
      "Síndrome do X Frágil e Síndrome de Ataxia",
      "Screening de Portadores de Alelos Recessivos", "Farmacogenética do HIV",
      "Risco Genético a Obesidade", "Perfil Genético de Risco Cardiovascular",
      "Obesidade Pós-Gestacional Gene GNB3",
      "Risco de Desenvolvimento de Doença de Alzheimer",
      "Teste de Intolerância ao Glúten e Doença Celíaca",
      "Perfil de Aptidão Física GenoGym", "Risco Genético de Melanoma",
      "Intolerância Alimentar",
    ],
  },
];

const faqExames = [
  {
    question: "Os exames de sangue só podem ser coletados pela manhã?",
    answer: "A maioria dos exames podem ser coletados a qualquer hora do dia. Outros, como o ferro e o cortisol, apresentam um ritmo circadiano com valores diferentes nos horários da manhã e à tarde.",
  },
  {
    question: "Posso fazer atividade física antes de realizar exames de sangue?",
    answer: "Não recomendamos atividade física antes da realização de exames de sangue, uma vez que muitos deles sofrem interferências como: glicose, leucócitos, CPK, prolactina, etc.",
  },
  {
    question: 'Água "quebra" o jejum?',
    answer: "Não. A ingestão de água suficiente para satisfazer a hidratação normal não significa que o jejum tenha sido quebrado. Convém lembrar que o excesso pode interferir nos exames de urina.",
  },
];

const ExamesPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background font-sans">
      <LandingNavbar />
      <LandingBreadcrumb items={[{ label: "Institucional" }, { label: "Exames" }]} />

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
            <div key={category.title}>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <FlaskConical className="w-5 h-5 text-[hsl(205,78%,45%)]" />
                {category.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                {category.exams.map((exam) => (
                  <div key={exam} className="group py-4 border-b-2 border-[hsl(205,78%,45%)] cursor-pointer hover:border-[hsl(205,78%,35%)] transition-colors">
                    <div className="flex items-center gap-3">
                      <FlaskConical className="w-4 h-4 text-[hsl(205,78%,45%)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-sm font-medium text-foreground group-hover:text-[hsl(205,78%,45%)] transition-colors">{exam}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[hsl(205,78%,28%)]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FlaskConical className="w-10 h-10 text-white/80 mx-auto mb-5" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Agende seu exame</h2>
          <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Agende pelo nosso portal online ou entre em contato pela nossa central de atendimento.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/portal-paciente?tab=agendamento">
              <Button size="lg" className="rounded-md px-8 h-12 text-sm font-semibold bg-white text-[hsl(205,78%,28%)] hover:bg-white/90 transition-colors">
                Agendar Online
              </Button>
            </Link>
            <a href="https://wa.me/5511999999999?text=Olá! Gostaria de agendar um exame." target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="rounded-md px-8 h-12 text-sm font-semibold border-white/40 text-white hover:bg-white/10 transition-colors">
                <Phone className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-muted/40">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8">Perguntas Frequentes sobre Exames</h2>
          <div className="divide-y divide-border">
            {faqExames.map((item, idx) => (
              <div key={idx}>
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between py-5 text-left group">
                  <span className="font-medium text-foreground text-[15px] pr-4 group-hover:text-[hsl(205,78%,45%)] transition-colors">{item.question}</span>
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

      <LandingFooter />
    </div>
  );
};

export default ExamesPage;
