import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import DigitalClock from "./DigitalClock";

const DigitalClockToggle = () => {
  const [visible, setVisible] = useState(true);

  return (
    <div className="flex items-center gap-3">
      {visible && <DigitalClock />}
      <Button
        variant={visible ? "default" : "outline"}
        size="sm"
        className="gap-1.5 shrink-0"
        onClick={() => setVisible((v) => !v)}
      >
        <Clock className="h-4 w-4" />
        {visible ? "Ocultar" : "Relógio"}
      </Button>
    </div>
  );
};

export default DigitalClockToggle;
