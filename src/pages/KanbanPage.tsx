import SampleKanbanTab from "@/components/samples/SampleKanbanTab";

const KanbanPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kanban de Amostras</h1>
        <p className="text-sm text-muted-foreground">Rastreabilidade visual do fluxo de amostras</p>
      </div>
      <SampleKanbanTab />
    </div>
  );
};

export default KanbanPage;
