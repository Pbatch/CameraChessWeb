export const zeros = (rows: number, columns: number) => {
  return Array.from({ length: rows }, () => Array(columns).fill(0));
}
