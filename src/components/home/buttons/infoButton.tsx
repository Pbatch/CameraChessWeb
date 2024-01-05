import { useNavigate } from "react-router-dom";

const InfoButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/faq")
  }
  
  return (
    <div className="col text-end">
      <i className="h1 bi bi-info-circle" onClick={handleClick}></i>
    </div>
  )
}

export default InfoButton;