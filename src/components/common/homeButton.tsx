import { useNavigate } from "react-router-dom";
import SidebarButton from "./sidebarButton";
import Icon from "./icon";

// Labelled shows "Home" beside a text-sized icon, for a row of labelled buttons
const HomeButton = ({ labelled = false }: { labelled?: boolean }) => {
  const navigate = useNavigate();

  const handleClick = () => {    
    void navigate("/");
  }
  
  return (
    <SidebarButton onClick={handleClick} aria-label="Go to home" title="Go to home">
      <Icon iconName="bi-house" className={labelled ? "me-2" : "h4"} />
      {labelled && "Home"}
    </SidebarButton>
  );
};

export default HomeButton;
