import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Save, Trash2, Upload, X, PenTool } from "lucide-react";

interface Props { onBack: () => void; }

const DEFAULT_SECTORS = ["Bioquímica", "Hematologia", "Imunologia", "Microbiologia", "Parasitologia", "Uroanálise"];

interface SectorSigner {
  id?: string;
  sector: string;
  signer_name: string;
  registration_type: string;
  registration_number: string;
  signature_url: string;
  isNew?: boolean;
}

const SectorSignersSettings = ({ onBack }: Props) => {
  const qc = useQueryClient();
  const [newSector, setNewSector] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSector, setUploadingSector] = useState<string | null>(null);

  const { data: signers = [], isLoading } = useQuery({
    queryKey: ["sector_signers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sector_signers" as any)
        .select("*")
        .order("sector");
      if (error) throw error;
      return (data || []) as unknown as SectorSigner[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (signer: SectorSigner) => {
      const payload = {
        sector: signer.sector,
        signer_name: signer.signer_name,
        registration_type: signer.registration_type,
        registration_number: signer.registration_number,
        signature_url: signer.signature_url,
      };
      if (signer.id) {
        const { error } = await supabase.from("sector_signers" as any).update(payload).eq("id", signer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sector_signers" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sector_signers"] });
      toast.success("Assinante do setor salvo!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sector_signers" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sector_signers"] });
      toast.success("Assinante removido");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>, signer: SectorSigner) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 2MB"); return; }

    setUploadingSector(signer.sector);
    try {
      const ext = file.name.split(".").pop();
      const path = `sector/${signer.sector.replace(/\s/g, "_")}.${ext}`;
      const { error: upErr } = await supabase.storage.from("signatures").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(path);
      const sigUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      
      await upsertMutation.mutateAsync({ ...signer, signature_url: sigUrl });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingSector(null);
    }
  };

  const handleAddSector = () => {
    if (!newSector.trim()) return;
    upsertMutation.mutate({
      sector: newSector.trim(),
      signer_name: "",
      registration_type: "CRBM",
      registration_number: "",
      signature_url: "",
      isNew: true,
    });
    setNewSector("");
  };

  const usedSectors = new Set(signers.map(s => s.sector));
  const availableSectors = DEFAULT_SECTORS.filter(s => !usedSectors.has(s));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assinantes por Setor</h1>
          <p className="text-sm text-muted-foreground">Configure o responsável técnico e assinatura para cada setor do laudo</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenTool className="h-4 w-4" /> Responsáveis por Setor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new sector */}
          <div className="flex gap-2">
            <Select value={newSector} onValueChange={setNewSector}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar setor..." />
              </SelectTrigger>
              <SelectContent>
                {availableSectors.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Ou digitar setor personalizado..."
              value={availableSectors.includes(newSector) ? "" : newSector}
              onChange={e => setNewSector(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleAddSector} disabled={!newSector.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : signers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum assinante configurado. Quando não houver assinante específico, o analista que liberou o exame será usado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setor</TableHead>
                  <TableHead>Nome do Responsável</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Nº Registro</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signers.map((s) => (
                  <SignerRow
                    key={s.id || s.sector}
                    signer={s}
                    onSave={(updated) => upsertMutation.mutate(updated)}
                    onDelete={() => s.id && deleteMutation.mutate(s.id)}
                    onUploadSignature={handleSignatureUpload}
                    uploading={uploadingSector === s.sector}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function SignerRow({ signer, onSave, onDelete, onUploadSignature, uploading }: {
  signer: SectorSigner;
  onSave: (s: SectorSigner) => void;
  onDelete: () => void;
  onUploadSignature: (e: React.ChangeEvent<HTMLInputElement>, s: SectorSigner) => void;
  uploading: boolean;
}) {
  const [name, setName] = useState(signer.signer_name);
  const [regType, setRegType] = useState(signer.registration_type || "CRBM");
  const [regNum, setRegNum] = useState(signer.registration_number);
  const fileRef = useRef<HTMLInputElement>(null);
  const changed = name !== signer.signer_name || regType !== signer.registration_type || regNum !== signer.registration_number;

  return (
    <TableRow>
      <TableCell className="font-medium">{signer.sector}</TableCell>
      <TableCell>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" className="h-8" />
      </TableCell>
      <TableCell>
        <Select value={regType} onValueChange={setRegType}>
          <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CRBM">CRBM</SelectItem>
            <SelectItem value="CRM">CRM</SelectItem>
            <SelectItem value="CRF">CRF</SelectItem>
            <SelectItem value="CREA">CREA</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input value={regNum} onChange={e => setRegNum(e.target.value)} placeholder="Número" className="h-8 w-28" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {signer.signature_url ? (
            <img src={signer.signature_url} alt="Assinatura" className="h-8 w-16 object-contain border rounded" />
          ) : (
            <span className="text-xs text-muted-foreground">Sem imagem</span>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-3 w-3" />
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onUploadSignature(e, signer)} />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {changed && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSave({ ...signer, signer_name: name, registration_type: regType, registration_number: regNum })}>
              <Save className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default SectorSignersSettings;
