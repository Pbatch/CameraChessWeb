const Sidebar = (props: any) => {
  const style = {"minWidth": "200px"}
  return (
    <div ref={props.sidebarRef} className="d-flex flex-column text-center px-1" style={style}>
      <ul className="nav nav-pills flex-column">
        {props.children}
      </ul>
    </div>
  );
};

export default Sidebar;