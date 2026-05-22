import styles from "./Timer.module.css";

type HighscoreButtonProps = {
  onClick: () => void;
};

export default function HighscoreButton({ onClick }: HighscoreButtonProps) {
  return (
    <button className={styles.highscoreButton} onClick={onClick} aria-label="Open highscore">
      <img src="/trophy.svg" className={styles.icon} alt="" aria-hidden="true" />
      <span>highscore</span>
    </button>
  );
}