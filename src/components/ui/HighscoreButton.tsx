import styles from "./Timer.module.css";

type HighscoreButtonProps = {
  onClick: () => void;
};

export default function HighscoreButton({ onClick }: HighscoreButtonProps) {
  return (
    <button
      className={styles.timerContainerCompact}
      onClick={onClick}
      aria-label="Open highscore"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        <img
          src="/trophy.svg"
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
        />

        <span
          style={{
            fontSize: "0.8rem",
            color: "white",
            textTransform: "lowercase",
          }}
        >
          highscore
        </span>
      </div>
    </button>
  );
}