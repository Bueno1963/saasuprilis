import { Link } from "react-router-dom";
import logoDraDielem from "@/assets/logo-dra-dielem.jpg";

interface LandingFooterProps {
  /** Show logo image instead of text */
  showLogo?: boolean;
}

const LandingFooter = ({ showLogo = false }: LandingFooterProps) => {
  return (
    <footer className="bg-[hsl(210,50%,15%)] text-white py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            {showLogo ? (
              <img
                src={logoDraDielem}
                alt="Laboratório Dra. Dielem Feijó"
                className="h-[62px] w-auto object-contain brightness-0 invert"
              />
            ) : (
              <span className="font-bold text-white text-sm">Lab Dra. Dielem Feijó</span>
            )}
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
  );
};

export default LandingFooter;
