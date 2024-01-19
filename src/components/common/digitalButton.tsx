import { SidebarButton } from ".";
import { SetBoolean } from "../../types";

const DigitalButton = ({ digital, setDigital }: 
  { digital: boolean, setDigital: SetBoolean }) => {
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
