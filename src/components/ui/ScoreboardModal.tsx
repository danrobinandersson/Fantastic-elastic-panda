import { useEffect, useState } from "react";
import Button from "./Button";
import styles from "./ScoreboardModal.module.css";

type Score = {
  player_name: string;
  score: number;
  token: string | null;
  created_at: string;
};

type ScoreboardModalProps = {
  onClose: () => void;
};

export default function ScoreboardModal({ onClose }: ScoreboardModalProps) {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    async function loadScores() {
      const response = await fetch("http://localhost:3001/scores");
      const data = await response.json();
      setScores(data);
    }

    loadScores();
  }, []);

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2>Scoreboard</h2>

        {scores.map((score, index) => (
          <div key={index}>
            <strong>
              {index + 1}. {score.player_name}
            </strong>{" "}
            — {score.score}
          </div>
        ))}

        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
