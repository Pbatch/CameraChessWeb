// e.g. "0:07", "12:34", "1:02:03"
export const formatTime = (seconds: number): string => {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = (total % 60).toString().padStart(2, "0");
  return (h > 0) ? `${h}:${m.toString().padStart(2, "0")}:${s}` : `${m}:${s}`;
};
