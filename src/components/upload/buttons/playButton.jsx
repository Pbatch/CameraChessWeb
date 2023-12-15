import { SidebarButton, Icon } from "../../common";

const PlayButton = ({ videoRef, playing, setPlaying }) => {
  const handleClick = (e) => {
    e.preventDefault();
    
    if (videoRef.current.src.startsWith("blob")) {
      setPlaying(!playing);
    }
  }

 return (
    <SidebarButton onClick={handleClick}>
      <Icon iconName={playing ? "bi-pause" : "bi-play"} />
    </SidebarButton>
  );
};

export default PlayButton;
