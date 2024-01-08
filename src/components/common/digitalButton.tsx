import { SidebarButton } from ".";
import { setBoolean } from "../../types";

const DigitalButton = ({ digital, setDigital }: 
  { digital: boolean, setDigital: setBoolean }) => {
  const handleClick = (e: any) => {
    e.preventDefault();

    setDigital(!digital);
  }

 return (
    <SidebarButton onClick={handleClick}>
      Swap View
    </SidebarButton>
  );
};

export default DigitalButton;
