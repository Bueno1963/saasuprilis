import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, Search, FlaskConical, RefreshCw, Pencil, Save, X, Printer, PlusCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const MAXBIO_ANALYTES: Record<string, string> = {
  ALB: "Albumina", ALP: "Fosfatase Alcalina", ALT: "TGP (ALT)", AMY: "Amilase",
  ASO: "ASO (TURBID)", AST: "TGO (AST)", AUR: "Ácido Úrico",
  BILD: "Bilirruina Direta", BILT: "Bilirruina Toal",
  BUN: "Ureia", Ca: "Calcio", CA: "Cálcio",
  CHOL: "Colesterol Total", CK: "Creatina Quinase", CKMB: "CK-MB",
  COL: "Colesterol Total", CRE: "Creatinina", CREA: "Creatinina",
  CRP: "PCR (Proteína C Reativa)", DBIL: "Bilirrubina Direta",
  FE: "Ferro Sérico", FOS: "Fosforo", GGT: "Gama-GT",
  GLI: "Glicose", GLU: "Glicose", GT: "Gama GT",
  HBA1C: "Hemoglobina Glicada", HDL: "Colesterol HDL",
  LDH: "LDH",
  Lip: "Lipase", LIP: "Lipase", Mg: "Magnesio", MG: "Magnésio",
  NA: "Sódio", P: "Fósforo", PCR: "Proteína C Reativa",
  RF: "Fator Reumatoide", TBIL: "Bilirrubina Total",
  TG: "Triglicerídeos", TRI: "Triglicerídeos",
  UA: "Ácido Úrico", URE: "Ureia", VLDL: "VLDL-Colesterol",
};

const MAXCELL_ANALYTES: Record<string, string> = {
  RBC: "RBC", HGB: "HGB", HCT: "HCT",
  MCV: "MCV", MCH: "MCH", MCHC: "MCHC", RDW: "RDW",
  WBC: "WBC", BAST: "BAST", SEG: "SEG",
  NEU: "NEU", EOS: "EOS", BAS: "BAS",
  LYM: "LYM", MON: "MON", PLT: "PLT", MPV: "MPV",
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
  paramId?: string;
  examId?: string;
}

const ExamEquipmentValidation = ({ integrationId, equipmentName }: Props) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ lisCode: "", lisName: "", equipCode: "" });
  const [saving, setSaving] = useState(false);
  const [autoRegistering, setAutoRegistering] = useState(false);
  const isMaxBio = /maxbio/i.test(equipmentName);
  const isMaxCell = /maxcell/i.test(equipmentName);
  const isSupported = isMaxBio || isMaxCell;

  // Query exam_parameters with equip_code mappings
  const { data: params = [], isLoading } = useQuery({
    queryKey: ["exam-params-for-validation", equipmentName],
    queryFn: async () => {
      // First get exam IDs that belong to this equipment
      const sectorFilter = isMaxBio ? "Bioquímica" : isMaxCell ? "Hematologia" : null;
      let examQuery = supabase
        .from("exam_catalog")
        .select("id")
        .eq("status", "active");
      if (sectorFilter) {
        examQuery = examQuery.eq("sector", sectorFilter);
      }
      const { data: examsForSector } = await examQuery;
      if (!examsForSector || examsForSector.length === 0) return [];
      
      const examIds = examsForSector.map(e => e.id);
      const { data, error } = await supabase
        .from("exam_parameters")
        .select("id, exam_id, name, lis_code, lis_name, equip_code, equip_analyte, section")
        .in("exam_id", examIds)
        .order("equip_code");
      if (error) throw error;
      return data || [];
    },
  });

  // Also get exam_catalog entries for this equipment (for auto-register context)
  const { data: exams = [] } = useQuery({
    queryKey: ["exam-catalog-for-validation", equipmentName],
    queryFn: async () => {
      let query = supabase
        .from("exam_catalog")
        .select("id, code, name, sector, status, equipment")
        .eq("status", "active");
      if (isSupported) {
        query = query.ilike("equipment", `%${equipmentName}%`);
      }
      const { data, error } = await query.order("code");
      if (error) throw error;
      return data || [];
    },
  });

  const analyteMap = isMaxBio ? MAXBIO_ANALYTES : isMaxCell ? MAXCELL_ANALYTES : {};

  const rows = useMemo<ValidationRow[]>(() => {
    const result: ValidationRow[] = [];
    const matchedEquipCodes = new Set<string>();

    // Check each parameter's equip_code against equipment analyte map
    for (const param of params) {
      const eCode = (param.equip_code || "").toUpperCase();
      if (eCode && analyteMap[eCode]) {
        result.push({
          status: "matched",
          lisCode: param.lis_code || param.name,
          lisName: param.lis_name || param.name,
          equipCode: eCode,
          equipName: analyteMap[eCode],
          paramId: param.id,
          examId: param.exam_id,
        });
        matchedEquipCodes.add(eCode);
      } else if (eCode) {
        // Has equip_code but not in the known analyte map - still show
        result.push({
          status: "unmatched_lis",
          lisCode: param.lis_code || param.name,
          lisName: param.lis_name || param.name,
          equipCode: eCode,
          equipName: "Sem correspondência",
          paramId: param.id,
          examId: param.exam_id,
        });
      }
    }

    // Equipment codes not matched to any parameter
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

    result.sort((a, b) => {
      const codeA = (a.status === "unmatched_equip" ? a.equipCode : a.lisCode).toLowerCase();
      const codeB = (b.status === "unmatched_equip" ? b.equipCode : b.lisCode).toLowerCase();
      return codeA.localeCompare(codeB);
    });

    return result;
  }, [params, analyteMap]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.lisCode.toLowerCase().includes(s) ||
        r.lisName.toLowerCase().includes(s) ||
        r.equipCode.toLowerCase().includes(s)
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const matched = rows.filter((r) => r.status === "matched").length;
    const unmatchedLis = rows.filter((r) => r.status === "unmatched_lis").length;
    const unmatchedEquip = rows.filter((r) => r.status === "unmatched_equip").length;
    return { matched, unmatchedLis, unmatchedEquip, total: rows.length };
  }, [rows]);

  const handleAutoRegister = async () => {
    const unmatched = rows.filter((r) => r.status === "unmatched_equip");
    if (unmatched.length === 0) {
      toast.info("Todos os analitos já estão cadastrados.");
      return;
    }

    // Find an exam linked to this equipment to attach parameters
    const targetExam = exams[0];
    if (!targetExam) {
      toast.error("Nenhum exame encontrado vinculado a este equipamento. Cadastre um exame primeiro.");
      return;
    }

    setAutoRegistering(true);
    try {
      const newParams = unmatched.map((r, idx) => ({
        exam_id: targetExam.id,
        name: r.equipName,
        lis_code: r.equipCode,
        lis_name: r.equipName,
        equip_code: r.equipCode,
        equip_analyte: r.equipName,
        section: targetExam.sector || "",
        sort_order: (params.length + idx + 1),
      }));

      const { error } = await supabase.from("exam_parameters").insert(newParams);
      if (error) throw error;

      toast.success(`${unmatched.length} analitos cadastrados automaticamente no LIS`);
      queryClient.invalidateQueries({ queryKey: ["exam-params-for-validation", equipmentName] });
    } catch (err: any) {
      toast.error("Erro ao cadastrar: " + err.message);
    } finally {
      setAutoRegistering(false);
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["exam-params-for-validation", equipmentName] });
    queryClient.invalidateQueries({ queryKey: ["exam-catalog-for-validation", equipmentName] });
    toast.success("Dados atualizados");
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          <FlaskConical className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p>A validação de códigos está disponível para equipamentos com protocolo conhecido (MaxBIO200B, MaxCell 500D/500F, Dymind).</p>
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
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Validação de Códigos — LIS ↔ {equipmentName}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Compara os parâmetros cadastrados (exam_parameters) com os analitos reconhecidos pelo equipamento via OBR-4 / OBX-3.
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {stats.unmatchedEquip > 0 && (
                <Button
                  size="sm"
                  variant="default"
                  className="shrink-0 gap-1.5 text-xs"
                  disabled={autoRegistering}
                  onClick={handleAutoRegister}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {autoRegistering ? "Cadastrando..." : `Cadastrar ${stats.unmatchedEquip} analitos`}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5 text-xs"
                onClick={invalidateAll}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5 text-xs"
                onClick={() => {
                  const printContent = `
                    <html><head><title>Validação de Códigos — ${equipmentName}</title>
                    <style>
                      @page { size: A4 portrait; margin: 14mm; }
                      body { font-family: Arial, sans-serif; font-size: 9px; padding: 0; margin: 0; }
                      h2 { font-size: 13px; margin: 0 0 2px 0; }
                      .subtitle { color: #666; font-size: 8px; margin-bottom: 8px; }
                      table { width: 100%; border-collapse: collapse; margin-top: 6px; }
                      th, td { border: 1px solid #ccc; padding: 3px 6px; text-align: left; font-size: 8px; }
                      th { background: #f0f0f0; font-weight: 700; font-size: 8px; }
                      .matched { color: #16a34a; } .unmatched { color: #d97706; } .missing { color: #dc2626; }
                      .stats { margin-bottom: 6px; font-size: 8px; display: flex; gap: 12px; }
                      .footer { margin-top: 10px; font-size: 7px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 4px; }
                    </style></head><body>
                    <h2>Validação de Códigos — LIS ↔ ${equipmentName}</h2>
                    <div class="subtitle">Gerado em ${new Date().toLocaleString("pt-BR")}</div>
                    <div class="stats"><span>✅ ${stats.matched} vinculados</span><span>⚠️ ${stats.unmatchedLis} sem correspondência</span><span>✕ ${stats.unmatchedEquip} sem cadastro</span></div>
                     <table><thead><tr><th style="width:10%">Status</th><th style="width:20%">Código LIS</th><th style="width:40%">Nome no LIS</th><th style="width:30%">Código Equip.</th></tr></thead><tbody>
                     ${filtered.map(r => `<tr><td>${r.status === "matched" ? '<span class="matched">✅</span>' : r.status === "unmatched_lis" ? '<span class="unmatched">⚠️</span>' : '<span class="missing">✕</span>'}</td><td>${r.lisCode}</td><td>${r.lisName}</td><td>${r.equipCode}</td></tr>`).join("")}
                    </tbody></table>
                    <div class="footer">Documento gerado automaticamente pelo sistema LIS — Validação de interfaceamento</div>
                    </body></html>`;
                  const w = window.open("", "_blank");
                  if (w) { w.document.write(printContent); w.document.close(); setTimeout(() => w.print(), 300); }
                }}
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </Button>
            </div>
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
                <TableHead className="w-20 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                   <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Carregando parâmetros...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, i) => {
                  const isEditing = editingIdx === i;
                  return (
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
                      <TableCell>
                        {isEditing ? (
                          <Input value={editValues.lisCode} onChange={(e) => setEditValues(v => ({ ...v, lisCode: e.target.value }))} className="h-7 text-xs font-mono w-24" />
                        ) : (
                          <span className="font-mono text-xs">{row.lisCode}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input value={editValues.lisName} onChange={(e) => setEditValues(v => ({ ...v, lisName: e.target.value }))} className="h-7 text-xs w-40" />
                        ) : (
                          <span className="text-xs">{row.lisName}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input value={editValues.equipCode} onChange={(e) => setEditValues(v => ({ ...v, equipCode: e.target.value }))} className="h-7 text-xs font-mono w-24" />
                        ) : (
                          <Badge variant="outline" className="font-mono text-xs">{row.equipCode}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              disabled={saving}
                              onClick={async () => {
                                setSaving(true);
                                try {
                                  if (row.paramId) {
                                    const { error } = await supabase
                                      .from("exam_parameters")
                                      .update({
                                        lis_code: editValues.lisCode,
                                        lis_name: editValues.lisName,
                                        equip_code: editValues.equipCode,
                                      })
                                      .eq("id", row.paramId);
                                    if (error) throw error;
                                    toast.success("Registro atualizado com sucesso");
                                  } else {
                                    // Create new param for unmatched equipment analyte
                                    const targetExam = exams[0];
                                    if (!targetExam) {
                                      toast.error("Nenhum exame encontrado para vincular. Cadastre um exame primeiro.");
                                      setSaving(false);
                                      return;
                                    }
                                    const { error } = await supabase.from("exam_parameters").insert({
                                      exam_id: targetExam.id,
                                      name: editValues.lisName,
                                      lis_code: editValues.lisCode,
                                      lis_name: editValues.lisName,
                                      equip_code: editValues.equipCode,
                                      equip_analyte: "",
                                      section: targetExam.sector || "",
                                      sort_order: params.length + 1,
                                    });
                                    if (error) throw error;
                                    toast.success("Novo parâmetro cadastrado com sucesso");
                                  }
                                  setEditingIdx(null);
                                  queryClient.invalidateQueries({ queryKey: ["exam-params-for-validation", equipmentName] });
                                } catch (err: any) {
                                  toast.error("Erro ao salvar: " + err.message);
                                } finally {
                                  setSaving(false);
                                }
                              }}
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingIdx(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingIdx(i);
                                setEditValues({
                                  lisCode: row.lisCode === "—" ? "" : row.lisCode,
                                  lisName: row.lisName === "Não cadastrado no LIS" ? "" : row.lisName,
                                  equipCode: row.equipCode,
                                  equipName: row.equipName === "Sem correspondência" ? "" : row.equipName,
                                });
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {row.paramId && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir parâmetro</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Deseja excluir o parâmetro <strong>{row.lisName}</strong> ({row.equipCode})? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={async () => {
                                        try {
                                          const { error } = await supabase
                                            .from("exam_parameters")
                                            .delete()
                                            .eq("id", row.paramId!);
                                          if (error) throw error;
                                          toast.success("Parâmetro excluído com sucesso");
                                          queryClient.invalidateQueries({ queryKey: ["exam-params-for-validation", equipmentName] });
                                        } catch (err: any) {
                                          toast.error("Erro ao excluir: " + err.message);
                                        }
                                      }}
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1">
          <p className="text-xs text-muted-foreground">
            💡 Para vincular, o <strong className="text-foreground">equip_code</strong> do parâmetro deve ser <strong className="text-foreground">idêntico</strong> ao código do analito configurado no equipamento (OBR-4 / OBX-3).
          </p>
          <p className="text-xs text-muted-foreground">
            Analitos com ✕ podem ser cadastrados automaticamente clicando no botão acima.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamEquipmentValidation;
