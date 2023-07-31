import { useState, useEffect, useRef, useCallback } from "react";
import RecordButton from "./components/recordButton";
import LichessButton from "./components/lichessButton";
import CopyButton from "./components/copyButton";
import Video from "./components/video";
import Board from "./components/board";
import * as Constants from "./utils/constants.js";
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const App = () => {
  const [recording, setRecording] = useState(false);
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [pgn, setPgn] = useState("");
  const recordingRef = useRef(false);

  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  return (
    <Container id="container" className="m-3">
      <Row className="m-3">
        <Col className="d-flex align-items-center justify-content-center">
          <Video recordingRef={recordingRef} setFen={setFen} setPgn={setPgn} />
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
          <LichessButton />
        </Col>
        <Col className="d-flex align-items-center justify-content-center">
          <CopyButton pgn={pgn} />
        </Col>
      </Row>
    </Container>
  );
};

export default App;
