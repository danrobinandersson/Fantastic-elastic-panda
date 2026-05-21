import styles from "./ResetButton.module.css";

type ResetButtonProps = {
  onClick: () => void;
};

export default function ResetButton({ onClick }: ResetButtonProps) {
  return (
    <button className={styles.resetButton} onClick={onClick} aria-label="Reset face">
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74" />
        <path d="M3 3v5h5" />
      </svg>
      <span>reset</span>
    </button>
  );
}