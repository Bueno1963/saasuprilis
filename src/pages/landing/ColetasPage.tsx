import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Stethoscope, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import coletaDomiciliarImg from "@/assets/coleta-domiciliar.jpg";
import coletaEmpresarialImg from "@/assets/coleta-empresarial.jpg";
import coletaInfantilImg from "@/assets/coleta-infantil.jpg";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingBreadcrumb from "@/components/landing/LandingBreadcrumb";

const coletaTypes = [
  {
    icon: MapPin,
    title: "Coleta Domiciliar",
    image: coletaDomiciliarImg,
    description:
      "Pensando na comodidade e no conforto de seus pacientes, o Laboratório Dra. Dielem Feijó oferece o serviço de Coleta Domiciliar, para que você possa cuidar da sua saúde no conforto da sua casa. Contamos com uma equipe de coletores rigorosamente treinados e capacitados para atendê-lo em seu domicílio, seja realizando a coleta de sangue ou transportando os diversos tipos de amostras para exames laboratoriais.",
    color: "hsl(205,78%,45%)",
  },
  {
    icon: Stethoscope,
    title: "Coleta Empresarial",
    image: coletaEmpresarialImg,
    description:
      'Para atender às necessidades das empresas na realização de exames e garantir o cuidado com os colaboradores, o Laboratório Dra. Dielem Feijó oferece duas opções: uma delas é disponibilizar uma estrutura "in loco", montada especialmente para a coleta de material dos colaboradores, seguindo rigorosamente as boas práticas ocupacionais; a outra opção é realizar os exames contratados em qualquer uma de nossas unidades.',
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

const ColetasPage = () => {
  return (
    <div className="min-h-screen bg-background font-sans">
      <LandingNavbar />
      <LandingBreadcrumb items={[{ label: "Institucional" }, { label: "Coletas" }]} />

      {/* Hero Banner */}
      <section className="bg-[hsl(205,78%,28%)] py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">Coletas</h1>
        </div>
      </section>

      {/* Coleta Types */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 space-y-20">
          {coletaTypes.map((coleta, idx) => {
            const Icon = coleta.icon;
            const isReversed = idx % 2 !== 0;
            return (
              <div key={coleta.title} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${isReversed ? "lg:direction-rtl" : ""}`}>
                <div className={isReversed ? "lg:order-2" : ""}>
                  <img src={coleta.image} alt={coleta.title} className="w-full h-[320px] rounded-2xl object-cover shadow-lg" loading="lazy" />
                </div>
                <div className={isReversed ? "lg:order-1" : ""}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: coleta.color + "20" }}>
                      <Icon className="w-5 h-5" style={{ color: coleta.color }} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">{coleta.title}</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">{coleta.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-[hsl(205,78%,28%)] text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Agende sua coleta</h2>
          <p className="text-muted-foreground text-white/70 mb-8">
            Conheça nossas unidades e agende sua coleta no local mais conveniente para você.
          </p>
          <Link to="/portal-paciente?tab=agendamento">
            <Button size="lg" className="rounded-full px-8 h-12 text-base bg-white text-[hsl(205,78%,28%)] hover:bg-white/90">
              Agendar Coleta <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default ColetasPage;
