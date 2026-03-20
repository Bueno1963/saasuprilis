import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, FlaskConical } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sector: string;
  materials: string[];
}

const SampleConditionsDialog = ({ open, onOpenChange, sector, materials }: Props) => {
  const qc = useQueryClient();
  const [activeMaterial, setActiveMaterial] = useState<string>(materials[0] || "");
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (open && materials.length > 0 && !materials.includes(activeMaterial)) {
      setActiveMaterial(materials[0]);
    }
  }, [open, materials]);

  const { data: conditions = [], isLoading } = useQuery({
    queryKey: ["sample-condition-options", sector],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sample_condition_options")
        .select("*")
        .eq("sector", sector)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const materialConditions = conditions.filter(c => c.material === activeMaterial);

  const addMutation = useMutation({
    mutationFn: async () => {
      const trimVal = newValue.trim().toLowerCase().replace(/\s+/g, "_");
      const trimLabel = newLabel.trim();
      if (!trimVal || !trimLabel) throw new Error("Preencha valor e rótulo");
      const maxOrder = materialConditions.reduce((max, c) => Math.max(max, c.sort_order), 0);
      const { error } = await supabase.from("sample_condition_options").insert({
        material: activeMaterial,
        sector,
        condition_value: trimVal,
        condition_label: trimLabel,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sample-condition-options", sector] });
      setNewValue("");
      setNewLabel("");
      toast.success("Condição adicionada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sample_condition_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sample-condition-options", sector] });
      toast.success("Condição removida");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sectorMaterials = materials.length > 0 ? materials : ["Sangue"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            Condições de Amostra — {sector}
          </DialogTitle>
          <DialogDescription>
            Configure as condições disponíveis para cada tipo de material neste setor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mt-2">
          {sectorMaterials.map(m => (
            <Badge
              key={m}
              variant={activeMaterial === m ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 text-sm"
              onClick={() => setActiveMaterial(m)}
            >
              {m}
            </Badge>
          ))}
        </div>

        <div className="space-y-3 mt-4">
          <Label className="text-sm font-semibold">
            Condições para <span className="text-primary">{activeMaterial}</span>
          </Label>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : materialConditions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4 text-center">
              Nenhuma condição personalizada. As condições padrão do sistema serão usadas.
            </p>
          ) : (
            <div className="space-y-1.5">
              {materialConditions.map(c => (
                <div key={c.id} className="flex items-center gap-2 bg-muted/30 rounded-md px-3 py-2">
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                  <span className="font-mono text-xs text-muted-foreground w-32 truncate">{c.condition_value}</span>
                  <span className="text-sm flex-1">{c.condition_label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeMutation.mutate(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-3 space-y-2">
            <Label className="text-xs text-muted-foreground">Adicionar nova condição</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Rótulo (ex: Hemolisada)"
                value={newLabel}
                onChange={e => {
                  setNewLabel(e.target.value);
                  if (!newValue || newValue === newLabel.trim().toLowerCase().replace(/\s+/g, "_")) {
                    setNewValue(e.target.value.trim().toLowerCase().replace(/\s+/g, "_"));
                  }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                disabled={!newLabel.trim() || addMutation.isPending}
                onClick={() => addMutation.mutate()}
              >
                <Plus className="h-4 w-4 mr-1" />Adicionar
              </Button>
            </div>
            <Input
              placeholder="Valor interno (auto-gerado)"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="text-xs font-mono"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SampleConditionsDialog;
