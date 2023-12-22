export const clamp = (x: number, min: number, max: number) => {
  // Clamp x s.t. min <= x <= max
  return Math.max(min, Math.min(x, max));
}