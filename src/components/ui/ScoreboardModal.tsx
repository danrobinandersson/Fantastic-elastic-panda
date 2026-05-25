import { useState, useEffect } from "react";
import Button from "./Button";
import Modal from "./Modal";
import styles from "./ScoreboardModal.module.css";

type Score = {
  centralbank_user_id: string;
  player_name: string;
  score: number;
  created_at: string;
};

type ScoreboardModalProps = {
  onClose: () => void;
};

const SCOREBOARD_API_URL = import.meta.env.VITE_SCOREBOARD_API_URL;

export default function ScoreboardModal({ onClose }: ScoreboardModalProps) {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    async function loadScores() {
      try {
        const response = await fetch(`${SCOREBOARD_API_URL}/scores`);

        if (!response.ok) {
          throw new Error("Failed to load scores");
        }

        const data = await response.json();
        setScores(data);
      } catch (error) {
        console.error("Could not load scoreboard:", error);
      }
    }

    loadScores();
  }, []);

  return (
    <Modal onExit={onClose} labelId="scoreboard-title">
      <h2 id="scoreboard-title">Scoreboard</h2>

      <div style={{ marginBottom: "2rem" }}>
        {scores.map((score, index) => (
          <div key={score.centralbank_user_id} className={styles.scoreRow}>
            <strong>
              {index + 1}. {score.player_name}
            </strong>{" "}
            — {score.score}
          </div>
        ))}
      </div>

      <Button onClick={onClose}>Close</Button>
    </Modal>
  );
}
