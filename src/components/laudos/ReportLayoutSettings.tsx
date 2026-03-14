import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";

interface Props {
  examId: string;
  examName: string;
}

interface LayoutForm {
  hide_reference_range: boolean;
  hide_flag: boolean;
  hide_unit: boolean;
  header_text: string;
  footer_text: string;
  default_observations: string;
}

const defaultForm: LayoutForm = {
  hide_reference_range: false,
  hide_flag: false,
  hide_unit: false,
  header_text: "",
  footer_text: "",
  default_observations: "",
};

const ReportLayoutSettings = ({ examId, examName }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<LayoutForm>(defaultForm);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: layout, isLoading } = useQuery({
    queryKey: ["report-layout", examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_layouts" as any)
        .select("*")
        .eq("exam_id", examId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (layout) {
      setForm({
        hide_reference_range: layout.hide_reference_range ?? false,
        hide_flag: layout.hide_flag ?? false,
        hide_unit: layout.hide_unit ?? false,
        header_text: layout.header_text ?? "",
        footer_text: layout.footer_text ?? "",
        default_observations: layout.default_observations ?? "",
      });
    } else {
      setForm(defaultForm);
    }
    setHasChanges(false);
  }, [layout]);

  const updateField = <K extends keyof LayoutForm>(key: K, value: LayoutForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (layout?.id) {
        const { error } = await supabase
          .from("report_layouts" as any)
          .update(form)
          .eq("id", layout.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("report_layouts" as any)
          .insert({ ...form, exam_id: examId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["report-layout", examId] });
      qc.invalidateQueries({ queryKey: ["report-layouts-all"] });
      toast.success("Layout de impressão salvo");
      setHasChanges(false);
    },
    onError: () => toast.error("Erro ao salvar layout"),
  });

  if (isLoading) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
          Layout de Impressão — {examName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Column visibility */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Colunas visíveis no PDF</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm cursor-pointer">Ocultar Referências</Label>
              <Switch
                checked={form.hide_reference_range}
                onCheckedChange={(v) => updateField("hide_reference_range", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm cursor-pointer">Ocultar Flag</Label>
              <Switch
                checked={form.hide_flag}
                onCheckedChange={(v) => updateField("hide_flag", v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="text-sm cursor-pointer">Ocultar Unidade</Label>
              <Switch
                checked={form.hide_unit}
                onCheckedChange={(v) => updateField("hide_unit", v)}
              />
            </div>
          </div>
        </div>

        {/* Header / Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide">Texto do Cabeçalho</Label>
            <Input
              value={form.header_text}
              onChange={(e) => updateField("header_text", e.target.value)}
              placeholder="Texto adicional no cabeçalho do laudo"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide">Texto do Rodapé</Label>
            <Input
              value={form.footer_text}
              onChange={(e) => updateField("footer_text", e.target.value)}
              placeholder="Texto adicional no rodapé do laudo"
            />
          </div>
        </div>

        {/* Default observations */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide">Observações Padrão</Label>
          <Textarea
            value={form.default_observations}
            onChange={(e) => updateField("default_observations", e.target.value)}
            placeholder="Texto padrão de observações que será incluído automaticamente no laudo deste exame"
            rows={3}
          />
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
            <Save className="w-4 h-4 mr-1" /> Salvar Layout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportLayoutSettings;
