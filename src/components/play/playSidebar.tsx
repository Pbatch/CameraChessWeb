import { Display, CornersButton, HomeButton, PgnButton, Sidebar, DigitalButton, 
  RecordButton, DeviceButton } from "../common";
import { Game, SetBoolean, SetStringArray } from "../../types";
import { userSelect } from "../../slices/userSlice";
import { useEffect, useRef, useState } from "react";
import { lichessPlayMove, lichessStreamEvents, lichessStreamGame } from "../../utils/lichess";
import { Chess, Color } from "chess.js";
import { useDispatch } from "react-redux";
import { gameSelect, gameSetStart, gameUpdate, makeBoard, makeUpdatePayload } from "../../slices/gameSlice";
  
  const PlaySidebar = ({ piecesModelRef, xcornersModelRef, videoRef, canvasRef, sidebarRef, 
    playing, setPlaying, text, setText, digital, setDigital }: {
    piecesModelRef: any, xcornersModelRef: any, videoRef: any, canvasRef: any, sidebarRef: any,
    playing: boolean, setPlaying: SetBoolean, 
    text: string[], setText: SetStringArray,
    digital: boolean, setDigital: SetBoolean
  }) => {
    const token: string = userSelect().token;
    const game: Game = gameSelect();
    const gameRef = useRef<Game>(game);
    const [gameId, setGameId] = useState<string>();
    const [color, setColor] = useState<Color>();
    const dispatch = useDispatch();

    useEffect(() => {
      gameRef.current = game;
    }, [game]);

    useEffect(() => {
      const colorToMove = gameRef.current.fen.split(" ")[1];
      const lastMove = gameRef.current.lastMove;
      if ((colorToMove === color) || (lastMove === "") || (gameId === undefined) || (color === undefined)) {
        return;
      }
      
      lichessPlayMove(token, gameId, lastMove);
    }, [gameRef.current])

    const streamEventsCallback = async (response: any) => {
      if (response.type === 'gameStart') {
        setGameId(response.game.gameId);
        setColor((response.game.color === "white") ? "w" : "b");
        
        const colorText = (response.game.color === "white") ? "White" : "Black";
        const opponent = response.game.opponent.username;
        setText(["Starting game", `${colorText} vs ${opponent}`]);
        
        const board = new Chess(response.game.fen);
        const payload = makeUpdatePayload(board);
        dispatch(gameUpdate(payload))
        dispatch(gameSetStart(response.game.fen));
      }    
    };

    const streamGameCallback = async (response: any) => {
      const moves = response.moves;
      if (moves === undefined) {
        return;
      }

      const splitMoves = moves.split(" ");
      const lastMove = splitMoves[splitMoves.length - 1];
      if (lastMove === gameRef.current.lastMove) {
        return;
      }

      const board = makeBoard(gameRef.current);
      board.move(lastMove);
      const payload = makeUpdatePayload(board);
      console.log("payload", payload);
      dispatch(gameUpdate(payload));
    }
    
    useEffect(() => {
      lichessStreamEvents(token, streamEventsCallback);
    }, []);

    useEffect(() => {
      if (gameId === undefined) {
        return;
      }
      
      lichessStreamGame(token, streamGameCallback, gameId);
    }, [gameId]);
    
    return (
      <Sidebar sidebarRef={sidebarRef} >
        <li className="my-1">
          <DeviceButton videoRef={videoRef} />
        </li>
        <li className="my-1">
          <CornersButton piecesModelRef={piecesModelRef} xcornersModelRef={xcornersModelRef} videoRef={videoRef} canvasRef={canvasRef} 
          setText={setText} />
        </li>
        <li className="my-1">
          <div className="btn-group w-100" role="group">
            <RecordButton playing={playing} setPlaying={setPlaying} />
          </div>
        </li>
        <li className="border-top"></li>
        <li className="my-1">
          <Display text={text} />
        </li>
        <li className="border-top"></li>
        <li className="my-1">
          <div className="btn-group w-100" role="group">
            <DigitalButton digital={digital} setDigital={setDigital} />
            <PgnButton setText={setText} playing={playing} />
            <HomeButton />
          </div>
        </li>
      </Sidebar>
    );
  };
  
  export default PlaySidebar;