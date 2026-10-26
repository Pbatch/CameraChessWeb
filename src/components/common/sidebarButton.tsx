import type { ButtonHTMLAttributes } from "react";

type SidebarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  // Bootstrap button variant, e.g. "success" or "outline-danger"
  variant?: string;
};

const SidebarButton = ({ children, className = "", variant = "outline-light", ...buttonProps }:
  SidebarButtonProps) => {
  // Outline variants keep the dark fill so they match the rest of the sidebar
  const variantClass = variant.startsWith("outline-") ? `btn-dark btn-${variant}` : `btn-${variant}`;

  return (
    <button {...buttonProps} type={buttonProps.type ?? "button"}
      className={`btn btn-sm ${variantClass} w-100 ${className}`.trim()}>
      {children}
    </button>
  )
}

export default SidebarButton;
