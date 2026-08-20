import type { PropsWithChildren } from "react";

const Container = ({ children }: PropsWithChildren) => {
  return (
    <div className="d-flex bg-dark h-100">
      {children}
    </div>
  )
}

export default Container;
