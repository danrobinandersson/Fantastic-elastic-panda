import styles from "./PlayButton.module.css";

type PlayButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  cost?: number;
};

export default function PlayButton({
  onClick,
  disabled = false,
  cost = 1,
}: PlayButtonProps) {
  return (
    <button
      className={styles.playButton}
      onClick={onClick}
      disabled={disabled}
      aria-label="Play game"
    >
      <h2 className={styles.title}>Play</h2>
    </button>
  );
}