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

      <div className={styles.costRow}>
        <p className={styles.costText}>costs: {cost}</p>

        <svg
          className={styles.coinIcon}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <circle
            cx="12"
            cy="12"
            r="6"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </button>
  );
}