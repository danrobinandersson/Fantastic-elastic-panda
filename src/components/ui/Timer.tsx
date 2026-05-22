import { useState, useEffect } from "react";
import styles from "./Timer.module.css";

type TimerProps = {
  duration: number;
  isRunning: boolean;
  onComplete: () => void;
  compact?: boolean;
};

export default function Timer({ duration, isRunning, onComplete }: TimerProps) {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    setCount(duration);
  }, [duration, isRunning]);

  useEffect(() => {
    if (!isRunning) return;

    if (count === 0) {
      onComplete();
      return;
    }

    const timeoutId = setTimeout(() => {
      setCount((currentCount) => currentCount - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [count, isRunning, onComplete]);

  if (false) {
    // keep typescript happy for potential future branches
  }

  if ((arguments[0] as any).compact) {
    return (
      <div className={styles.timerContainerCompact}>
        <img
          className={styles.clockIcon}
          src="/clock-icon.svg"
          alt="Timer"
        />

        <h2 className={`${styles.timer} ${count <= 5 ? styles.warning : ""}`}>
          {count}
        </h2>
      </div>
    );
  }

  return (
    <div className={styles.timerContainer}>
      <img
        className={styles.clockIcon}
        src="/clock-icon.svg"
        alt="Timer"
      />

      <h2 className={`${styles.timer} ${count <= 5 ? styles.warning : ""}`}>
        {count}
      </h2>
    </div>
  );
}
