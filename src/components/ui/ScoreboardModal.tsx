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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScores() {
      try {
        const response = await fetch(`${SCOREBOARD_API_URL}/scores`);
        if (!response.ok) throw new Error("Failed to load scores");
        const data = await response.json();
        setScores(data);
      } catch (error) {
        console.error("Could not load scoreboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadScores();
  }, []);

  return (
    <Modal onExit={onClose} labelId="scoreboard-title">

      {/* Title — reuses Modal.module.css h2 styles */}
      <h2 id="scoreboard-title">Scoreboard</h2>

      {/* ── Score list ── */}
      <div className={styles.listWrapper}>
        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : scores.length === 0 ? (
          <p className={styles.empty}>No scores yet. Be the first!</p>
        ) : (
          scores.slice(0, 10).map((entry, index) => (
            <div key={entry.centralbank_user_id} className={styles.scoreRow}>
              <span className={styles.rank}>{index + 1}</span>
              <span className={styles.name}>{entry.player_name}</span>
              <span className={styles.score}>{Number(entry.score).toFixed(2)}</span>
            </div>
          ))
        )}
      </div>

      {/* ── Controls ── */}
      <div className={styles.controls}>
        <Button onClick={onClose}>Close</Button>
      </div>

    </Modal>
  );
}
