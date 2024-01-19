import { useDispatch } from "react-redux";
import { gameResetFen, gameResetMoves } from "../../../slices/gameSlice";
import { SidebarButton, Icon } from "../../common";
import { SetStringArray } from "../../../types";

const RestartButton = ({ videoRef, setText }: { videoRef: any, setText: SetStringArray}) => {
  const dispatch = useDispatch();
  
  const handleClick = (e: any) => {
    e.preventDefault();

    videoRef.current.currentTime = 0;
    dispatch(gameResetMoves());
    dispatch(gameResetFen());
    setText(["Rewound video", "Reset PGN to start position"])
  }

 return (
    <SidebarButton onClick={handleClick}>
      <Icon iconName="bi-skip-start" />
    </SidebarButton>
  );
};

export default RestartButton;
