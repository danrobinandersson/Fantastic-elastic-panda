import {
  HelpCircle,
  MousePointer2,
  Pointer,
} from "lucide-react";

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

  const Icon = isMobile ? Pointer : MousePointer2;

  return (
    <div className={`${styles.hint} ${className}`}>
      <div className={styles.svgWrapper}>
        {/* LEFT SPACER */}
        <div className={styles.sideSpacer} />

        {/* CENTER */}
        <div className={styles.centerIcons}>
          <span className={styles.arrow}>←</span>

          <Icon
            className={styles.pointer}
            strokeWidth={2.5}
          />

          <span className={styles.arrow}>→</span>
        </div>

        {/* RIGHT */}
        <button
          className={styles.helpButton}
          onClick={onOpenTutorial}
          aria-label="Open tutorial"
        >
          <HelpCircle strokeWidth={2} />
        </button>
      </div>

      <p className={styles.text}>
        Drag the face using your{" "}
        {isMobile ? "finger" : "mouse cursor"}
      </p>
    </div>
  );
}