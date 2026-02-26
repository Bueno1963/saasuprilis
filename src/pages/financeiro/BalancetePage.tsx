import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Scale } from "lucide-react";
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
  level: number;
  parent_id: string | null;
}

const BalancetePage = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, "yyyy-MM"));

  const monthStart = `${selectedMonth}-01`;
  const nextMonth = format(new Date(new Date(monthStart).setMonth(new Date(monthStart).getMonth() + 1)), "yyyy-MM-dd");

  const { data: accounts = [] } = useQuery({
    queryKey: ["coa_balancete"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chart_of_accounts").select("*").eq("status", "active").order("code");
      if (error) throw error;
      return data as Account[];
    },
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["balancete_entries", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_entries")
        .select("debit_account_id, credit_account_id, amount")
        .eq("status", "ativo")
        .gte("entry_date", monthStart)
        .lt("entry_date", nextMonth);
      if (error) throw error;
      return data;
    },
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(currentDate, i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: ptBR }) };
  });

  // Calculate debits/credits per leaf account
  const leafBalances = new Map<string, { debits: number; credits: number }>();
  entries.forEach(e => {
    const amt = Number(e.amount);
    if (!leafBalances.has(e.debit_account_id)) leafBalances.set(e.debit_account_id, { debits: 0, credits: 0 });
    if (!leafBalances.has(e.credit_account_id)) leafBalances.set(e.credit_account_id, { debits: 0, credits: 0 });
    leafBalances.get(e.debit_account_id)!.debits += amt;
    leafBalances.get(e.credit_account_id)!.credits += amt;
  });

  // Aggregate up to groups
  const accountBalances = new Map<string, { debits: number; credits: number }>();

  // Init all
  accounts.forEach(a => accountBalances.set(a.id, { debits: 0, credits: 0 }));

  // Set leaf values
  leafBalances.forEach((val, id) => {
    if (accountBalances.has(id)) {
      accountBalances.set(id, { ...val });
    }
  });

  // Aggregate bottom-up (sort by level desc)
  const sortedAccounts = [...accounts].sort((a, b) => b.level - a.level);
  sortedAccounts.forEach(acc => {
    if (acc.parent_id && accountBalances.has(acc.parent_id)) {
      const parent = accountBalances.get(acc.parent_id)!;
      const child = accountBalances.get(acc.id)!;
      parent.debits += child.debits;
      parent.credits += child.credits;
    }
  });

  // Build display rows
  const rootAccounts = accounts.filter(a => !a.parent_id).sort((a, b) => a.code.localeCompare(b.code));
  const getChildren = (parentId: string) => accounts.filter(a => a.parent_id === parentId).sort((a, b) => a.code.localeCompare(b.code));

  interface BalanceRow {
    account: Account;
    debits: number;
    credits: number;
    balance: number;
  }

  const flatRows: BalanceRow[] = [];
  const flatten = (acc: Account) => {
    const bal = accountBalances.get(acc.id) || { debits: 0, credits: 0 };
    if (bal.debits > 0 || bal.credits > 0 || acc.is_group) {
      flatRows.push({ account: acc, debits: bal.debits, credits: bal.credits, balance: bal.debits - bal.credits });
    }
    getChildren(acc.id).forEach(flatten);
  };
  rootAccounts.forEach(flatten);

  // Filter out groups with no movement
  const displayRows = flatRows.filter(r => r.debits > 0 || r.credits > 0);

  const totalDebits = displayRows.filter(r => r.account.level === 1).reduce((s, r) => s + r.debits, 0);
  const totalCredits = displayRows.filter(r => r.account.level === 1).reduce((s, r) => s + r.credits, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Balancete de Verificação</h1>
          <p className="text-sm text-muted-foreground">Saldos de todas as contas contábeis</p>
        </div>
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

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Débitos</p>
            <p className="text-xl font-bold text-red-600 font-mono">{formatCurrency(totalDebits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Créditos</p>
            <p className="text-xl font-bold text-emerald-600 font-mono">{formatCurrency(totalCredits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Diferença</p>
            <div className="flex items-center gap-2">
              <p className={cn("text-xl font-bold font-mono", Math.abs(totalDebits - totalCredits) < 0.01 ? "text-emerald-600" : "text-red-600")}>
                {formatCurrency(Math.abs(totalDebits - totalCredits))}
              </p>
              {Math.abs(totalDebits - totalCredits) < 0.01 && (
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Equilibrado</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balancete Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-5 w-5" />
            Balancete — {monthOptions.find(m => m.value === selectedMonth)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : displayRows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum movimento no período.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Débito</TableHead>
                  <TableHead className="text-right">Crédito</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map((row) => (
                  <TableRow
                    key={row.account.id}
                    className={cn(row.account.is_group && "bg-muted/30")}
                  >
                    <TableCell
                      className="font-mono text-xs"
                      style={{ paddingLeft: `${(row.account.level - 1) * 16 + 16}px` }}
                    >
                      {row.account.code}
                    </TableCell>
                    <TableCell className={cn("text-sm", row.account.is_group && "font-semibold")}>
                      {row.account.name}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">
                      {row.debits > 0 ? formatCurrency(row.debits) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-600">
                      {row.credits > 0 ? formatCurrency(row.credits) : "—"}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono text-sm font-medium",
                      row.balance > 0 ? "text-red-600" : row.balance < 0 ? "text-emerald-600" : "text-foreground"
                    )}>
                      {formatCurrency(Math.abs(row.balance))} {row.balance > 0 ? "D" : row.balance < 0 ? "C" : ""}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Grand total */}
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell colSpan={2} className="text-sm">TOTAL GERAL</TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-600">{formatCurrency(totalDebits)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-emerald-600">{formatCurrency(totalCredits)}</TableCell>
                  <TableCell className={cn(
                    "text-right font-mono text-sm",
                    Math.abs(totalDebits - totalCredits) < 0.01 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {formatCurrency(Math.abs(totalDebits - totalCredits))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BalancetePage;
