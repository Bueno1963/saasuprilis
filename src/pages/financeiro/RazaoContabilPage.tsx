import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  is_group: boolean;
}

const RazaoContabilPage = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));
  const [selectedAccount, setSelectedAccount] = useState("all");

  const monthStart = `${selectedMonth}-01`;
  const nextMonth = format(new Date(new Date(monthStart).setMonth(new Date(monthStart).getMonth() + 1)), "yyyy-MM-dd");

  const { data: accounts = [] } = useQuery({
    queryKey: ["coa_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chart_of_accounts").select("id, code, name, type, is_group").eq("status", "active").order("code");
      if (error) throw error;
      return data as Account[];
    },
  });

  const leafAccounts = accounts.filter(a => !a.is_group);
  const accountMap = new Map(accounts.map(a => [a.id, a]));

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["razao_entries", selectedMonth, selectedAccount],
    queryFn: async () => {
      let query = supabase
        .from("accounting_entries")
        .select("*")
        .eq("status", "ativo")
        .gte("entry_date", monthStart)
        .lt("entry_date", nextMonth)
        .order("entry_date")
        .order("created_at");

      if (selectedAccount !== "all") {
        query = query.or(`debit_account_id.eq.${selectedAccount},credit_account_id.eq.${selectedAccount}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(currentDate, i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: ptBR }) };
  });

  // Group entries by account for the ledger view
  const buildLedger = () => {
    const ledger = new Map<string, { debits: any[]; credits: any[] }>();

    const targetAccounts = selectedAccount === "all" ? leafAccounts : leafAccounts.filter(a => a.id === selectedAccount);

    targetAccounts.forEach(acc => {
      ledger.set(acc.id, { debits: [], credits: [] });
    });

    entries.forEach(entry => {
      if (ledger.has(entry.debit_account_id)) {
        ledger.get(entry.debit_account_id)!.debits.push(entry);
      }
      if (ledger.has(entry.credit_account_id)) {
        ledger.get(entry.credit_account_id)!.credits.push(entry);
      }
    });

    // Only return accounts with movements
    return Array.from(ledger.entries())
      .filter(([, v]) => v.debits.length > 0 || v.credits.length > 0)
      .map(([accountId, movements]) => {
        const acc = accountMap.get(accountId)!;
        const allMovements = [
          ...movements.debits.map(e => ({ ...e, side: "D" as const, value: Number(e.amount) })),
          ...movements.credits.map(e => ({ ...e, side: "C" as const, value: Number(e.amount) })),
        ].sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.created_at.localeCompare(b.created_at));

        let runningBalance = 0;
        const rows = allMovements.map(m => {
          if (m.side === "D") runningBalance += m.value;
          else runningBalance -= m.value;
          return { ...m, balance: runningBalance };
        });

        const totalDebits = movements.debits.reduce((s, e) => s + Number(e.amount), 0);
        const totalCredits = movements.credits.reduce((s, e) => s + Number(e.amount), 0);

        return { account: acc, rows, totalDebits, totalCredits, finalBalance: runningBalance };
      });
  };

  const ledgerData = buildLedger();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Razão Contábil</h1>
          <p className="text-sm text-muted-foreground">Extrato detalhado por conta contábil</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {leafAccounts.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(m => (
                <SelectItem key={m.value} value={m.value} className="capitalize">{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : ledgerData.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-xl">Nenhum movimento encontrado no período.</div>
      ) : (
        <div className="space-y-6">
          {ledgerData.map(({ account, rows, totalDebits, totalCredits, finalBalance }) => (
            <Card key={account.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-mono text-muted-foreground">{account.code}</span>
                    <span>{account.name}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-xs", finalBalance >= 0 ? "text-emerald-700" : "text-red-700")}>
                    Saldo: {formatCurrency(finalBalance)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Data</TableHead>
                      <TableHead>Histórico</TableHead>
                      <TableHead>Contrapartida</TableHead>
                      <TableHead className="text-right">Débito</TableHead>
                      <TableHead className="text-right">Crédito</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => {
                      const counterpartId = row.side === "D" ? row.credit_account_id : row.debit_account_id;
                      const counterpart = accountMap.get(counterpartId);
                      return (
                        <TableRow key={`${row.id}-${row.side}-${i}`}>
                          <TableCell className="font-mono text-xs">{row.entry_date}</TableCell>
                          <TableCell className="text-sm">{row.description}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {counterpart ? `${counterpart.code} ${counterpart.name}` : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-red-600">
                            {row.side === "D" ? formatCurrency(row.value) : ""}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-emerald-600">
                            {row.side === "C" ? formatCurrency(row.value) : ""}
                          </TableCell>
                          <TableCell className={cn("text-right font-mono text-sm font-medium", row.balance >= 0 ? "text-foreground" : "text-red-600")}>
                            {formatCurrency(row.balance)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Totals row */}
                    <TableRow className="bg-muted/40 font-semibold">
                      <TableCell colSpan={3} className="text-sm">Totais</TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">{formatCurrency(totalDebits)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-600">{formatCurrency(totalCredits)}</TableCell>
                      <TableCell className={cn("text-right font-mono text-sm", finalBalance >= 0 ? "text-foreground" : "text-red-600")}>
                        {formatCurrency(finalBalance)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RazaoContabilPage;
