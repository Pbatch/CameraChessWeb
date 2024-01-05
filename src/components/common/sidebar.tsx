const Sidebar = (props: any) => {
  return (
    <div ref={props.sidebarRef} className="d-flex flex-column text-center px-1">
      <ul className="nav nav-pills flex-column">
        {props.children}
      </ul>
    </div>
  );
};

export default Sidebar;