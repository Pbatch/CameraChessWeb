import { formatShortScore, winningChances } from "../../engine/stockfish";
import { useEngineAnalysis } from "../../slices/engineSlice";

// Stockfish's eval beside the video: White fills from the bottom on Lichess's winning-chances curve, and the
// score sits at the end of the side that is ahead. It holds the last eval while the next position is analysed.
const EvalGauge = () => {
  const analysis = useEngineAnalysis();
  const chances = (analysis === null) ? 0 : winningChances(analysis.score, analysis.fen);
  const whiteAhead = chances >= 0;

  return (
    <div className={`eval-gauge${analysis === null ? " eval-gauge--empty" : ""}`} aria-hidden="true">
      <div className="eval-gauge__white" style={{ height: `${(chances + 1) * 50}%` }} />
      <div className="eval-gauge__midline" />
      {analysis !== null && (
        <span className={`eval-gauge__score eval-gauge__score--${whiteAhead ? "white" : "black"}`}>
          {formatShortScore(analysis.score)}
        </span>
      )}
    </div>
  );
};

export default EvalGauge;
