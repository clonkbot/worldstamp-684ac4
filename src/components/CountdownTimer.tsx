import { useState, useEffect } from "react";

interface WindowInfo {
  windowId: string;
  windowStart: number;
  windowEnd: number;
  timeRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
}

interface CountdownTimerProps {
  windowInfo: WindowInfo | undefined;
}

export function CountdownTimer({ windowInfo }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!windowInfo) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = windowInfo.windowEnd - now;

      if (remaining <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [windowInfo]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="font-mono text-2xl md:text-3xl font-bold tracking-wider">
      <span className="text-white">{pad(timeLeft.hours)}</span>
      <span className="text-white/30 mx-0.5">:</span>
      <span className="text-white">{pad(timeLeft.minutes)}</span>
      <span className="text-white/30 mx-0.5">:</span>
      <span className="text-violet-400">{pad(timeLeft.seconds)}</span>
    </div>
  );
}
