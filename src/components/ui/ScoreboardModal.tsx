import { useState, useEffect } from "react";
import Button from "./Button";
import Modal from "./Modal";
import styles from "./ScoreboardModal.module.css";

type Score = {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
};

type ScoreboardModalProps = {
  onClose: () => void;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function ScoreboardModal({ onClose }: ScoreboardModalProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScores() {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/scores?select=id,player_name,score,created_at&order=score.desc&limit=10`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to load scores:", response.status, errorData);
          throw new Error("Failed to load scores");
        }

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
      <h2 id="scoreboard-title">Scoreboard</h2>

      <div className={styles.listWrapper}>
        {loading ? (
          <p className={styles.empty}>Loading…</p>
        ) : scores.length === 0 ? (
          <p className={styles.empty}>No scores yet. Be the first!</p>
        ) : (
          scores.map((entry, index) => (
            <div key={entry.id} className={styles.scoreRow}>
              <span className={styles.rank}>{index + 1}</span>
              <span className={styles.name}>{entry.player_name}</span>
              <span className={styles.score}>
                {Number(entry.score).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className={styles.controls}>
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}