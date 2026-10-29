import { HomeButton } from "../common";

const data = {
  title: "Frequently Asked Questions",
  rows: [
      {
        title: "Where can I buy a stand?",
        content: 
        <p>
          You can buy a stand for £12.99 at:&nbsp;  
          <a target="_blank" href="https://www.amazon.co.uk/dp/B07NVBXYPJ" rel="noreferrer">https://www.amazon.co.uk/dp/B07NVBXYPJ</a>.
        </p>
      },
      {
        title: "How do I setup my camera?",
        content: 
        <div>
          <ul>
            <li>
              Place your camera on the stand to the side of the board. 
            </li>
            <li>
              Make sure that the stand is stable and that the camera can see the whole board.
            </li>
            <li>
              If the board is small in the shot, click <b>Draw Region</b> and drag a box around it.
            </li>
            <li>
              If you are using your devices native camera app and have 0.5x zoom available, use it.  
            </li>
            <li>
              Make sure that the tallest piece (the king or queen) is still in shot when placed on the furthest square from the camera.
            </li>
            <li>
              <figure className="figure">
                <img src="halfZoom.webp" className="figure-img img-fluid rounded" alt="0.5x zoom setup" />
                <figcaption className="figure-caption text-white">My setup with 0.5x zoom</figcaption>
              </figure>
            </li>
            <li>
              <figure className="figure">
                <img src="fullZoom.webp" className="figure-img img-fluid rounded" alt="1x zoom setup" />
                <figcaption className="figure-caption text-white">My setup with 1x zoom</figcaption>
              </figure>
            </li>
          </ul>
        </div>
      },
      {
        title: "Will the app work if the board or the camera move mid-way through?",
        content:
        <p>
          Yes, as long as the whole board stays inside the region.
          If you have not drawn a region, the whole board must stay in shot.
        </p>
      },
      {
        title: "How powerful does my device have to be?",
        content:
        <p>
          The app needs to run at least 1 FPS. 
        </p>
      },
      {
        title: "How do I record?",
        content: 
        <ol>
          <li>
            Click the <b>Record</b> button from the Home page. 
            Alternatively, go straight to <a target="_blank" href="https://www.chesscam.net/record" rel="noreferrer">https://www.chesscam.net/record</a>.
          </li>
          <li>
            Setup your device (see "How do I set up my camera?")
          </li>
          <li>
            Click the <b>Play</b> button to start recording your game.
          </li>
        </ol>,
      },
      {
        title: "How do I upload a game?",
        content:
        <div>
          <ol>
            <li>
              Click the <b>Upload</b> button from the Home page. 
              Alternatively, go straight to <a target="_blank" href="https://www.chesscam.net/upload" rel="noreferrer">https://www.chesscam.net/upload</a>.
            </li>
            <li>
              Setup your device (see "How do I set up my camera?")
            </li>
            <li>
              Click the <b>Play</b> button to start recording your game. 
            </li>
          </ol>
          <p>
            You can adjust the speed to 1x, 2x or 4x, but you must pause the game first.
            It is recommended that you keep the speed at 1x.
          </p>
          <p>
            Click the <b>Restart</b> button to rewind the video and reset the game.
          </p>
        </div>
      },
      {
        title: "How do I play a Lichess game on a real board?",
        content:
        <div>
          <ol>
            <li>
              If you haven't done so already, click <b>Login</b> from the home screen.
            </li>
            <li>
              Start a game on Lichess, then click the <b>Play</b> button from the Home page.
              Alternatively, go straight to <a target="_blank" href="https://www.chesscam.net/play" rel="noreferrer">https://www.chesscam.net/play</a>.
            </li>
            <li>
              Setup your device (see "How do I set up my camera?")
            </li>
            <li>
              Choose your game from <b>Select a Game</b>.
            </li>
            <li>
              Click the <b>Play</b> button to start detecting moves.
            </li>
          </ol>
          <p>
            The moves you make on your board are sent to Lichess.
            Your opponent's moves are shown in the sidebar, so you can play them on your board.
          </p>
          <p>
            Lichess only allows this for Rapid, Classical and Correspondence games.
          </p>
        </div>
      },
      {
        title: "How do I broadcast a game to Lichess?",
        content:
        <div>
          <ol>
            <li>
              If you haven't done so already, click <b>Login</b> from the home screen.
            </li>
            <li>
              Create a broadcast on the Lichess website, if you don't have one already.
            </li>
            <li>
              Click the <b>Broadcast</b> button from the Home page.
              Alternatively, go straight to <a target="_blank" href="https://www.chesscam.net/broadcast" rel="noreferrer">https://www.chesscam.net/broadcast</a>.
            </li>
            <li>
              Setup your device (see "How do I set up my camera?")
            </li>
            <li>
              Choose the broadcast round from <b>Select a Study</b>. Only rounds that you can edit are listed.
            </li>
            <li>
              Enter the board number, from 1 to 64.
            </li>
            <li>
              Click the <b>Play</b> button to start broadcasting.
            </li>
          </ol>
          <p>
            Each move is sent to the broadcast as it is detected.
          </p>
        </div>
      },
      {
        title: "Can I start from a custom position?",
        content:
        <div>
          <p>
            Yes. Before starting, set up the position on your board, then choose an option from the <b>Position</b> dropdown:
          </p>
          <ul>
            <li><b>Standard</b>: the normal starting position.</li>
            <li><b>Detect (White to move)</b>: reads the position from the camera, with White to move.</li>
            <li><b>Detect (Black to move)</b>: reads the position from the camera, with Black to move.</li>
          </ul>
          <p>
            Check the board preview after detecting, as a misread piece will stop later moves from being recognised.
          </p>
        </div>
      },
      {
        title: "What are the labels in the corners of the video?",
        content:
        <p>
          While the app is detecting moves, it labels each corner of the region (or of the whole video, if you have
          not drawn a region) with the square it thinks is there: a1, a8, h1 or h8.
          If the labels are wrong, moves will be misread. This is most likely when the board is at
          about 45 degrees to the camera, so turn the board or the camera until its edges are closer to
          the edges of the video.
        </p>
      },
      {
        title: "How do I save my game?",
        content: 
        <p>
          After you have finished uploading or recording your game,
          copy it to the clipboard by clicking <b>Copy PGN</b>.
        </p>
      },
      {
        title: "How do I export my game to Lichess?",
        content:
        <div>
          This guide assumes that you have already recorded or uploaded a game successfully.
          <ol>
            <li>
              If you haven't done so already, click <b>Login</b> from the home screen.
              After giving ChessCam permissions to the Lichess API you will be redirected back to the Home screen.
            </li>
            <li>
              Click <b>Export</b> in the sidebar, next to <b>Copy PGN</b>.
            </li>
            <li>
              Choose the study that you would like to export your game to. If none are listed then go and create one on the Lichess website.
              Your game will be saved to the study as the current timestamp.
            </li>
          </ol>
        </div>
      },
      {
        title: "Does the app work offline?",
        content:
        <p>
          If you have used the app once with an internet connection, then it will work offline in the future.
          In offline mode, you cannot export your game to Lichess, but you can still copy the PGN.
        </p>
      },
      {
        title: "How are illegal moves handled?",
        content: 
        <p>
          Illegal moves will be ignored by the app.
        </p>
      },
      {
        title: "Are variants supported?",
        content:
        <p>
          Not at the moment.
        </p>
      },
      {
        title: "When I upload a video, is it kept private?",
        content:
        <p>
          When a video is uploaded it is processed locally ensuring full data privacy.
          ChessCam never receives any videos that a user uploads.
        </p>
      },
      {
        title: "What licences cover the board recognition model?",
        content:
        <div>
          <p>
            The model is a ChessQueries model with a DINOv3 encoder from Meta, downloaded from&nbsp;
            <a target="_blank" href="https://huggingface.co/PBatch23888/chessq-chesscam" rel="noreferrer">Hugging Face</a>.
            Its weights are available under both the&nbsp;
            <a target="_blank" href="https://huggingface.co/PBatch23888/chessq-chesscam/blob/main/LICENSE" rel="noreferrer">PolyForm Noncommercial License 1.0.0</a>
            &nbsp;and the&nbsp;
            <a target="_blank" href="https://huggingface.co/PBatch23888/chessq-chesscam/blob/main/LICENSE-DINOv3" rel="noreferrer">DINOv3 License</a>.
            See the&nbsp;
            <a target="_blank" href="https://huggingface.co/PBatch23888/chessq-chesscam/blob/main/NOTICE" rel="noreferrer">NOTICE</a> for details.
          </p>
          <p>
            Required Notice: Copyright (c) 2026 Joël Seytre.
          </p>
        </div>
      },
      {
        title: "How can I get in touch?",
        content:
        <div>
          <p>
            Message me on Lichess:&nbsp;
            <a target="_blank" href="https://lichess.org/@/BlindfoldBlunderer" rel="noreferrer">https://lichess.org/@/BlindfoldBlunderer</a>  
          </p>
          <p>
            I am always happy to chat about any ideas or problems that you might have!
          </p>
        </div>
      }
  ],
};

const FAQ = () => {
  return (
    <div className="faq-page-wrapper bg-dark h-100 overflow-auto text-white">
      <main className="faq-page container py-4">
        <h1 className="h2 mb-4">{data.title}</h1>
        <section className="faq-list" aria-label={data.title}>
          {data.rows.map(({ title, content }) => (
            <details className="faq-item" key={title}>
              <summary className="faq-question">{title}</summary>
              <div className="faq-answer">{content}</div>
            </details>
          ))}
        </section>
        <div className="mt-4">
          <HomeButton />
        </div>
      </main>
    </div>
  );
}

export default FAQ;
