import { SidebarButton } from ".";

const DigitalButton = ({ digital, setDigital }: 
  { digital: boolean, setDigital: React.Dispatch<React.SetStateAction<boolean>>}) => {
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
