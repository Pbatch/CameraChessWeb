import { useId } from "react";
import type { ReactNode } from "react";

const SidebarSection = ({ title, hidden = false, className = "", children }: {
  title: string, hidden?: boolean, className?: string, children: ReactNode
}) => {
  const titleId = useId();

  return (
    <section className={`sidebar-section ${className}`.trim()} aria-labelledby={titleId} hidden={hidden}>
      <h2 className="sidebar-section__title" id={titleId}>{title}</h2>
      <div className="sidebar-section__body">
        {children}
      </div>
    </section>
  )
}

export default SidebarSection;
