import ContasTab from "@/components/financeiro/ContasTab";

const ContasPagarPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contas a Pagar</h1>
        <p className="text-sm text-muted-foreground">Gestão de contas a pagar do laboratório</p>
      </div>
      <ContasTab type="payables" />
    </div>
  );
};

export default ContasPagarPage;
