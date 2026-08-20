import { useDispatch } from "react-redux";
import { gameResetFen, gameResetMoves } from "../../../slices/gameSlice";
import { SidebarButton, Icon } from "../../common";
import type { SetStringArray, VideoRef } from "../../../types";

const RestartButton = ({ videoRef, setText, videoSelected }: {
  videoRef: VideoRef, setText: SetStringArray, videoSelected: boolean
}) => {
  const dispatch = useDispatch();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (videoRef.current !== null) {
      videoRef.current.currentTime = 0;
    }
    dispatch(gameResetMoves());
    dispatch(gameResetFen());
    setText(["Rewound video", "Reset PGN to start position"])
  }

 return (
    <SidebarButton
      onClick={handleClick}
      disabled={!videoSelected}
      aria-label="Restart video"
      title="Restart video"
    >
      <Icon iconName="bi-skip-start" />
    </SidebarButton>
  );
};

export default RestartButton;
