import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Image from 'react-bootstrap/Image';

const HelpButton = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <button className="btn btn-dark btn-sm btn-outline-light" onClick={handleShow}>
        Instructions
      </button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Instructions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ol>
            <li style={{"marginTop": "10px"}}>
            Setup your camera about 50cm away from the chessboard at a high angle,
            it must remain still during filming.
            Make sure that it can see all four corners of the chessboard.</li>
            <li style={{"marginTop": "10px"}}>
            Click <b><i>Find Corners</i></b>, or drag the circles, to define the four corners of the board.
            "h1" is at bottom-right relative to the White player.</li>
            <li style={{"marginTop": "10px"}}>
            Press <b><i>Start Recording</i></b> to begin recording your game.
            </li>
            <li style={{"marginTop": "10px"}}>
            When you are done recording click <b><i>Copy PGN</i></b> to save the game to the clipboard. 
            If you have a Lichess account and an internet connection, 
            click <b><i>To Upload</i></b> to play back through the game.
            </li>
          </ol>
          <p>
          Please reach out to us at <b>camera_chess1@gmail.com</b> if you have suggestions, feedback or comments.
          </p>
          <p>
          If the app does not work for your chessboard,
          please send us a picture of your setup,
          and we will try to label data which matches your configuration.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-dark" onClick={handleClose}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default HelpButton;