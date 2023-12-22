import { SidebarButton, Icon } from "../../common";

const PlayButton = ({ videoRef, playing, setPlaying }: {
  videoRef: any, playing: boolean, setPlaying: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const handleClick = (e: any) => {
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
