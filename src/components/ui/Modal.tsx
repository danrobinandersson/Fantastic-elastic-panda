import { useEffect } from "react";
import styles from "./Modal.module.css";

type ModalProps = {
  onExit: () => void;
  labelId?: string;
  children: React.ReactNode;
};

export default function Modal({ onExit, labelId, children }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

return (
  <div className={styles.backdrop} onClick={onExit}>
    <div
      className={styles.modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src="/Modal_BG.webp"
        className={styles.bg}
        alt=""
      />

      {children}
    </div>
  </div>
);
}