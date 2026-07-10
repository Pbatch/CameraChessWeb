import { useNavigate } from "react-router-dom";
import SidebarButton from "./sidebarButton";
import Icon from "./icon";

const HomeButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {    
    void navigate("/");
  }
  
  return (
    <SidebarButton onClick={handleClick} >
      <Icon iconName="bi-house"/>
    </SidebarButton>
  );
};

export default HomeButton;
