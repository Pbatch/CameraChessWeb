const Icon = ({ iconName, className = "h4" }: { iconName: string, className?: string }) => {
  return (
    <i className={`${className} bi ${iconName}`.trim()} aria-hidden="true" />
  )
}

export default Icon;
