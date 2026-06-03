import styles from "./PlayButton.module.css";

type PlayButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export default function PlayButton({
  onClick,
  disabled = false,
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