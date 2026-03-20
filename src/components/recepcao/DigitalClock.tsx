import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    <div className="relative mx-auto w-full max-w-lg rounded-2xl bg-black p-6 shadow-2xl overflow-hidden select-none">
      {/* Glossy reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

      <div className="flex items-center justify-between gap-4">
        {/* Days of week */}
        <div className="flex flex-col gap-0.5 text-[11px] font-mono tracking-wider">
          {DAYS_PT.map((day, i) => (
            <span
              key={day}
              className={
                i === currentDayIndex
                  ? "text-emerald-400 font-bold"
                  : "text-white/30"
              }
            >
              {day}
            </span>
          ))}
        </div>

        {/* Time */}
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-5xl md:text-6xl font-bold text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
            {hours}
          </span>
          <span className="text-5xl md:text-6xl font-bold text-white animate-pulse">
            :
          </span>
          <span className="text-5xl md:text-6xl font-bold text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
            {minutes}
          </span>
          <span className="text-lg text-white/50 ml-1 self-end mb-1 font-semibold">
            {seconds}
          </span>
        </div>

        {/* Temperature */}
        <div className="flex flex-col items-end gap-1">
          {temperature !== null && (
            <span className="text-3xl md:text-4xl font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
              {temperature}°<span className="text-lg">C</span>
            </span>
          )}
          <span className="text-[10px] text-white/40 font-mono">
            {dateStr}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DigitalClock;
