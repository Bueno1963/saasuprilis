import { cn } from "@/lib/utils";
import { Check, FlaskConical, Microscope, BadgeCheck, TestTubes } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const STEPS = [
  { value: "collected", label: "Coletada", icon: TestTubes, doneColor: "bg-warning/30 text-warning ring-warning/50", currentColor: "bg-warning/40 text-warning ring-warning/60 shadow-warning/30" },
  { value: "triaged", label: "Triada", icon: FlaskConical, doneColor: "bg-info/30 text-info ring-info/50", currentColor: "bg-info/40 text-info ring-info/60 shadow-info/30" },
  { value: "processing", label: "Em Análise", icon: Microscope, doneColor: "bg-phase-analytical/30 text-phase-analytical ring-phase-analytical/50", currentColor: "bg-phase-analytical/40 text-phase-analytical ring-phase-analytical/60 shadow-phase-analytical/30" },
  { value: "analyzed", label: "Analisada", icon: BadgeCheck, doneColor: "bg-success/30 text-success ring-success/50", currentColor: "bg-success/40 text-success ring-success/60 shadow-success/30" },
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
                      isDone && `${step.doneColor} ring-1`,
                      isCurrent && `${step.currentColor} ring-2 shadow-sm`,
                      isFuture && "bg-muted text-muted-foreground/30",
                    )}
                  >
                    <Icon className={cn(compact ? "w-3.5 h-3.5" : "w-4 h-4", (isDone || isCurrent) && "stroke-[2.5]")} />
                    {isCurrent && (
                      <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse",
                        step.value === "collected" ? "bg-warning" : step.value === "triaged" ? "bg-info" : step.value === "processing" ? "bg-phase-analytical" : "bg-success"
                      )} />
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
                    idx < currentIdx ? "bg-success/60" : "bg-muted-foreground/15",
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
