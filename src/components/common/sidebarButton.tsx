import type { ButtonHTMLAttributes } from "react";

const SidebarButton = ({ children, className = "", ...buttonProps }:
  ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button {...buttonProps} type={buttonProps.type ?? "button"}
      className={`btn btn-dark btn-sm btn-outline-light w-100 ${className}`.trim()}>
      {children}
    </button>
  )
}

export default SidebarButton;
