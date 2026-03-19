import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

interface SendToEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  samples: any[];
  sector: string;
}

const SendToEquipmentDialog = ({ open, onOpenChange, samples, sector }: SendToEquipmentDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [selectedSampleIds, setSelectedSampleIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment-list-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("id, name, protocol, status")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations")
        .select("id, name, type, status")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const toggleSample = (id: string) => {
    setSelectedSampleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSampleIds(new Set(samples.map(s => s.id)));
    } else {
      setSelectedSampleIds(new Set());
    }
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      const selectedEquip = equipment.find(e => e.id === selectedEquipmentId);
      if (!selectedEquip) throw new Error("Equipamento não encontrado");

      const samplesToSend = samples.filter(s => selectedSampleIds.has(s.id));
      if (samplesToSend.length === 0) throw new Error("Nenhuma amostra selecionada");

      // Find matching integration for this equipment
      const matchingIntegration = integrations.find(
        i => i.name === selectedEquip.name
      );

      // Update samples status to 'processing'
      const { error: updateError } = await supabase
        .from("samples")
        .update({ status: "processing" })
        .in("id", samplesToSend.map(s => s.id));
      if (updateError) throw updateError;

      // Log the sync event
      if (matchingIntegration) {
        const { error: logError } = await supabase
          .from("integration_sync_logs")
          .insert({
            integration_id: matchingIntegration.id,
            status: "success",
            direction: "outbound",
            source_system: "LIS",
            destination_system: selectedEquip.name,
            message: `Envio forçado de ${samplesToSend.length} amostra(s) do setor ${sector} para ${selectedEquip.name}`,
            records_created: samplesToSend.length,
            records_updated: 0,
            records_failed: 0,
            duration_ms: 0,
          });
        if (logError) console.warn("Erro ao registrar log:", logError.message);
      }

      // Update integration last_sync
      if (matchingIntegration) {
        await supabase
          .from("integrations")
          .update({ last_sync: new Date().toISOString() })
          .eq("id", matchingIntegration.id);
      }

      return { count: samplesToSend.length, equipName: selectedEquip.name };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success(`${result.count} amostra(s) enviada(s) para ${result.equipName}`);
      onOpenChange(false);
      setSelectedSampleIds(new Set());
      setSelectedEquipmentId("");
      setSelectAll(false);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao enviar amostras"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar Amostras para Equipamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Equipamento de Destino *</Label>
            <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o equipamento..." />
              </SelectTrigger>
              <SelectContent>
                {equipment.map(eq => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.name} {eq.protocol ? `(${eq.protocol})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Amostras do setor: <span className="font-semibold">{sector}</span></Label>
              <Badge variant="secondary">{selectedSampleIds.size} / {samples.length}</Badge>
            </div>

            <div className="flex items-center gap-2 pb-1">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
              />
              <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">Selecionar todas</label>
            </div>

            <div className="max-h-48 overflow-y-auto border rounded-md divide-y divide-border">
              {samples.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma amostra neste setor</p>
              ) : (
                samples.map(s => (
                  <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer">
                    <Checkbox
                      checked={selectedSampleIds.has(s.id)}
                      onCheckedChange={() => toggleSample(s.id)}
                    />
                    <span className="font-mono text-xs">{s.barcode}</span>
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {(s.orders as any)?.patients?.name || "—"}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !selectedEquipmentId || selectedSampleIds.size === 0}
            className="gap-2"
          >
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar {selectedSampleIds.size > 0 ? `(${selectedSampleIds.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendToEquipmentDialog;
