import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "success" | "warning" | "info" | "critical";
}

const variantStyles = {
  default: "border-border",
  success: "border-l-4 border-l-success",
  warning: "border-l-4 border-l-warning",
  info: "border-l-4 border-l-info",
  critical: "border-l-4 border-l-critical",
};

const iconVariants = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  critical: "bg-critical/10 text-critical",
};

const StatCard = ({ title, value, subtitle, icon: Icon, variant = "default" }: StatCardProps) => {
  return (
    <div className={cn("bg-card rounded-lg border p-5 shadow-sm", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-1 text-card-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconVariants[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
