import Modal from "./Modal";
import Button from "./Button";
import { useEffect, useState } from "react";
import styles from "./GameResultModal.module.css";

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
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (score === null) {
      setDisplayed(null);
      setAnimDone(false);
      return;
    }

    setAnimDone(false);

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
      } else {
        setAnimDone(true);
      }
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  function getFeedbackMessage() {
    if (score === null) return "";
if (score >= 95) return "LEGENDARY! 5 coins back!";
if (score >= 93) return "Fantastic! 4 coins back!";
if (score >= 90) return "Amazing! 3 coins back!";
if (score >= 85) return "Nice! 1 coin back!";

return "Better luck next time!";
  }

  return (
    <Modal onExit={onReturnToTivoli} labelId="game-result-title">

      <div className={styles.contentWrapper}>
        <h2 id="game-result-title" className={styles.title}>Time&rsquo;s up!</h2>

        <div className={styles.body}>
          <p className={styles.score}>
            {displayed !== null ? displayed.toFixed(2) : "–"}
          </p>

          <p className={`${styles.feedback} ${animDone ? styles.feedbackVisible : ""}`}>
            {getFeedbackMessage()}
          </p>

          {isGuestMode ? (
            <p className={`${styles.note} ${animDone ? styles.feedbackVisible : ""}`}>
              Guest mode — no stamps or rewards earned.
            </p>
          ) : (
            stamp?.image_url && (
              <div className={`${styles.stampBlock} ${animDone ? styles.feedbackVisible : ""}`}>
                <p className={styles.note}>You received a stamp!</p>

                <img
                  src={stamp.image_url.replace("http://", "https://")}
                  alt={`${stamp.animal ?? "Mystery"} stamp`}
                  className={styles.stampImg}
                />

                <p className={styles.stampLabel}>
                  {stamp.animal && <span>{stamp.animal}</span>}
                  {stamp.metal && <span> · {stamp.metal}</span>}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.buttonRow}>
          <Button onClick={onShowHighScores} variant="secondary">
            High Scores
          </Button>
          <Button onClick={onPlayAgain}>
            Play Again
          </Button>
          <Button onClick={onReturnToTivoli} variant="ghost">
            Back to Loopland
          </Button>
        </div>
      </div>

    </Modal>
  );
}
