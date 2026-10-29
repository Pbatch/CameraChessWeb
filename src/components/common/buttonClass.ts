export type ButtonVariant = "outline-light" | "outline-success" | "outline-warning" | "outline-danger" | "light";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  "outline-light": "border-light text-light hover:bg-light hover:text-black focus-visible:ring-light/50",
  "outline-success": "border-success text-success hover:bg-success hover:text-white focus-visible:ring-success/50",
  "outline-warning": "border-warning text-warning hover:bg-warning hover:text-black focus-visible:ring-warning/50",
  "outline-danger": "border-danger text-danger hover:bg-danger hover:text-white focus-visible:ring-danger/50",
  "light": "border-light bg-light text-black hover:border-[#c6c7c8] hover:bg-[#d3d4d5] focus-visible:ring-light/50",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "rounded px-2 py-1 text-sm",
  md: "rounded-md px-3 py-1.5 text-base",
  lg: "rounded-lg px-4 py-2 text-xl",
};

// Raised on hover and focus so a button's whole border shows where a group overlaps them
const BASE = "relative border text-center leading-normal select-none transition-colors hover:z-10 "
  + "focus-visible:z-10 focus-visible:ring-4 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-65";

const buttonClass = (variant: ButtonVariant = "outline-light", size: ButtonSize = "md"): string =>
  `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;

export default buttonClass;
