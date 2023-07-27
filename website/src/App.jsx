import { useState, useEffect, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import RecordButton from "./components/recordButton";
import LichessButton from "./components/lichessButton"
import Corners from "./components/corners";
import Video from "./components/video";
import Board from "./components/board";
import * as Constants from "./utils/constants.js";
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useWindowWidth } from '@react-hook/window-size';

const App = () => {
  const [recording, setRecording] = useState(false);
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [lichessURL, setLichessURL] = useState("https://lichess.org/analysis/pgn");
  const recordingRef = useRef(false);
  const cornersRef = useRef({
    a8: {x: 0, y: 100},
    h8: {x: 100, y: 100},
    h1: {x: 0, y: 0},
    a1: {x: 100, y: 0}
  })
  const modelRef = useRef({
    net: null
  });
  const windowWidth = useWindowWidth();
  const [videoSize, setVideoSize] = useState(240);
  const displayRef = useRef(null);

  useEffect(() => {
    console.log('windowWidth', windowWidth);
    setVideoSize(Math.min(60 * Math.floor((windowWidth - 100) / 60), 480));
    console.log('videoSize', videoSize);

    displayRef.current.style.height = `${videoSize}px`;
    displayRef.current.style.width = `${videoSize}px`;
  }, [windowWidth]);

  useEffect(() => {
    tf.ready().then(async () => {
      const yolov8 = await tf.loadGraphModel("480S_pruned_web_model/model.json");
      console.log("Backend:", tf.getBackend());

      modelRef.current = {
        net: yolov8,
        width: yolov8.inputs[0].shape[1],
        height: yolov8.inputs[0].shape[2]
      };

    });
  }, []);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  return (
    <Container id="container" className="m-3">
      <Row className="m-3">
        <Col className="d-flex align-items-center justify-content-center">
          <div ref={displayRef} style={{"position": "relative"}}>
            <Video modelRef={modelRef} cornersRef={cornersRef} recordingRef={recordingRef}
            setFen={setFen} setLichessURL={setLichessURL} videoSize={videoSize} />
            <Corners cornersRef={cornersRef} />
          </div>
        </Col>
        <Col id="board" className="d-flex align-items-center justify-content-center">
          <Board fen={fen} />
        </Col>
      </Row>

      <Row>
        <Col className="d-flex align-items-center justify-content-center">
          <RecordButton recording={recording} setRecording={setRecording} />
        </Col>
        <Col className="d-flex align-items-center justify-content-center">
          <LichessButton lichessURL={lichessURL} />
        </Col>
      </Row>
    </Container>
  );
};

export default App;
