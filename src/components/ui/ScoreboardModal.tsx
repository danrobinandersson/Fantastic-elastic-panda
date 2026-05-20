import { useEffect, useState } from "react";
import Button from "./Button";
import Modal from "./Modal";

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
    <Modal onExit={onClose} labelId="scoreboard-title">
      <h2 id="scoreboard-title">Scoreboard</h2>
      <div style={{ marginBottom: "2rem" }}>
        {scores.map((score, index) => (
          <div key={index} style={{ margin: "0.5rem 0", color: "white" }}>
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
