import { useEffect } from "react";
import Button from "./Button";
import styles from "./GameResultModal.module.css";

type GameResultModalProps = {
  score: number | null;
  token: string | null;
  config: {
    doubleWinThreshold: number;
    moneyBackThreshold: number;
  };
  onExit: () => void;
};

export default function GameResultModal({
  score,
  token,
  config,
  onExit,
}: GameResultModalProps) {
  function getFeedbackMessage() {
    if (score === null) return "";

    if (score >= config.doubleWinThreshold) {
      return "Amazing! Double win!";
    }

    if (score >= config.moneyBackThreshold) {
      return "Nice! You got your money back!";
    }

    return "Sorry no win today, better luck next time!";
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onExit();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onExit]);

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-result-title"
      >
        <h2 id="game-result-title">Time’s up!</h2>

        <p>Your score: {score ?? "-"}</p>

        <p>{getFeedbackMessage()}</p>

        {/* Show token if it exists */}
        {token ? (
          <p>
            You received: <strong>{token}</strong>
          </p>
        ) : (
          <p>Generating reward...</p>
        )}

        <Button onClick={onExit}>Exit</Button>
      </div>
    </div>
  );
}
