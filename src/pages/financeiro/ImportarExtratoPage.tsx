import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, FileText, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  selected: boolean;
  debit_account_id: string;
  credit_account_id: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  is_group: boolean;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// OFX Parser
function parseOFX(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(text)) !== null) {
    const block = match[1];

    const getVal = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"));
      return m ? m[1].trim() : "";
    };

    const trnType = getVal("TRNTYPE");
    const dtPosted = getVal("DTPOSTED");
    const amount = parseFloat(getVal("TRNAMT") || "0");
    const memo = getVal("MEMO") || getVal("NAME") || "Sem descrição";

    // Parse date YYYYMMDD
    let date = "";
    if (dtPosted.length >= 8) {
      date = `${dtPosted.substring(0, 4)}-${dtPosted.substring(4, 6)}-${dtPosted.substring(6, 8)}`;
    }

    transactions.push({
      date,
      description: memo,
      amount: Math.abs(amount),
      type: amount >= 0 ? "credit" : "debit",
      selected: true,
      debit_account_id: "",
      credit_account_id: "",
    });
  }

  return transactions;
}

const ImportarExtratoPage = () => {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [defaultDebitAccount, setDefaultDebitAccount] = useState("");
  const [defaultCreditAccount, setDefaultCreditAccount] = useState("");
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ["coa_import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("id, code, name, type, is_group")
        .eq("status", "active")
        .order("code");
      if (error) throw error;
      return data as Account[];
    },
  });

  const leafAccounts = accounts.filter(a => !a.is_group);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsing(true);
    setTransactions([]);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "ofx" || ext === "qfx") {
        const text = await file.text();
        const parsed = parseOFX(text);
        if (parsed.length === 0) {
          toast.error("Nenhuma transação encontrada no arquivo OFX");
        } else {
          toast.success(`${parsed.length} transações encontradas`);
        }
        setTransactions(parsed);
      } else if (ext === "pdf") {
        // Convert to base64 and send to edge function
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const { data, error } = await supabase.functions.invoke("parse-bank-statement", {
          body: { pdfBase64: base64 },
        });

        if (error) throw error;

        const parsed: ParsedTransaction[] = (data.transactions || []).map((t: any) => ({
          date: t.date,
          description: t.description,
          amount: Math.abs(t.amount),
          type: t.type || (t.amount >= 0 ? "credit" : "debit"),
          selected: true,
          debit_account_id: "",
          credit_account_id: "",
        }));

        if (parsed.length === 0) {
          toast.error("Nenhuma transação encontrada no PDF");
        } else {
          toast.success(`${parsed.length} transações extraídas do PDF`);
        }
        setTransactions(parsed);
      } else {
        toast.error("Formato não suportado. Use PDF ou OFX.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao processar arquivo: ${err.message}`);
    } finally {
      setParsing(false);
    }
  }, []);

  const toggleTransaction = (index: number) => {
    setTransactions(prev =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const toggleAll = (checked: boolean) => {
    setTransactions(prev => prev.map(t => ({ ...t, selected: checked })));
  };

  const applyDefaultAccounts = () => {
    if (!defaultDebitAccount && !defaultCreditAccount) {
      toast.error("Selecione ao menos uma conta padrão");
      return;
    }
    setTransactions(prev =>
      prev.map(t => ({
        ...t,
        debit_account_id: t.type === "debit" ? (defaultDebitAccount || t.debit_account_id) : (defaultCreditAccount || t.debit_account_id),
        credit_account_id: t.type === "debit" ? (defaultCreditAccount || t.credit_account_id) : (defaultDebitAccount || t.credit_account_id),
      }))
    );
    toast.success("Contas padrão aplicadas");
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const selected = transactions.filter(t => t.selected);
      if (selected.length === 0) throw new Error("Nenhuma transação selecionada");

      const missing = selected.find(t => !t.debit_account_id || !t.credit_account_id);
      if (missing) throw new Error("Todas as transações selecionadas precisam ter conta débito e crédito definidas");

      const entries = selected.map(t => ({
        entry_date: t.date,
        description: t.description,
        debit_account_id: t.debit_account_id,
        credit_account_id: t.credit_account_id,
        amount: t.amount,
        document_number: fileName,
        notes: `Importado de ${fileName}`,
      }));

      const { error } = await supabase.from("accounting_entries").insert(entries);
      if (error) throw error;
    },
    onSuccess: () => {
      const count = transactions.filter(t => t.selected).length;
      queryClient.invalidateQueries({ queryKey: ["accounting_entries"] });
      toast.success(`${count} lançamento(s) importado(s) com sucesso!`);
      setTransactions([]);
      setFileName("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const selectedCount = transactions.filter(t => t.selected).length;
  const selectedTotal = transactions.filter(t => t.selected).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Importar Extrato</h1>
        <p className="text-sm text-muted-foreground">Importe extratos bancários em PDF ou OFX e gere lançamentos contábeis</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-4">
            <label
              htmlFor="file-upload"
              className={cn(
                "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                parsing ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-muted/30"
              )}
            >
              {parsing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Processando arquivo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Clique para selecionar ou arraste o arquivo</p>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <FileText className="w-3 h-3" /> PDF
                    </Badge>
                    <Badge variant="outline" className="gap-1 text-xs">
                      <FileSpreadsheet className="w-3 h-3" /> OFX
                    </Badge>
                  </div>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.ofx,.qfx"
                className="hidden"
                onChange={handleFileUpload}
                disabled={parsing}
              />
            </label>
            {fileName && !parsing && (
              <p className="text-sm text-muted-foreground">
                Arquivo: <span className="font-medium text-foreground">{fileName}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Default accounts + import */}
      {transactions.length > 0 && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contas Padrão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-xs">Conta Débito (para despesas)</Label>
                  <Select value={defaultDebitAccount} onValueChange={setDefaultDebitAccount}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {leafAccounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Conta Crédito (contrapartida)</Label>
                  <Select value={defaultCreditAccount} onValueChange={setDefaultCreditAccount}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {leafAccounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={applyDefaultAccounts}>
                  Aplicar a todas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span>{selectedCount} de {transactions.length} selecionada(s)</span>
              <Badge variant="outline" className="font-mono">{formatCurrency(selectedTotal)}</Badge>
            </div>
            <Button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending || selectedCount === 0}
              style={{ backgroundColor: "#244294" }}
              className="gap-1"
            >
              {importMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Importar {selectedCount} Lançamento(s)</>
              )}
            </Button>
          </div>

          {/* Transactions Table */}
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedCount === transactions.length}
                      onCheckedChange={(checked) => toggleAll(!!checked)}
                    />
                  </TableHead>
                  <TableHead className="w-24">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-16">Tipo</TableHead>
                  <TableHead className="text-right w-28">Valor</TableHead>
                  <TableHead>Conta Débito</TableHead>
                  <TableHead>Conta Crédito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t, i) => (
                  <TableRow key={i} className={cn(!t.selected && "opacity-50")}>
                    <TableCell>
                      <Checkbox
                        checked={t.selected}
                        onCheckedChange={() => toggleTransaction(i)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{t.date}</TableCell>
                    <TableCell className="text-sm">{t.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", t.type === "credit" ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50")}
                      >
                        {t.type === "credit" ? "C" : "D"}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-mono text-sm", t.type === "credit" ? "text-emerald-600" : "text-red-600")}>
                      {formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={t.debit_account_id}
                        onValueChange={(v) => setTransactions(prev => prev.map((tr, idx) => idx === i ? { ...tr, debit_account_id: v } : tr))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {leafAccounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={t.credit_account_id}
                        onValueChange={(v) => setTransactions(prev => prev.map((tr, idx) => idx === i ? { ...tr, credit_account_id: v } : tr))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {leafAccounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default ImportarExtratoPage;
