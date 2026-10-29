import type { PropsWithChildren } from "react";

const Container = ({ children, className = "" }: PropsWithChildren<{ className?: string }>) => {
  return (
    <div className={`flex h-full bg-dark ${className}`.trim()}>
      {children}
    </div>
  )
}

export default Container;
