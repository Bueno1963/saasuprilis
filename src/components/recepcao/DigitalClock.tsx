import { useState, useEffect } from "react";
import { format } from "date-fns";

const DAYS_PT = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const DAY_MAP = [6, 0, 1, 2, 3, 4, 5]; // JS getDay() → PT index

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
  const currentDayIndex = DAY_MAP[now.getDay()];
  const dateStr = format(now, "dd/MM");

  return (
    <div className="mx-auto w-full max-w-md select-none">
      <div className="relative rounded-xl border-2 border-foreground/80 bg-[hsl(var(--muted)/0.4)] p-4 shadow-lg overflow-hidden"
        style={{ background: "linear-gradient(160deg, hsl(var(--muted)) 0%, hsl(var(--muted)/0.6) 100%)" }}
      >
        {/* LCD screen inner area */}
        <div className="rounded-lg border border-foreground/10 bg-[hsl(120,25%,88%)] px-5 py-4"
          style={{ background: "linear-gradient(180deg, hsl(120 20% 85%) 0%, hsl(120 15% 80%) 100%)" }}
        >
          {/* Top row: time + temp/date */}
          <div className="flex items-center justify-between gap-4">
            {/* Main time */}
            <div className="flex items-baseline gap-1">
              <span className="text-6xl font-mono font-black tracking-tight text-[hsl(120,10%,15%)] leading-none"
                style={{ fontFamily: "'Courier New', 'Lucida Console', monospace", letterSpacing: "0.05em" }}
              >
                {hours}
              </span>
              <span className="text-5xl font-mono font-black text-[hsl(120,10%,15%)/0.6] animate-pulse leading-none">
                :
              </span>
              <span className="text-6xl font-mono font-black tracking-tight text-[hsl(120,10%,15%)] leading-none"
                style={{ fontFamily: "'Courier New', 'Lucida Console', monospace", letterSpacing: "0.05em" }}
              >
                {minutes}
              </span>
            </div>

            {/* Right side: temperature + date */}
            <div className="flex flex-col items-end gap-1">
              {temperature !== null && (
                <span className="text-2xl font-mono font-bold text-[hsl(120,10%,15%)] leading-none">
                  {temperature}°<span className="text-base">C</span>
                </span>
              )}
              <span className="text-sm font-mono font-semibold text-[hsl(120,10%,15%)/0.7] leading-none">
                {dateStr}
              </span>
            </div>
          </div>

          {/* Bottom row: days of week */}
          <div className="flex justify-between mt-3 pt-2 border-t border-[hsl(120,10%,15%)/0.1]">
            {DAYS_PT.map((day, i) => (
              <span
                key={day}
                className={`text-[11px] font-mono font-bold tracking-wide transition-all ${
                  i === currentDayIndex
                    ? "text-[hsl(120,10%,15%)] scale-110"
                    : "text-[hsl(120,10%,15%)/0.25]"
                }`}
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalClock;
