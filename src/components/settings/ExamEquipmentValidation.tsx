import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, AlertTriangle, Search, FlaskConical } from "lucide-react";

/**
 * Known analyte codes for the MaxBIO200B analyzer.
 * These are the test identifiers the equipment sends/receives in OBR-4 / OBX-3.
 */
const MAXBIO_ANALYTES: Record<string, string> = {
  GLU: "Glicose",
  ALT: "ALT (TGP)",
  AST: "AST (TGO)",
  TP: "Proteínas Totais",
  ALB: "Albumina",
  BUN: "Ureia",
  CREA: "Creatinina",
  UA: "Ácido Úrico",
  CHOL: "Colesterol Total",
  TG: "Triglicerídeos",
  HDL: "HDL-Colesterol",
  LDL: "LDL-Colesterol",
  VLDL: "VLDL-Colesterol",
  TBIL: "Bilirrubina Total",
  DBIL: "Bilirrubina Direta",
  ALP: "Fosfatase Alcalina",
  GGT: "Gama-GT",
  AMY: "Amilase",
  LIP: "Lipase",
  CK: "Creatina Quinase",
  CKMB: "CK-MB",
  LDH: "Desidrogenase Láctica",
  FE: "Ferro Sérico",
  CA: "Cálcio",
  MG: "Magnésio",
  P: "Fósforo",
  NA: "Sódio",
  K: "Potássio",
  CL: "Cloreto",
  CRP: "PCR (Proteína C Reativa)",
  RF: "Fator Reumatoide",
  ASO: "ASLO",
  HBA1C: "Hemoglobina Glicada",
};

interface Props {
  integrationId: string | null;
  equipmentName: string;
}

type MatchStatus = "matched" | "unmatched_lis" | "unmatched_equip";

interface ValidationRow {
  status: MatchStatus;
  lisCode: string;
  lisName: string;
  equipCode: string;
  equipName: string;
}

const ExamEquipmentValidation = ({ integrationId, equipmentName }: Props) => {
  const [search, setSearch] = useState("");

  const isMaxBio = /maxbio/i.test(equipmentName);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exam-catalog-for-validation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_catalog")
        .select("code, name, sector, status")
        .eq("status", "active")
        .order("code");
      if (error) throw error;
      return data || [];
    },
  });

  const analyteMap = isMaxBio ? MAXBIO_ANALYTES : {};

  const rows = useMemo<ValidationRow[]>(() => {
    const result: ValidationRow[] = [];
    const matchedEquipCodes = new Set<string>();

    // Check each LIS exam against equipment codes
    for (const exam of exams) {
      const code = exam.code.toUpperCase();
      if (analyteMap[code]) {
        result.push({
          status: "matched",
          lisCode: exam.code,
          lisName: exam.name,
          equipCode: code,
          equipName: analyteMap[code],
        });
        matchedEquipCodes.add(code);
      } else {
        result.push({
          status: "unmatched_lis",
          lisCode: exam.code,
          lisName: exam.name,
          equipCode: "—",
          equipName: "Sem correspondência",
        });
      }
    }

    // Equipment codes not matched to any LIS exam
    for (const [code, name] of Object.entries(analyteMap)) {
      if (!matchedEquipCodes.has(code)) {
        result.push({
          status: "unmatched_equip",
          lisCode: "—",
          lisName: "Não cadastrado no LIS",
          equipCode: code,
          equipName: name,
        });
      }
    }

    return result;
  }, [exams, analyteMap]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.lisCode.toLowerCase().includes(s) ||
        r.lisName.toLowerCase().includes(s) ||
        r.equipCode.toLowerCase().includes(s) ||
        r.equipName.toLowerCase().includes(s)
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const matched = rows.filter((r) => r.status === "matched").length;
    const unmatchedLis = rows.filter((r) => r.status === "unmatched_lis").length;
    const unmatchedEquip = rows.filter((r) => r.status === "unmatched_equip").length;
    return { matched, unmatchedLis, unmatchedEquip, total: rows.length };
  }, [rows]);

  if (!isMaxBio) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          <FlaskConical className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p>A validação de códigos está disponível para equipamentos com protocolo conhecido (MaxBIO200B, MaxCell, Dymind).</p>
          <p className="mt-1 text-xs">Selecione uma integração com equipamento compatível.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Validação de Códigos — LIS ↔ {equipmentName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Compara os códigos do Catálogo de Exames (LIS) com os analitos reconhecidos pelo equipamento via OBR-4 / OBX-3.
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {stats.matched} vinculados
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              {stats.unmatchedLis} sem correspondência no equipamento
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              {stats.unmatchedEquip} do equipamento sem cadastro no LIS
            </Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código ou nome..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Status</TableHead>
                <TableHead>Código LIS</TableHead>
                <TableHead>Nome no LIS</TableHead>
                <TableHead>Código Equipamento</TableHead>
                <TableHead>Analito no Equipamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Carregando catálogo de exames...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, i) => (
                  <TableRow
                    key={`${row.lisCode}-${row.equipCode}-${i}`}
                    className={
                      row.status === "matched"
                        ? ""
                        : row.status === "unmatched_equip"
                        ? "bg-destructive/5"
                        : "bg-amber-500/5"
                    }
                  >
                    <TableCell>
                      {row.status === "matched" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {row.status === "unmatched_lis" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {row.status === "unmatched_equip" && <XCircle className="h-4 w-4 text-destructive" />}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.lisCode}</TableCell>
                    <TableCell className="text-xs">{row.lisName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {row.equipCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.equipName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1">
          <p className="text-xs text-muted-foreground">
            💡 Para vincular, o <strong className="text-foreground">código do exame no Catálogo</strong> deve ser <strong className="text-foreground">idêntico</strong> ao código do analito configurado no equipamento (OBR-4).
          </p>
          <p className="text-xs text-muted-foreground">
            Exames com ⚠️ precisam ter o código ajustado no Catálogo. Analitos com ✕ precisam ser cadastrados no LIS.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamEquipmentValidation;
