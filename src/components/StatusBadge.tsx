import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  registered: "bg-muted text-muted-foreground",
  collected: "bg-warning/15 text-warning",
  triaged: "bg-info/15 text-info",
  processing: "bg-phase-analytical/15 text-phase-analytical",
  analyzed: "bg-accent/15 text-accent",
  completed: "bg-success/15 text-success",
  released: "bg-success/15 text-success",
  pending: "bg-warning/15 text-warning",
  validated: "bg-info/15 text-info",
  ok: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  fail: "bg-critical/15 text-critical",
  normal: "bg-success/15 text-success",
  high: "bg-warning/15 text-warning",
  low: "bg-info/15 text-info",
  critical: "bg-critical/15 text-critical",
  urgent: "bg-critical/15 text-critical",
};

const statusLabels: Record<string, string> = {
  registered: "Registrado",
  collected: "Recepção/Coleta",
  triaged: "Triagem",
  processing: "Processando",
  analyzed: "Analisado",
  completed: "Concluído",
  released: "Liberado",
  pending: "Pendente",
  validated: "Validado",
  ok: "OK",
  warning: "Alerta",
  fail: "Falha",
  normal: "Normal",
  high: "Alto",
  low: "Baixo",
  critical: "Crítico",
  urgent: "Urgente",
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusStyles[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
};

export default StatusBadge;
