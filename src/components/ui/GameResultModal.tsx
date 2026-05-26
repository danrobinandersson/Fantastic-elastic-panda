import Modal from "./Modal";
import Button from "./Button";
import { useEffect, useState } from "react";
import styles from "./GameResultModal.module.css";
import { SceneLayout } from "../scene/SceneLayout";
import { TargetPanda } from "../scene/TargetPanda";
import { defaultSceneConfig } from "../../config/sceneConfig";
import type { BlendshapeValues } from "../../types/blendshape";

type Stamp = {
  animal: string | null;
  metal: string | null;
  image_url: string | null;
};

type GameResultModalProps = {
  score: number | null;
  stamp?: Stamp | null;
  isGuestMode?: boolean;
  playerBlendshapes: BlendshapeValues;
  targetBlendshapes: BlendshapeValues;
  config: {
    doubleWinThreshold: number;
    moneyBackThreshold: number;
  };
  onPlayAgain: () => void;
  onReturnToTivoli: () => void;
  onShowHighScores: () => void;
};

export default function GameResultModal({
  score,
  stamp,
  isGuestMode = false,
  playerBlendshapes,
  targetBlendshapes,
  config: _config,
  onPlayAgain,
  onReturnToTivoli,
  onShowHighScores,
}: GameResultModalProps) {
  const [displayed, setDisplayed] = useState<number | null>(null);
  const [miniValues, setMiniValues] = useState<BlendshapeValues>(playerBlendshapes);
  const [showResultInfo, setShowResultInfo] = useState(false);

  useEffect(() => {
    if (score === null) {
      setDisplayed(null);
      setMiniValues(playerBlendshapes);
      setShowResultInfo(false);
      return;
    }

    setDisplayed(null);
    setMiniValues(playerBlendshapes);
    setShowResultInfo(false);

    const duration = 800;
    const start = performance.now();

    let raf = 0;

    function step(t: number) {
      const p = Math.min(1, (t - start) / duration);
      const v = Number(((score ?? 0) * p).toFixed(2));

      setDisplayed(v);

      if (p < 1) {
        raf = requestAnimationFrame(step);
     } else {
  window.setTimeout(() => {
    setMiniValues(targetBlendshapes);

    window.setTimeout(() => {
      setShowResultInfo(true);
    }, 300);
  }, 600);
}
    }

    raf = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf);
  }, [score, playerBlendshapes, targetBlendshapes]);

useEffect(() => {
  if (!showResultInfo) return;

  let showingSolution = true;

  const interval = window.setInterval(() => {
    showingSolution = !showingSolution;

    setMiniValues(
      showingSolution
        ? targetBlendshapes
        : playerBlendshapes
    );
  }, 1000);

  return () => window.clearInterval(interval);
}, [showResultInfo, playerBlendshapes, targetBlendshapes]);



  function getFeedbackMessage() {
    if (score === null) return "";

    if (score >= 95) return "LEGENDARY! 5 coins back!";
    if (score >= 93) return "Fantastic! 4 coins back!";
    if (score >= 90) return "Amazing! 3 coins back!";
    if (score >= 85) return "Nice! 1 coin back!";

    return "Better luck next time!";
  }

  return (
    <Modal onExit={onReturnToTivoli} labelId="game-result-title">
      <div className={styles.contentWrapper}>
        <h2 id="game-result-title" className={styles.title}>
          Time&rsquo;s up!
        </h2>

        <div className={styles.body}>
          <p className={styles.score}>
            {displayed !== null ? displayed.toFixed(2) : "–"}
          </p>

          <div className={styles.solutionPreview}>
            <SceneLayout
              config={defaultSceneConfig}
              background={null}
              cameraOverride={{
                y: defaultSceneConfig.camera.y * 1.0,
                z: defaultSceneConfig.camera.z * 0.7,
              }}
            >
<TargetPanda values={miniValues} />

            </SceneLayout>
          </div>

          <p
            className={`${styles.feedback} ${
              showResultInfo ? styles.feedbackVisible : ""
            }`}
          >
            {getFeedbackMessage()}
          </p>

          {isGuestMode ? (
            <p
              className={`${styles.note} ${
                showResultInfo ? styles.feedbackVisible : ""
              }`}
            >
              Guest mode — no stamps or rewards earned.
            </p>
          ) : (
            stamp?.image_url && (
              <div
                className={`${styles.stampBlock} ${
                  showResultInfo ? styles.feedbackVisible : ""
                }`}
              >
                <p className={styles.note}>You received a stamp!</p>

                <img
                  src={stamp.image_url.replace("http://", "https://")}
                  alt={`${stamp.animal ?? "Mystery"} stamp`}
                  className={styles.stampImg}
                />


              </div>
            )
          )}
        </div>
      </div>

      <div
        className={`${styles.controls} ${
          showResultInfo ? styles.controlsVisible : ""
        }`}
      >
        <div className={styles.buttonRow}>
          <Button onClick={onShowHighScores} variant="secondary">
            High Scores
          </Button>

          <Button onClick={onPlayAgain}>Play Again</Button>

          <Button onClick={onReturnToTivoli} variant="ghost">
            Back to Loopland
          </Button>
        </div>
      </div>
    </Modal>
  );
}