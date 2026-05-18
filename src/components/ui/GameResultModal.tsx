import Modal from "./Modal";
import Button from "./Button";

type GameResultModalProps = {
  score: number | null;
  token: string | null;
  config: {
    doubleWinThreshold: number;
    moneyBackThreshold: number;
  };
  onExit: () => void;
  onShowHighScores: () => void;
};

export default function GameResultModal({
  score,
  token,
  config,
  onExit,
  onShowHighScores,
}: GameResultModalProps) {
  function getFeedbackMessage() {
    if (score === null) return "";
    if (score >= config.doubleWinThreshold) return "Amazing! Double win!";
    if (score >= config.moneyBackThreshold) return "Nice! You got your money back!";
    return "Better luck next time!";
  }

  return (
    <Modal onExit={onExit} labelId="game-result-title">
      <h2 id="game-result-title">Time's up!</h2>
      <p>Your score: {score ?? "–"}</p>
      <p>{getFeedbackMessage()}</p>
      {token ? (
        <p>You received: <strong>{token}</strong></p>
      ) : (
        <p>Generating reward...</p>
      )}
      <div className="button-row">
        <Button onClick={onExit}>Exit</Button>
        <Button onClick={onShowHighScores} variant="secondary">High Scores</Button>
      </div>
    </Modal>
  );
}