import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Save, Upload, X, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Props { onBack: () => void; }

interface LabForm {
  name: string; cnpj: string; technical_responsible: string; crm_responsible: string;
  phone: string; email: string; address: string; city: string; state: string; zip_code: string;
  daily_appointment_limit: number;
}

const LabSettings = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm<LabForm>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#1e40af");
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["lab_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_settings").select("*").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch tenant branding
  const { data: tenant } = useQuery({
    queryKey: ["tenant_branding_settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: membership } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).limit(1).single();
      if (!membership) return null;
      const { data: t } = await supabase.from("tenants").select("id, logo_url, primary_color").eq("id", membership.tenant_id).single();
      return t;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (data) reset(data as any);
  }, [data, reset]);

  useEffect(() => {
    if (tenant) {
      setLogoPreview(tenant.logo_url || null);
      setPrimaryColor(tenant.primary_color || "#1e40af");
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: async (values: LabForm) => {
      const { error } = await supabase.from("lab_settings").update(values).eq("id", data!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lab_settings"] }); toast.success("Dados do laboratório salvos!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 2MB"); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${tenant.id}/logo.${ext}`;

      const { error: upErr } = await supabase.storage.from("tenant-logos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("tenant-logos").getPublicUrl(path);
      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase.from("tenants").update({ logo_url: logoUrl }).eq("id", tenant.id);
      await supabase.from("lab_settings").update({ logo_url: logoUrl }).eq("id", data!.id);

      setLogoPreview(logoUrl);
      qc.invalidateQueries({ queryKey: ["tenant_branding"] });
      toast.success("Logo atualizado!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!tenant) return;
    await supabase.from("tenants").update({ logo_url: "" }).eq("id", tenant.id);
    await supabase.from("lab_settings").update({ logo_url: "" }).eq("id", data!.id);
    setLogoPreview(null);
    qc.invalidateQueries({ queryKey: ["tenant_branding"] });
    toast.success("Logo removido");
  };

  const handleColorSave = async () => {
    if (!tenant) return;
    const { error } = await supabase.from("tenants").update({ primary_color: primaryColor }).eq("id", tenant.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["tenant_branding"] });
    toast.success("Cor primária atualizada!");
  };

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando...</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laboratório</h1>
          <p className="text-sm text-muted-foreground">Dados cadastrais e personalização visual</p>
        </div>
      </div>

      {/* Branding Section */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" />Identidade Visual</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div className="space-y-3">
              <Label>Logo do Laboratório</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img src={logoPreview} alt="Logo" className="h-20 w-20 object-contain rounded-lg border border-border bg-background p-1" />
                    <button onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
                <div>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? "Enviando..." : "Enviar Logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 2MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
              </div>
            </div>

            {/* Color */}
            <div className="space-y-3">
              <Label>Cor Primária</Label>
              <div className="flex items-center gap-3">
                <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-14 h-10 p-1 cursor-pointer" />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-28 font-mono text-sm" />
                <Button size="sm" onClick={handleColorSave}>Aplicar</Button>
              </div>
              <div className="flex gap-2 mt-2">
                {["#1e40af", "#059669", "#dc2626", "#7c3aed", "#d97706", "#0891b2"].map(c => (
                  <button key={c} onClick={() => setPrimaryColor(c)} className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110" style={{ backgroundColor: c, borderColor: primaryColor === c ? "currentColor" : "transparent" }} />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
        <Card>
          <CardHeader><CardTitle className="text-base">Agendamento</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Limite de atendimentos por dia</Label>
              <Input type="number" min={0} {...register("daily_appointment_limit", { valueAsNumber: true })} />
              <p className="text-xs text-muted-foreground">0 = sem limite</p>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={mutation.isPending}><Save className="h-4 w-4 mr-2" />Salvar</Button>
      </form>
    </div>
  );
};

export default LabSettings;
