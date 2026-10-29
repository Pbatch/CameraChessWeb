import type { ButtonHTMLAttributes } from "react";
import buttonClass from "./buttonClass";
import type { ButtonVariant } from "./buttonClass";

type SidebarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const SidebarButton = ({ children, className = "", variant = "outline-light", ...buttonProps }:
  SidebarButtonProps) => {
  return (
    <button {...buttonProps} type={buttonProps.type ?? "button"}
      className={`${buttonClass(variant, "sm")} w-full ${className}`.trim()}>
      {children}
    </button>
  )
}

export default SidebarButton;
