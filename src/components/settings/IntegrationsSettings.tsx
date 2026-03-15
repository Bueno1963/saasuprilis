import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import IntegrationsListPage from "./IntegrationsListPage";

interface Props { onBack: () => void; }

const IntegrationsSettings = ({ onBack }: Props) => {
  const [showDocs, setShowDocs] = useState(false);

  return (
    <IntegrationsListPage
      onBack={onBack}
      docsSlot={
        <Card className="border-border">
          <CardContent className="p-0">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between px-5 py-4 h-auto"
              onClick={() => setShowDocs(!showDocs)}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Padrões Técnicos (ASTM, HL7, FHIR, TISS)</span>
              </div>
              {showDocs ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </Button>
            {showDocs && (
              <div className="px-5 pb-5 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Protocolos padronizados para comunicação entre equipamentos e LIS:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold">ASTM</Badge>
                      <span className="text-xs text-muted-foreground">American Society for Testing and Materials</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li><strong className="text-foreground">E1381</strong> — Camada de transporte.</li>
                      <li><strong className="text-foreground">E1394</strong> — Estrutura de mensagens.</li>
                      <li><strong className="text-foreground">LIS2-A2 (CLSI)</strong> — Evolução do ASTM E1394.</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold">HL7 / FHIR</Badge>
                      <span className="text-xs text-muted-foreground">Health Level Seven</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-3 list-disc">
                      <li><strong className="text-foreground">HL7 v2.x</strong> — ORM, ORU, ADT.</li>
                      <li><strong className="text-foreground">FHIR R4/R5</strong> — REST/JSON moderno.</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold">POCT1-A</Badge>
                      <span className="text-xs text-muted-foreground">Point-of-Care Testing</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Conectividade de dispositivos POCT ao LIS/EMR.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold">TISS</Badge>
                      <span className="text-xs text-muted-foreground">ANS — Saúde Suplementar</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Guias SP/SADT, Tabela TUSS, faturamento eletrônico.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      }
    />
  );
};

export default IntegrationsSettings;
