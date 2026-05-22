import styles from "./Timer.module.css";
import { useGameStore } from "../../store/gameStore";

export default function TopStatus() {
  const coins = useGameStore((s) => s.coins);
  const score = useGameStore((s) => s.score);

  return (
    <div className={styles.timerContainerCompact}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <strong style={{ color: "var(--color-gold-main)" }}>${coins}</strong>
        <div style={{ color: "white", opacity: 0.9 }}>Score: {score ?? "–"}</div>
      </div>
    </div>
  );
}
