import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Receipt, CreditCard, BarChart3 } from "lucide-react";
import FaturamentoTab from "@/components/financeiro/FaturamentoTab";
import ContasTab from "@/components/financeiro/ContasTab";
import RelatoriosTab from "@/components/financeiro/RelatoriosTab";

const FinanceiroPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Gestão financeira do laboratório</p>
      </div>

      <Tabs defaultValue="faturamento" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faturamento" className="gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Faturamento</span>
          </TabsTrigger>
          <TabsTrigger value="receber" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">A Receber</span>
          </TabsTrigger>
          <TabsTrigger value="pagar" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">A Pagar</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faturamento">
          <FaturamentoTab />
        </TabsContent>
        <TabsContent value="receber">
          <ContasTab type="receivables" />
        </TabsContent>
        <TabsContent value="pagar">
          <ContasTab type="payables" />
        </TabsContent>
        <TabsContent value="relatorios">
          <RelatoriosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceiroPage;
