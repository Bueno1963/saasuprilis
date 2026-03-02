import { Link } from "react-router-dom";
import { Activity, Phone, ArrowRight, MapPin, Building2, Stethoscope, Baby, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import coletaDomiciliarImg from "@/assets/coleta-domiciliar.jpg";
import coletaEmpresarialImg from "@/assets/coleta-empresarial.jpg";
import coletaInfantilImg from "@/assets/coleta-infantil.jpg";

const ColetasPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const coletaTypes = [
    {
      icon: MapPin,
      title: "Coleta Domiciliar",
      image: coletaDomiciliarImg,
      description:
        "Pensando na comodidade e no conforto de seus pacientes, o Laboratório VEROLIS oferece o serviço de Coleta Domiciliar, para que você possa cuidar da sua saúde no conforto da sua casa. Contamos com uma equipe de coletores rigorosamente treinados e capacitados para atendê-lo em seu domicílio, seja realizando a coleta de sangue ou transportando os diversos tipos de amostras para exames laboratoriais.",
      color: "hsl(205,78%,45%)",
    },
    {
      icon: Stethoscope,
      title: "Coleta Empresarial",
      image: coletaEmpresarialImg,
      description:
        'Para atender às necessidades das empresas na realização de exames e garantir o cuidado com os colaboradores, o Laboratório VEROLIS oferece duas opções: uma delas é disponibilizar uma estrutura "in loco", montada especialmente para a coleta de material dos colaboradores, seguindo rigorosamente as boas práticas ocupacionais; a outra opção é realizar os exames contratados em qualquer uma de nossas unidades.',
      color: "hsl(205,78%,35%)",
    },
    {
      icon: Baby,
      title: "Coleta Infantil",
      image: coletaInfantilImg,
      description:
        "Todos os equipamentos utilizados na coleta são especialmente projetados para atender nossos pequenos pacientes, empregando garrotes, agulhas e scalps pediátricos. Isso permite uma coleta menos traumática. A posição durante a coleta é adaptada conforme a idade, podendo ser sentados na cadeira, no colo dos pais ou deitados na maca.",
      color: "hsl(205,78%,55%)",
    },
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
            <span className="text-[hsl(205,78%,45%)] font-medium">Coletas</span>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="bg-[hsl(205,78%,28%)] py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">Coletas</h1>
        </div>
      </section>

      {/* Coleta Sections */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6 space-y-20">
          {coletaTypes.map((coleta, idx) => (
            <div key={coleta.title} className={cn("grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center", idx % 2 === 1 && "lg:[direction:rtl]")}>
              {/* Icon / Visual */}
              <div className={cn(idx % 2 === 1 && "lg:[direction:ltr]")}>
                <img
                  src={coleta.image}
                  alt={coleta.title}
                  className="w-full h-[280px] rounded-2xl object-cover shadow-lg"
                  loading="lazy"
                />
              </div>

              {/* Text */}
              <div className={cn("space-y-4", idx % 2 === 1 && "lg:[direction:ltr]")}>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  Conheça o serviço de{" "}
                  <span className="text-[hsl(205,78%,45%)]">{coleta.title}</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">{coleta.description}</p>
                <Link to="/portal-paciente?tab=agendamento">
                  <Button className="rounded-full px-6 mt-2" style={{ backgroundColor: coleta.color }}>
                    Agendar Coleta <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Unidades CTA */}
      <section className="py-16 md:py-20 bg-muted/40">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Oferecemos uma estrutura completa para atender você com excelência
          </h2>
          <p className="text-muted-foreground">
            Conheça nossas unidades e agende sua coleta no local mais conveniente para você.
          </p>
          <Link to="/portal-paciente?tab=agendamento">
            <Button size="lg" className="rounded-full px-8 h-12 text-base mt-2">
              Agendar Coleta <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
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

export default ColetasPage;
