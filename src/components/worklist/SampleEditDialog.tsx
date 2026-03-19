import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { autoSendTriagedSample } from "@/hooks/useAutoSendToEquipment";

interface SampleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sample: any;
  sectors: string[];
}

const STATUS_OPTIONS = [
  { value: "collected", label: "Coletada" },
  { value: "triaged", label: "Triada" },
  { value: "processing", label: "Em Análise" },
  { value: "analyzed", label: "Analisada" },
  { value: "released", label: "Liberada" },
];

const SampleEditDialog = ({ open, onOpenChange, sample, sectors }: SampleEditDialogProps) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(sample?.status ?? "collected");
  const [sector, setSector] = useState(sample?.sector ?? "");

  useEffect(() => {
    if (sample) {
      setStatus(sample.status);
      setSector(sample.sector);
    }
  }, [sample]);

  // Fetch results for this sample
  const { data: results = [] } = useQuery({
    queryKey: ["sample_results", sample?.id],
    enabled: !!sample?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*")
        .eq("sample_id", sample.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const [editedResults, setEditedResults] = useState<Record<string, string>>({});

  useEffect(() => {
    if (results.length > 0) {
      const map: Record<string, string> = {};
      results.forEach((r: any) => { map[r.id] = r.value; });
      setEditedResults(map);
    }
  }, [results.length, sample?.id]);

  const updateSampleMutation = useMutation({
    mutationFn: async () => {
      // Update sample status and sector
      const { error: sampleError } = await supabase
        .from("samples")
        .update({ status, sector })
        .eq("id", sample.id);
      if (sampleError) throw sampleError;

      // Update results values
      for (const result of results) {
        const newValue = editedResults[result.id];
        if (newValue !== undefined && newValue !== result.value) {
          const { error } = await supabase
            .from("results")
            .update({ value: newValue })
            .eq("id", result.id);
          if (error) throw error;
        }
      }
      // Auto-send to equipment if status changed to "triaged"
      if (status === "triaged" && sample.status !== "triaged") {
        const sentTo = await autoSendTriagedSample({
          id: sample.id,
          barcode: sample.barcode,
          sector,
          orders: sample.orders,
        });
        if (sentTo && sentTo.length > 0) {
          toast.success(`Amostra enviada automaticamente para: ${sentTo.join(", ")}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["sample_results", sample?.id] });
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Amostra atualizada com sucesso");
      onOpenChange(false);
    },
    onError: () => toast.error("Erro ao atualizar amostra"),
  });

  if (!sample) return null;

  const patientName = (sample.orders as any)?.patients?.name ?? "—";
  const orderNumber = (sample.orders as any)?.order_number ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Amostra — {sample.barcode}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Paciente:</span>
              <p className="font-medium">{patientName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pedido:</span>
              <p className="font-medium">{orderNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results editing */}
          {results.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Resultados</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="text-sm min-w-[120px] truncate">{r.exam}</span>
                    <Input
                      className="h-8"
                      value={editedResults[r.id] ?? ""}
                      onChange={e => setEditedResults(prev => ({ ...prev, [r.id]: e.target.value }))}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{r.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button onClick={() => updateSampleMutation.mutate()} disabled={updateSampleMutation.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SampleEditDialog;
