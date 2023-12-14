export const clamp = (x, min, max) => {
  // Clamp x s.t. min <= x <= max
  return Math.max(min, Math.min(x, max));
}