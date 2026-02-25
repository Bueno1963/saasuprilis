import { useNavigate } from "react-router-dom";
import { UserPlus, Calendar, FileCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isSameDay, parseISO } from "date-fns";
import { useMemo } from "react";

const RecepcaoPage = () => {
  const navigate = useNavigate();

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_date, status")
        .eq("status", "agendado");
      if (error) throw error;
      return data;
    },
  });

  const todayPending = useMemo(
    () => appointments.filter((a: any) => isSameDay(parseISO(a.scheduled_date), new Date())).length,
    [appointments]
  );

  const sections = [
    { key: "cadastro", title: "Cadastro Pacientes", icon: UserPlus, href: "/pacientes" },
    {
      key: "agendamento",
      title: "Agendamento",
      subtitle: todayPending > 0 ? `${todayPending} pendente(s)` : "Nenhum pendente",
      icon: Calendar,
      href: "/recepcao/agendamento",
    },
    { key: "resultados", title: "Resultados", icon: FileCheck, href: "/laudos/liberados" },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        {sections.map(({ key, title, subtitle, icon: Icon, href }) => (
          <button
            key={key}
            onClick={() => navigate(href)}
            className="group relative rounded-2xl px-8 py-12 text-center transition-all duration-200
              bg-gradient-to-b from-[hsl(210,95%,48%)] via-[hsl(215,90%,40%)] to-[hsl(220,85%,32%)]
              shadow-[0_4px_12px_hsl(220,85%,25%/0.35),inset_0_1px_1px_hsl(210,100%,75%/0.5)]
              hover:shadow-[0_6px_20px_hsl(220,85%,25%/0.5),inset_0_1px_1px_hsl(210,100%,75%/0.5)]
              hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-[0_2px_6px_hsl(220,85%,25%/0.3)]
              border border-[hsl(210,70%,35%/0.4)]
              overflow-hidden min-h-[140px]"
          >
            <div className="absolute inset-x-0 top-0 h-[45%] rounded-t-2xl bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <span className="block text-base font-bold text-white drop-shadow-sm">{title}</span>
              {subtitle && (
                <span className="block text-xs text-white/60 italic">{subtitle}</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecepcaoPage;
