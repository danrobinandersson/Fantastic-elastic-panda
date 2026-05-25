import { useState, useEffect } from "react";
import Button from "./Button";
import Modal from "./Modal";
import styles from "./TutorialModal.module.css";

type TutorialModalProps = {
  onClose: () => void;
};

const SLIDES = [
  {
    title: "Welcome",
    content:
    <p>Match the target panda’s expression before time runs out. You have one chance per round — try to get as close as possible!</p>
  },
  {
      title: "Controls",
    content: (
      <>
        <p>
          Drag the panda’s face using your finger or mouse to match the target
          expression.
        </p>

        <video
          id="tutorial-control"
          autoPlay
          muted
          playsInline
          loop
          className={styles.video}
        >
          <source src="/tutorial_control.webm" type="video/webm" />
        </video>
      </>
    ),
  },
  {
    title: "Scoring",
    content:
    <><p></p>
      <p>The closer your match, the higher your score. Higher scores gives better rewards.</p>
      <br></br>
        <p>85 gives you your money back.</p>
        <p>90 doubles your payout.</p>
        <p>95 gives you 5x payout!</p>
    </>
  },
  {
    title: "Good luck",
    content: 
    <>
    <p>Press Play when you're ready. Have fun and try to top the scoreboard!</p>
    <br></br>
    <p>Best of luck! / Tim & Robin</p>
  </>
  },
];

export default function TutorialModal({ onClose }: TutorialModalProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(SLIDES.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <Modal onExit={onClose}>

      <div className={styles.slidesWrapper}>
        <div
          className={styles.track}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((s, i) => (
            <div key={i} className={styles.slide}>
              <h3 className={styles.title}>{s.title}</h3>
              <div className={styles.content}>{s.content}</div>
            </div>
          ))}
        </div>
      </div>

<div className={styles.controls}>
  <div className={styles.navRow}>
    <Button
      variant="secondary"
      onClick={() => {
        setIndex((i) => Math.max(0, i - 1));
      }}
    >
      &lt;&lt;
    </Button>

    <div className={styles.pager}>
      {SLIDES.map((_, i) => (
        <div
          key={i}
          className={`${styles.dot} ${i === index ? " " + styles.active : ""}`}
        />
      ))}
    </div>

    <Button
      variant="secondary"
      onClick={() => {
        if (index === SLIDES.length - 1) onClose();
        else setIndex((i) => i + 1);
      }}
    >
      {index === SLIDES.length - 1 ? "Done" : ">>"}
    </Button>
  </div>

  <Button onClick={onClose} variant="ghost">
    Skip
  </Button>
</div>
    </Modal>
  );
}
