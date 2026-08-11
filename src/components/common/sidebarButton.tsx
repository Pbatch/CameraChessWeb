const SidebarButton = (props: any) => {
  return (
    <button onClick={props.onClick} disabled={props.disabled} className="btn btn-dark btn-sm btn-outline-light w-100">
      {props.children}
    </button>
  )
}

export default SidebarButton;
