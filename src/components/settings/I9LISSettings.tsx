import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Cpu, FolderInput, FolderOutput, Save, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import I9LISDocumentation from "@/components/settings/I9LISDocumentation";

interface Props { onBack: () => void; }

const STORAGE_KEY = "i9lis_config";

interface I9LISConfig {
  cargaPath: string;
  descargaPath: string;
  pollingInterval: string;
}

const I9LISSettings = ({ onBack }: Props) => {
  const [config, setConfig] = useState<I9LISConfig>({
    cargaPath: "",
    descargaPath: "",
    pollingInterval: "1",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setConfig(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    toast.success("Configurações I9LIS salvas com sucesso!");
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            I9LIS — Integração via Banco de Dados
          </h1>
          <p className="text-sm text-muted-foreground">Configuração das tabelas temporárias de Carga e Descarga</p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <span>
          <strong className="text-foreground">Integração recomendada:</strong> O sistema utiliza tabelas temporárias (I9LIS_CARGA e I9LIS_DESCARGA) para troca de dados com o I9LIS Interface. 
          Defina abaixo os caminhos de rede para as pastas de carga e descarga.
        </span>
      </div>

      {/* ── CONFIGURAÇÃO CARGA/DESCARGA ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderInput className="h-5 w-5 text-primary" />
              Carga (LIS → I9LIS)
            </CardTitle>
            <p className="text-xs text-foreground/70">
              O LIS popula a tabela I9LIS_CARGA com pedidos de exames. O I9LIS Interface verifica a cada intervalo configurado.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Caminho da pasta de Carga</Label>
              <Input
                placeholder="Ex: \\servidor\i9lis\carga"
                value={config.cargaPath}
                onChange={(e) => setConfig(p => ({ ...p, cargaPath: e.target.value }))}
              />
            </div>
            <div className="bg-muted/40 rounded p-2 text-xs text-foreground/70 space-y-1">
              <p><strong>Fluxo:</strong> LIS grava pedidos → I9LIS processa e apaga → envia ao aparelho</p>
              <p><strong>Tabela:</strong> I9LIS_CARGA (AMOSTRA, ORDEM, REG_PAC, NOME, COD_EXAME…)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOutput className="h-5 w-5 text-primary" />
              Descarga (I9LIS → LIS)
            </CardTitle>
            <p className="text-xs text-foreground/70">
              O I9LIS Interface grava os resultados na tabela I9LIS_DESCARGA. O LIS consome e limpa periodicamente.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Caminho da pasta de Descarga</Label>
              <Input
                placeholder="Ex: \\servidor\i9lis\descarga"
                value={config.descargaPath}
                onChange={(e) => setConfig(p => ({ ...p, descargaPath: e.target.value }))}
              />
            </div>
            <div className="bg-muted/40 rounded p-2 text-xs text-foreground/70 space-y-1">
              <p><strong>Fluxo:</strong> Aparelho analisa → I9LIS grava resultados → LIS consome e limpa</p>
              <p><strong>Tabela:</strong> I9LIS_DESCARGA (AMOSTRA, ORDEM, COD_EXAME, RESULTADO…)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-1.5 w-48">
          <Label className="text-xs">Intervalo de verificação (min)</Label>
          <Input
            type="number"
            min={1}
            max={60}
            value={config.pollingInterval}
            onChange={(e) => setConfig(p => ({ ...p, pollingInterval: e.target.value }))}
          />
        </div>
        <Button onClick={handleSave} className="mt-5">
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>

      {/* ── DOCUMENTAÇÃO TÉCNICA ── */}
      <I9LISDocumentation />
    </div>
  );
};

export default I9LISSettings;
