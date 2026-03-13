import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, CheckCircle2, Clock, Edit2, AlertTriangle } from "lucide-react";

interface POPViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pop: any;
  categories: { value: string; label: string }[];
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  vigente: { label: "Vigente", variant: "default" },
  rascunho: { label: "Rascunho", variant: "outline" },
  em_revisao: { label: "Em Revisão", variant: "secondary" },
  obsoleto: { label: "Obsoleto", variant: "destructive" },
};

const Section = ({ title, content }: { title: string; content?: string }) => {
  if (!content) return null;
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
};

const POPViewDialog = ({ open, onOpenChange, pop, categories }: POPViewDialogProps) => {
  if (!pop) return null;

  const statusCfg = STATUS_MAP[pop.status] || STATUS_MAP.rascunho;
  const catLabel = categories.find((c) => c.value === pop.category)?.label || pop.category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <DialogTitle className="text-lg">{pop.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-muted-foreground">{pop.code}</span>
                <span className="text-xs text-muted-foreground">• v{pop.version}</span>
                <Badge variant={statusCfg.variant} className="text-[10px]">{statusCfg.label}</Badge>
                <Badge variant="outline" className="text-[10px]">{catLabel}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="space-y-5">
          {pop.sector && (
            <div className="text-sm">
              <span className="font-semibold">Setor: </span>
              <span className="text-muted-foreground">{pop.sector}</span>
            </div>
          )}

          <Section title="1. Objetivo" content={pop.objective} />
          <Section title="2. Abrangência / Escopo" content={pop.scope} />
          <Section title="3. Responsabilidades" content={pop.responsibilities} />
          <Section title="4. Materiais e Equipamentos" content={pop.materials} />
          <Section title="5. Procedimento" content={pop.procedure_steps} />
          <Section title="6. Cuidados de Biossegurança" content={pop.safety_notes} />
          <Section title="7. Referências Normativas" content={pop.references_docs} />

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            {pop.effective_date && (
              <div>
                <span className="font-medium text-foreground">Data de Vigência: </span>
                {new Date(pop.effective_date).toLocaleDateString("pt-BR")}
              </div>
            )}
            {pop.next_review_date && (
              <div>
                <span className="font-medium text-foreground">Próxima Revisão: </span>
                {new Date(pop.next_review_date).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>

          <Section title="Histórico de Revisões" content={pop.revision_history} />

          <div className="text-[10px] text-muted-foreground pt-2 border-t">
            Documento elaborado conforme RDC 978/2025 — ANVISA
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default POPViewDialog;
