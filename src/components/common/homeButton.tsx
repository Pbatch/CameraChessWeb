import { useNavigate } from "react-router-dom";
import SidebarButton from "./sidebarButton";
import Icon from "./icon";

const HomeButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {    
    void navigate("/");
  }
  
  return (
    <SidebarButton onClick={handleClick} aria-label="Go to home" title="Go to home">
      <Icon iconName="bi-house"/>
    </SidebarButton>
  );
};

export default HomeButton;
