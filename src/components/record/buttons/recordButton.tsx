import { SidebarButton, Icon } from "../../common";

const RecordButton = ({ recording, setRecording }: 
  { recording: boolean, setRecording: React.Dispatch<React.SetStateAction<boolean>> }) => {
  const handleClick = (e: any) => {
    e.preventDefault();

    setRecording(!recording);
  }

 return (
    <SidebarButton onClick={handleClick}>
      <Icon iconName={recording ? "bi-pause" : "bi-play"} />
    </SidebarButton>
  );
};

export default RecordButton;
