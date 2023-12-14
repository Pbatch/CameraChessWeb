const HelpButton = () => {
  return (
    <>
      <button className="btn btn-dark btn-sm btn-outline-light w-100" 
      data-bs-toggle="modal" data-bs-target="#instructions">
        <i class="h4 bi bi-info"></i>
      </button>

      <div className="modal" id="instructions" tabIndex="-1" 
      aria-labelledby="modalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="modalLabel">Instructions</h5>
            </div>
            <div className="modal-body text-start">
              <ol>
                <li style={{"marginTop": "10px"}}>Setup your camera so that it can see all 4 corners of the chessboard, it must remain still during filming.</li>
                <li style={{"marginTop": "10px"}}>Click <b><i>Find Corners</i></b>, or drag the circles, to define the four corners of the board. "h1" is at bottom-right relative to the White player.</li>
                <li style={{"marginTop": "10px"}}>Click the play button to begin recording your game.</li>
                <li style={{"marginTop": "10px"}}>When you are done recording click <b><i>Copy PGN</i></b> to save the game to the clipboard. Click the <b><i>Home</i></b> icon, then click <b><i>Export</i></b> to play back through the game.</li>
              </ol>
              <p></p>
              <p>Please reach out to us at <b>camera_chess1@gmail.com</b> if you have suggestions, feedback or comments.</p>
              <p>If the app does not work for your chessboard, please send us a picture of your setup, and we will try to label data which matches your configuration.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-dark" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HelpButton;