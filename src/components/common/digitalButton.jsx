import { SidebarButton } from ".";

const DigitalButton = ({ digital, setDigital }) => {
  const handleClick = (e) => {
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
