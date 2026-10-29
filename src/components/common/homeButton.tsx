import { useNavigate } from "react-router";
import SidebarButton from "./sidebarButton";
import { House } from "lucide-react";
import Icon from "./icon";

// Labelled shows "Home" beside a text-sized icon, for a row of labelled buttons
const HomeButton = ({ labelled = false }: { labelled?: boolean }) => {
  const navigate = useNavigate();

  const handleClick = () => {    
    void navigate("/");
  }
  
  return (
    <SidebarButton onClick={handleClick} aria-label="Go to home" title="Go to home">
      <Icon icon={House} className={labelled ? "me-2" : undefined} />
      {labelled && "Home"}
    </SidebarButton>
  );
};

export default HomeButton;
