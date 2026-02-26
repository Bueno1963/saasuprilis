import ContasTab from "@/components/financeiro/ContasTab";

const ContasReceberPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
        <p className="text-sm text-muted-foreground">Gestão de contas a receber do laboratório</p>
      </div>
      <ContasTab type="receivables" />
    </div>
  );
};

export default ContasReceberPage;
