import Modal from "./Modal";
import Button from "./Button";
import { useEffect, useState } from "react";

type GameResultModalProps = {
  score: number | null;
  token: string | null;
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
  token,
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
      const v = Math.round(from + (to - from) * p);
      setDisplayed(v);
      if (p < 1) raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, [score]);

function getFeedbackMessage() {
  if (score === null) return "";

  if (score >= 95) {
    return "LEGENDARY! 5x payout!";
  }

  if (score >= 90) {
    return "Amazing! Double win!";
  }

  if (score >= 85) {
    return "Nice! You got your money back!";
  }

  return "Better luck next time!";
}

  return (
    <Modal onExit={onReturnToTivoli} labelId="game-result-title">
      <h2 id="game-result-title">Time's up!</h2>
      <p>Your score: {displayed ?? "–"}</p>
      <p>{getFeedbackMessage()}</p>
      {token ? (
        <p>You received: <strong>{token}</strong></p>
      ) : (
        <p>Generating reward...</p>
      )}
      <Button onClick={onShowHighScores} variant="secondary">High Scores</Button>
      <Button onClick={onPlayAgain}>Play Again</Button>
  <Button
        onClick={() =>
          window.parent.postMessage({ type: "AMUSEMENT_CLOSE" }, "")
        }
      >
        Back to Loopland
      </Button>
    </Modal>
  );
}