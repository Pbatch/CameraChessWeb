import type { PropsWithChildren } from "react";

const Container = ({ children, className = "" }: PropsWithChildren<{ className?: string }>) => {
  return (
    <div className={`d-flex bg-dark h-100 ${className}`.trim()}>
      {children}
    </div>
  )
}

export default Container;
