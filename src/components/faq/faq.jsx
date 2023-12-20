import Faq from "react-faq-component";
import { HomeButton } from "../common";

const data = {
  title: "FAQ (How it works)",
  rows: [
      {
        title: "Where can I buy a stand?",
        content: 
        <p>
          You can buy a stand for £12.99 at:&nbsp;  
          <a target="_blank" href="https://www.amazon.co.uk/dp/B07NVBXYPJ">https://www.amazon.co.uk/dp/B07NVBXYPJ</a>.
        </p>
      },
      {
        title: "Is there a mobile app?",
        content:
        <p>
          If you have an Android, you can download the free ChessCam app&nbsp;
          <a target="_blank" href="https://play.google.com/store/apps/details?id=com.camerachess.www.twa">here</a>.
          In the future ChessCam plans to be on the App store too.
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
              Make sure that the stand is stable and that the camera can see all 4 corners.
            </li>
            <li>
              If you're using your devices native camera app and have 0.5x zoom available, use it.  
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
          If the camera moves so that the squares are not aligned then the app will break.
          When the corners algorithm is fast and consistent enough the app may support a moving board/camera.
          See <a target="_blank" href="https://www.youtube.com/watch?v=XV8EKqScaKs">https://www.youtube.com/watch?v=XV8EKqScaKs</a> for a brief demo.
        </p>
      },
      {
        title: "How powerful does my device have to be?",
        content:
        <p>
          The app works best if you can achieve at least 4 FPS. 
        </p>
      },
      {
        title: "How do I record?",
        content: 
        <ol>
          <li>
            Click the <b>Record</b> button from the Home page. 
            Alternatively, go straight to <a target="_blank" href="https://www.chesscam.net/record">https://www.chesscam.net/record</a>.
          </li>
          <li>
            Setup your device (see "How do I set up my camera?")
          </li>
          <li>
            Click <b>Find Corners</b> to align the 4 corners with your board.
            If they are not correct, then adjust them manually.
            Clockwise the corners go "h1", "a1", "a8", "h8", starting from the bottom-right corner (relative to White).
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
              Alternatively, go straight to <a target="_blank" href="https://www.chesscam.net/upload">https://www.chesscam.net/upload</a>.
            </li>
            <li>
              Setup your device (see "How do I set up my camera?")
            </li>
            <li>
              Click <b>Find Corners</b> to align the 4 corners with your board.
              If they are not correct, then adjust them manually.
              Clockwise the corners go "h1", "a1", "a8", "h8", starting from the bottom-right corner (relative to White).
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
            You can reset the video by clicking the back button.
          </p>
        </div>
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
              Click <b>Export</b> from the home screen.
            </li>
            <li>
              Choose a study that you would like to export your game to. If none are listed then go and create one on the Lichess website.
            </li>
            <li>
              Click <b>Export Game</b> to save your game to your study. It will be saved as the current timestamp.
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
          There are plans to raise an alert when an illegal move is played.
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
        title: "Can I start recording or uploading from a game mid-way through?",
        content:
        <p>
          The app needs the game to begin from the starting position.
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
        title: "How can I get in touch?",
        content:
        <div>
          <p>
            Message me on Lichess:&nbsp;
            <a target="_blank" href="https://lichess.org/@/BlindfoldBlunderer">https://lichess.org/@/BlindfoldBlunderer</a>  
          </p>
          <p>
            I am always happy to chat about any ideas or problems that you might have!
          </p>
        </div>
      }
  ],
};

const styles = {
  bgColor: '#212529',
  titleTextColor: "white",
  rowTitleColor: "white",
  rowContentColor: "white",
  arrowColor: "white",
};

const FAQ = () => {
  return (
    <div className="bg-dark h-100 text-white justify-content-center">
      <Faq
        data={data}
        styles={styles}
      />
      <HomeButton />
    </div>
  );
}

export default FAQ;