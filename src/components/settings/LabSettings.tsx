import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

interface Props { onBack: () => void; }

interface LabForm {
  name: string; cnpj: string; technical_responsible: string; crm_responsible: string;
  phone: string; email: string; address: string; city: string; state: string; zip_code: string;
}

const LabSettings = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm<LabForm>();

  const { data, isLoading } = useQuery({
    queryKey: ["lab_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_settings").select("*").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) reset(data as any);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: LabForm) => {
      const { error } = await supabase.from("lab_settings").update(values).eq("id", data!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab_settings"] }); toast.success("Dados do laboratório salvos!"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando...</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laboratório</h1>
          <p className="text-sm text-muted-foreground">Dados cadastrais do laboratório</p>
        </div>
      </div>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Informações Gerais</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Nome do Laboratório</Label><Input {...register("name")} /></div>
            <div className="space-y-1"><Label>CNPJ</Label><Input {...register("cnpj")} /></div>
            <div className="space-y-1"><Label>Responsável Técnico</Label><Input {...register("technical_responsible")} /></div>
            <div className="space-y-1"><Label>CRM</Label><Input {...register("crm_responsible")} /></div>
            <div className="space-y-1"><Label>Telefone</Label><Input {...register("phone")} /></div>
            <div className="space-y-1"><Label>E-mail</Label><Input {...register("email")} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3 space-y-1"><Label>Endereço</Label><Input {...register("address")} /></div>
            <div className="space-y-1"><Label>Cidade</Label><Input {...register("city")} /></div>
            <div className="space-y-1"><Label>Estado</Label><Input {...register("state")} /></div>
            <div className="space-y-1"><Label>CEP</Label><Input {...register("zip_code")} /></div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={mutation.isPending}><Save className="h-4 w-4 mr-2" />Salvar</Button>
      </form>
    </div>
  );
};

export default LabSettings;
