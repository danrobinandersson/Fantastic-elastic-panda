import { HelpCircle, MousePointer2, Hand } from "lucide-react";
import styles from "./ControlsHint.module.css";

type ControlsHintProps = {
  onOpenTutorial: () => void;
  className?: string;
};

export default function ControlsHint({
  onOpenTutorial,
  className = "",
}: ControlsHintProps) {
  const isMobile =
    typeof window !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.hint}>
        {/* <span className={styles.arrow}>←</span> */}

        <div className={styles.icon}>
          {isMobile ? (
            <Hand size={24} strokeWidth={2.5} />
          ) : (
            <MousePointer2 size={24} strokeWidth={2.5} />
          )}
        </div>

        <span className={styles.text}>Drag to match</span>

        {/* <span className={styles.arrow}>→</span> */}
      </div>

      <button
        className={styles.helpButton}
        onClick={onOpenTutorial}
        aria-label="Open tutorial"
      >
        <HelpCircle size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}