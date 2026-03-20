import { useState, useEffect } from "react";
import { format } from "date-fns";

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const DigitalClock = () => {
  const [now, setNow] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true`
          );
          const data = await res.json();
          setTemperature(Math.round(data.current_weather.temperature));
        } catch {
          setTemperature(25);
        }
      },
      () => setTemperature(25)
    );
  }, []);

  const hours = format(now, "HH");
  const minutes = format(now, "mm");
  const seconds = format(now, "ss");
  const currentDayIndex = now.getDay();
  const dateStr = format(now, "dd/MM/yyyy");

  return (
    <div className="relative mx-auto w-full max-w-xs rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden select-none">
      {/* Glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none rounded-2xl" />
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-primary/20 blur-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-3">
        {/* Days of week */}
        <div className="flex flex-col gap-0 text-[8px] font-medium tracking-wider leading-tight">
          {DAYS_PT.map((day, i) => (
            <span
              key={day}
              className={
                i === currentDayIndex
                  ? "text-primary font-bold"
                  : "text-muted-foreground/40"
              }
            >
              {day}
            </span>
          ))}
        </div>

        {/* Time */}
        <div className="flex items-baseline gap-0.5 font-mono">
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            {hours}
          </span>
          <span className="text-3xl font-extrabold text-foreground/60 animate-pulse">
            :
          </span>
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            {minutes}
          </span>
          <span className="text-[10px] text-muted-foreground ml-0.5 self-end font-semibold">
            {seconds}
          </span>
        </div>

        {/* Temperature & date */}
        <div className="flex flex-col items-end gap-0.5">
          {temperature !== null && (
            <span className="text-xl font-mono font-bold text-primary">
              {temperature}°<span className="text-[10px]">C</span>
            </span>
          )}
          <span className="text-[8px] text-muted-foreground font-mono">
            {dateStr}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DigitalClock;
