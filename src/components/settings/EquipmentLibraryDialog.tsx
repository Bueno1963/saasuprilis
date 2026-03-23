import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, BookOpen, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName: string;
}

const CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "operacao", label: "Operação" },
  { value: "manutencao", label: "Manutenção" },
  { value: "calibracao", label: "Calibração" },
  { value: "troubleshooting", label: "Troubleshooting" },
  { value: "reagentes", label: "Reagentes" },
];

const EquipmentLibraryDialog = ({ open, onOpenChange, equipmentId, equipmentName }: Props) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("geral");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["equipment-library", equipmentId],
    enabled: !!equipmentId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_library")
        .select("*")
        .eq("equipment_id", equipmentId)
        .order("category")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addEntry = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("equipment_library").insert({
        equipment_id: equipmentId,
        question: question.trim(),
        answer: answer.trim(),
        category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipment-library", equipmentId] });
      setQuestion("");
      setAnswer("");
      setCategory("geral");
      setShowForm(false);
      toast.success("Registro adicionado à biblioteca!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment_library").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipment-library", equipmentId] });
      toast.success("Registro removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = search
    ? entries.filter(
        (e: any) =>
          e.question.toLowerCase().includes(search.toLowerCase()) ||
          e.answer.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: filtered.filter((e: any) => e.category === cat.value),
  })).filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Biblioteca — {equipmentName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pergunta ou resposta..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "default"}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Entrada
          </Button>
        </div>

        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pergunta</Label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex: Como calibrar o sensor de hemoglobina?"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Resposta</Label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Descreva o procedimento, dica ou solução..."
                rows={3}
                className="text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={() => addEntry.mutate()}
              disabled={!question.trim() || !answer.trim() || addEntry.isPending}
            >
              Salvar na Biblioteca
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <MessageSquareText className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search ? "Nenhum resultado encontrado." : "Nenhuma entrada na biblioteca. Adicione perguntas e respostas sobre o uso deste equipamento."}
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-1">
              {grouped.map((group) => (
                <div key={group.value} className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-3">
                    {group.label} ({group.items.length})
                  </p>
                  {group.items.map((entry: any) => (
                    <AccordionItem key={entry.id} value={entry.id} className="border rounded-lg px-3">
                      <AccordionTrigger className="text-sm text-left py-2.5 hover:no-underline">
                        <span className="pr-2">{entry.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-3">
                        <p className="whitespace-pre-wrap">{entry.answer}</p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t">
                          <span className="text-xs text-muted-foreground/60">
                            {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-destructive hover:text-destructive"
                            onClick={() => removeEntry.mutate(entry.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </div>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentLibraryDialog;
