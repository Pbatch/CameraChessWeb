import { useEffect, useState } from "react";
import { useGame } from "../../slices/gameSlice";

const format = (ms: number): string => {
  if (ms <= 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const Clock = () => {
  const game = useGame();
  const clock = game.clock;
  const [, tick] = useState(0);

  useEffect(() => {
    if (!clock?.running) return;
    const id = setInterval(() => tick(n => n + 1), 250);
    return () => clearInterval(id);
  }, [clock?.running]);

  if (!clock) return null;

  const elapsed = clock.running ? Date.now() - clock.updatedAt : 0;
  const wtime = clock.turn === "w" ? clock.wtime - elapsed : clock.wtime;
  const btime = clock.turn === "b" ? clock.btime - elapsed : clock.btime;

  return (
    <div className="clock d-flex justify-content-between mt-2">
      <span className={clock.turn === "w" ? "clock__time--active" : undefined}>
        {format(wtime)}
      </span>
      <span className={clock.turn === "b" ? "clock__time--active" : undefined}>
        {format(btime)}
      </span>
    </div>
  );
};

export default Clock;
