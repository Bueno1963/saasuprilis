import { cn } from "@/lib/utils";
import { Check, FlaskConical, Microscope, BadgeCheck, TestTubes } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STEPS = [
  { value: "collected", label: "Coletada", icon: TestTubes },
  { value: "triaged", label: "Triada", icon: FlaskConical },
  { value: "processing", label: "Em Análise", icon: Microscope },
  { value: "analyzed", label: "Analisada", icon: BadgeCheck },
] as const;

function getStepIndex(status: string) {
  const idx = STEPS.findIndex(s => s.value === status);
  return idx === -1 ? 0 : idx;
}

interface SampleStatusStepperProps {
  status: string;
  onStatusChange?: (newStatus: string, previousStatus: string) => void;
  compact?: boolean;
}

const SampleStatusStepper = ({ status, onStatusChange, compact }: SampleStatusStepperProps) => {
  const currentIdx = getStepIndex(status);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-0.5">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;
          const Icon = isDone ? Check : step.icon;

          return (
            <div key={step.value} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={!onStatusChange}
                    onClick={() => {
                      if (onStatusChange && step.value !== status) {
                        onStatusChange(step.value, status);
                      }
                    }}
                    className={cn(
                      "relative flex items-center justify-center rounded-full transition-all duration-200",
                      compact ? "w-7 h-7" : "w-8 h-8",
                      onStatusChange && !isCurrent && "cursor-pointer hover:scale-110",
                      isDone && "bg-success/20 text-success ring-1 ring-success/30",
                      isCurrent && "bg-primary/20 text-primary ring-2 ring-primary/50 shadow-sm shadow-primary/20",
                      isFuture && "bg-muted text-muted-foreground/40",
                    )}
                  >
                    <Icon className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
                    {isCurrent && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{step.label}</p>
                  {isCurrent && <p className="text-muted-foreground">Status atual</p>}
                  {isDone && <p className="text-success">✓ Concluído</p>}
                  {isFuture && onStatusChange && <p className="text-muted-foreground">Clique para avançar</p>}
                </TooltipContent>
              </Tooltip>

              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 transition-all duration-300",
                    compact ? "w-3" : "w-5",
                    idx < currentIdx ? "bg-success/50" : "bg-muted",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default SampleStatusStepper;
