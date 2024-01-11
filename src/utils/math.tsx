export const clamp = (x: number, min: number, max: number) => {
  // Clamp x s.t. min <= x <= max
  return Math.max(min, Math.min(x, max));
}

export const zeros = (rows: number, columns: number) => {
  return Array.from(Array(rows), _ => Array(columns).fill(0));
}