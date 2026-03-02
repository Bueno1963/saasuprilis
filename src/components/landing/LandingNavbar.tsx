import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoDraDielem from "@/assets/logo-dra-dielem.jpg";

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

interface LandingNavbarProps {
  /** Override navLinks for pages that use hash anchors (e.g. LandingPage) */
  navLinksOverride?: { label: string; href: string; hasDropdown?: boolean }[];
}

const LandingNavbar = ({ navLinksOverride }: LandingNavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = navLinksOverride || navLinks;

  const renderLink = (link: { label: string; href: string; hasDropdown?: boolean }, onClick?: () => void) => {
    const className = "text-sm font-medium text-foreground hover:text-[hsl(205,78%,45%)] transition-colors flex items-center gap-1";
    const content = (
      <>
        {link.label}
        {link.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
      </>
    );

    // Use <a> for hash-only links on the same page, <Link> for routes
    if (link.href.startsWith("#")) {
      return (
        <a key={link.label} href={link.href} onClick={onClick} className={className}>
          {content}
        </a>
      );
    }
    return (
      <Link key={link.label} to={link.href} onClick={onClick} className={className}>
        {content}
      </Link>
    );
  };

  return (
    <>
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
            {links.map((link) => renderLink(link))}
          </div>

          <button
            className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className={cn("md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-border/40", mobileMenuOpen ? "max-h-[600px]" : "max-h-0")}>
          <div className="px-6 py-4 space-y-1">
            {links.map((link) => {
              const mobileClass = "flex items-center justify-between py-3 text-sm font-medium text-foreground hover:text-[hsl(205,78%,45%)] transition-colors border-b border-border/30 last:border-0";
              const onClick = () => setMobileMenuOpen(false);
              if (link.href.startsWith("#")) {
                return (
                  <a key={link.label} href={link.href} onClick={onClick} className={mobileClass}>
                    {link.label}
                    {link.hasDropdown && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </a>
                );
              }
              return (
                <Link key={link.label} to={link.href} onClick={onClick} className={mobileClass}>
                  {link.label}
                </Link>
              );
            })}
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
    </>
  );
};

export default LandingNavbar;
