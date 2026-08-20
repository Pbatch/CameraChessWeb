const Icon = ({ iconName }: { iconName: string }) => {
  return (
    <i className={`h4 bi ${iconName}`} aria-hidden="true" />
  )
}

export default Icon;
