import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CadastroLaudos from "@/pages/laudos/CadastroLaudos";

interface Props {
  onBack: () => void;
}

const CadastroParametrosSettings = ({ onBack }: Props) => {
  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
      </Button>
      <CadastroLaudos />
    </div>
  );
};

export default CadastroParametrosSettings;
