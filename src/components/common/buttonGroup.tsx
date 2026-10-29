import type { ReactNode } from "react";

// Inner corners are squared off, including on a dropdown's button, and neighbours overlap so borders aren't doubled
const GROUP = [
  "flex w-full *:flex-auto",
  "[&>:not(:first-child)]:-ms-px",
  "[&>:not(:first-child)]:rounded-s-none [&>:not(:first-child)>button]:rounded-s-none",
  "[&>:not(:last-child)]:rounded-e-none [&>:not(:last-child)>button]:rounded-e-none",
].join(" ");

const ButtonGroup = ({ label, className = "", children }: {
  label: string, className?: string, children: ReactNode
}) => {
  return (
    <div className={`${GROUP} ${className}`.trim()} role="group" aria-label={label}>
      {children}
    </div>
  )
}

export default ButtonGroup;
