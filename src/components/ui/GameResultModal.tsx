import Modal from "./Modal";
import Button from "./Button";
import { useEffect, useState } from "react";

type Stamp = {
  animal: string | null;
  metal: string | null;
  image_url: string | null;
};

type GameResultModalProps = {
  score: number | null;
  stamp?: Stamp | null;
  isGuestMode?: boolean;
  config: {
    doubleWinThreshold: number;
    moneyBackThreshold: number;
  };
  onPlayAgain: () => void;
  onReturnToTivoli: () => void;
  onShowHighScores: () => void;
};

export default function GameResultModal({
  score,
  stamp,
  isGuestMode = false,
  config: _config,
  onPlayAgain,
  onReturnToTivoli,
  onShowHighScores,
}: GameResultModalProps) {
  const [displayed, setDisplayed] = useState<number | null>(null);

  useEffect(() => {
    if (score === null) {
      setDisplayed(null);
      return;
    }

    const duration = 800;
    const start = performance.now();
    const from = 0;
    const to = score;

    let raf = 0;

    function step(t: number) {
      const p = Math.min(1, (t - start) / duration);
      const v = Number((from + (to - from) * p).toFixed(2));

      setDisplayed(v);

      if (p < 1) {
        raf = requestAnimationFrame(step);
      }
    }

    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, [score]);

  function getFeedbackMessage() {
    if (score === null) return "";

    if (score >= 95) return "LEGENDARY! 5x payout!";
    if (score >= 90) return "Amazing! Double win!";
    if (score >= 85) return "Nice! You got your money back!";

    return "Better luck next time!";
  }

  return (
    <Modal onExit={onReturnToTivoli} labelId="game-result-title">
      <h2 id="game-result-title">Time's up!</h2>

      <p>Your score: {displayed !== null ? displayed.toFixed(2) : "–"}</p>

      <p>{getFeedbackMessage()}</p>

      {isGuestMode ? (
        <p>Guest mode — no stamps or rewards earned.</p>
      ) : (
        <>

          {stamp?.image_url && (
            <div>
              <p>You received a stamp!</p>

              <img
                src={stamp.image_url}
                alt={`${stamp.animal ?? "Mystery"} stamp`}
                style={{
                  borderRadius: "50%",
                  width: "100px",
                  height: "100px",
                  objectFit: "contain",
                }}
              />

              <p>
                {stamp.animal && <span>{stamp.animal}</span>}
                {stamp.metal && <span> · {stamp.metal}</span>}
              </p>
            </div>
          )}
        </>
      )}

      <Button onClick={onShowHighScores} variant="secondary">
        High Scores
      </Button>

      <Button onClick={onPlayAgain}>Play Again</Button>

      <Button onClick={onReturnToTivoli}>Back to Loopland</Button>
    </Modal>
  );
}