import { Link } from "react-router-dom";
import { Phone, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroLabImg from "@/assets/hero-lab.jpg";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingBreadcrumb from "@/components/landing/LandingBreadcrumb";

const convenios = [
  "AGF Seguros", "APPAI", "Assim Saúde", "Banco Central do Brasil",
  "Bradesco Saúde", "CABERJ", "CABESP", "CAC", "Care Plus", "CASSI",
  "Club Saúde", "CNEN Eletrobrás", "Embratel", "E-Saúde Assist",
  "FUNCEF", "Fundação ASSEFAZ", "GEAP Saúde",
  "INB – Indústrias Nucleares do Brasil", "Integral Saúde",
  "Life – Empresarial Saúde", "Marítima Saúde", "Med Sênior",
  "Mediservice", "Mútua", "Notre Dame Intermédica", "PAME",
  "Petrobras", "Porto Seguro Saúde", "Postal Saúde", "Real Grandeza",
  "Rede Gama Saúde", "Saúde Total", "SulAmérica", "Telos",
];

const ConveniosPage = () => {
  return (
    <div className="min-h-screen bg-background font-sans">
      <LandingNavbar />
      <LandingBreadcrumb items={[{ label: "Institucional" }, { label: "Convênios" }]} />

      {/* Hero Banner */}
      <section className="bg-[hsl(205,78%,28%)] py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">Convênios</h1>
        </div>
      </section>

      {/* Convenios Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {convenios.map((convenio) => (
              <div key={convenio} className="flex items-center px-4 py-3.5 bg-card rounded-lg border-2 border-[hsl(205,78%,45%)]/30 hover:border-[hsl(205,78%,45%)] hover:shadow-md transition-all cursor-default">
                <span className="text-sm font-medium text-foreground leading-tight">{convenio}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Não credenciado */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
                Você não é credenciado por nenhum dos planos acima?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Entre em contato conosco e vamos encontrar uma solução. Temos preços que cabem no seu bolso.
              </p>
              <div className="space-y-3 pt-2">
                <p className="text-sm font-semibold text-foreground">Central de atendimentos:</p>
                <div className="flex flex-wrap gap-6">
                  <a href="tel:+5511999999999" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="w-4 h-4 text-[hsl(205,78%,45%)]" />
                    (11) 99999-9999
                  </a>
                  <a href="mailto:contato@labdradielem.com.br" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="w-4 h-4 text-[hsl(205,78%,45%)]" />
                    contato@labdradielem.com.br
                  </a>
                </div>
              </div>
              <Link to="/portal-paciente?tab=agendamento">
                <Button className="rounded-full px-6 mt-4">
                  Agendar Atendimento Particular
                  <Shield className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div>
              <img src={heroLabImg} alt="Atendimento laboratorial" className="w-full h-[320px] rounded-2xl object-cover shadow-lg" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default ConveniosPage;
