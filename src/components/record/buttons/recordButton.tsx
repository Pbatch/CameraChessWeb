import { SidebarButton, Icon } from "../../common";

const RecordButton = ({ playing, setPlaying }: 
  { playing: boolean, setPlaying: React.Dispatch<React.SetStateAction<boolean>> }) => {
  const handleClick = (e: any) => {
    e.preventDefault();

    setPlaying(!playing);
  }

 return (
    <SidebarButton onClick={handleClick}>
      <Icon iconName={playing ? "bi-pause" : "bi-play"} />
    </SidebarButton>
  );
};

export default RecordButton;
