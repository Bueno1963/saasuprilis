import { Link } from "react-router-dom";
import { Phone, ChevronDown, Menu, X, Syringe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logoDraDielem from "@/assets/logo-dra-dielem.jpg";

const vacinas = [
  "Vacina Pneumocócica 20",
  "Pneumocócica ou Pneumo-15",
  "Herpes Zóster",
  "Dengue",
  "BCG",
  "Hepatite B",
  "Hepatite A",
  "Rotavírus",
  "Pentavalente",
  "Hexavalente Acelular",
  "Pentavalente Acelular",
  "Pneumocócica ou Pneumo-13",
  "Pneumocócica ou Pneumo-23",
  "Meningocócica ACWY",
  "Meningocócica B",
  "Influenza Tetravalente (gripe)",
  "Febre Amarela",
  "Tetra Viral",
  "Tríplice Viral",
  "HPV Quadrivalente",
  "HPV Nonavalente",
  "Varicela",
  "Tríplice Bacteriana Acelular",
  "Tríplice Bacteriana Acelular + IPV",
];

const VacinasPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/landing" },
    { label: "Institucional", href: "/landing", hasDropdown: true },
    { label: "Unidades", href: "/landing#sobre" },
    { label: "Convênios", href: "/landing/convenios" },
    { label: "Exames", href: "/landing/exames" },
    { label: "Coletas", href: "/landing/coletas" },
    { label: "Vacinas", href: "/landing/vacinas" },
    { label: "Acesso Admin", href: "/auth" },
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
        <div className="max-w-7xl mx-auto px-6 h-[100px] flex items-center justify-between">
          <Link to="/landing" className="flex items-center">
            <img
              src={logoDraDielem}
              alt="Laboratório Dra. Dielem Feijó"
              className="h-[88px] w-auto max-w-[348px] object-contain"
            />
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
            <span className="text-[hsl(205,78%,45%)] font-medium">Vacinas</span>
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="bg-[hsl(205,78%,28%)] py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">Vacinas</h1>
        </div>
      </section>

      {/* Vaccine List */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            {vacinas.map((vacina) => (
              <div
                key={vacina}
                className="group py-4 border-b-2 border-[hsl(205,78%,45%)] cursor-pointer hover:border-[hsl(205,78%,35%)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Syringe className="w-4 h-4 text-[hsl(205,78%,45%)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-sm font-medium text-foreground group-hover:text-[hsl(205,78%,45%)] transition-colors">
                    {vacina}
                  </span>
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
              <span className="font-bold text-white text-sm">Lab Dra. Dielem Feijó</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
              <Link to="/portal-paciente" className="hover:text-white transition-colors">Portal do Paciente</Link>
              <Link to="/portal-medico" className="hover:text-white transition-colors">Portal do Médico</Link>
              <Link to="/auth" className="hover:text-white transition-colors">Acesso Interno</Link>
            </div>
          </div>
          <p className="text-xs text-white/40 text-center mt-8">
            © {new Date().getFullYear()} Laboratório Dra. Dielem Feijó — Todos os direitos reservados. Em conformidade com a LGPD (Lei nº 13.709/2018).
          </p>
        </div>
      </footer>
    </div>
  );
};

export default VacinasPage;
