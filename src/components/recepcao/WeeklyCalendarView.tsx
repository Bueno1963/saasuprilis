import { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, User } from "lucide-react";

const statusColors: Record<string, string> = {
  agendado: "bg-blue-100 text-blue-800 border-blue-200",
  confirmado: "bg-green-100 text-green-800 border-green-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
  atendido: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  atendido: "Atendido",
};

interface WeeklyCalendarViewProps {
  selectedDate: Date;
  appointments: any[];
  onSelectDate: (date: Date) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00 - 18:00

const WeeklyCalendarView = ({ selectedDate, appointments, onSelectDate }: WeeklyCalendarViewProps) => {
  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const getAppointmentsForDayHour = (day: Date, hour: number) => {
    return appointments.filter((a: any) => {
      if (!isSameDay(parseISO(a.scheduled_date), day)) return false;
      const h = parseInt(a.scheduled_time?.slice(0, 2), 10);
      return h === hour;
    });
  };

  const today = new Date();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header with day names */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="p-2 text-center text-xs text-muted-foreground border-r border-border" />
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "p-2 text-center border-r border-border last:border-r-0 hover:bg-accent/50 transition-colors",
                isSelected && "bg-primary/10",
              )}
            >
              <div className="text-xs text-muted-foreground capitalize">
                {format(day, "EEE", { locale: ptBR })}
              </div>
              <div
                className={cn(
                  "text-sm font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {format(day, "dd")}
              </div>
            </button>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[500px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0 min-h-[60px]">
            <div className="p-1 text-xs text-muted-foreground text-right pr-2 border-r border-border pt-1">
              {String(hour).padStart(2, "0")}:00
            </div>
            {weekDays.map((day) => {
              const appts = getAppointmentsForDayHour(day, hour);
              return (
                <div
                  key={day.toISOString() + hour}
                  className="border-r border-border last:border-r-0 p-0.5 space-y-0.5"
                >
                  {appts.map((a: any) => (
                    <div
                      key={a.id}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] leading-tight border cursor-default",
                        statusColors[a.status] || "bg-muted text-muted-foreground border-border",
                      )}
                      title={`${a.patients?.name} - ${statusLabels[a.status] || a.status}`}
                    >
                      <div className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        <span className="font-medium">{a.scheduled_time?.slice(0, 5)}</span>
                      </div>
                      <div className="flex items-center gap-0.5 truncate">
                        <User className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{a.patients?.name || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyCalendarView;
