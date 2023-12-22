import { SidebarButton, Icon } from "../../common";

const RestartButton = ({ videoRef }: { videoRef: any }) => {
  const handleClick = (e: any) => {
    e.preventDefault();

    videoRef.current.currentTime = 0;
  }

 return (
    <SidebarButton onClick={handleClick}>
      <Icon iconName="bi-skip-start" />
    </SidebarButton>
  );
};

export default RestartButton;
