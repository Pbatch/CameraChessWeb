const Container = (props) => {
  return (
    <div className="d-flex bg-dark h-100">
      {props.children}
    </div>
  )
}

export default Container;