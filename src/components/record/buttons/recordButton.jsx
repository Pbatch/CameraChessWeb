import { SidebarButton, Icon } from "../../common";

const RecordButton = ({ recording, setRecording }) => {
  const handleClick = (e) => {
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
