import Modal from "./Modal";
import Button from "./Button";
import { useEffect, useState } from "react";
import styles from "./GameResultModal.module.css";
import { SceneLayout } from "../scene/SceneLayout";
import { TargetPanda } from "../scene/TargetPanda";
import { defaultSceneConfig } from "../../config/sceneConfig";
import type { BlendshapeValues } from "../../types/blendshape";

type GameResultModalProps = {
  score: number | null;
  playerBlendshapes: BlendshapeValues;
  targetBlendshapes: BlendshapeValues;
  onPlayAgain: () => void;
  onShowHighScores: () => void;
  onSaveScore: (playerName: string) => Promise<void>;
};

export default function GameResultModal({
  score,
  playerBlendshapes,
  targetBlendshapes,
  onPlayAgain,
  onShowHighScores,
  onSaveScore,
}: GameResultModalProps) {
  const [displayed, setDisplayed] = useState<number | null>(null);
  const [miniValues, setMiniValues] = useState<BlendshapeValues>(playerBlendshapes);
  const [showResultInfo, setShowResultInfo] = useState(false);

  /* Leaderboard submission state */
  const [playerName, setPlayerName] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  /* ── Animated score counter ── */
  useEffect(() => {
    if (score === null) {
      setDisplayed(null);
      setMiniValues(playerBlendshapes);
      setShowResultInfo(false);
      setSubmitState("idle");
      setPlayerName("");
      return;
    }

    setDisplayed(null);
    setMiniValues(playerBlendshapes);
    setShowResultInfo(false);
    setSubmitState("idle");
    setPlayerName("");

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
          window.setTimeout(() => setShowResultInfo(true), 300);
        }, 600);
      }
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score, playerBlendshapes, targetBlendshapes]);

  /* ── Alternating preview: player ↔ target ── */
  useEffect(() => {
    if (!showResultInfo) return;

    let showingSolution = true;

    const interval = window.setInterval(() => {
      showingSolution = !showingSolution;
      setMiniValues(showingSolution ? targetBlendshapes : playerBlendshapes);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [showResultInfo, playerBlendshapes, targetBlendshapes]);

  /* ── Feedback label ── */
  function getFeedbackMessage() {
    if (score === null) return "";
    if (score >= 95) return "Legendary!";
    if (score >= 90) return "Amazing!";
    if (score >= 85) return "Great job!";
    if (score >= 75) return "Not bad!";
    return "Better luck next time!";
  }

  /* ── Submit handler ── */
  async function handleSubmit() {
    const trimmed = playerName.trim();
    if (!trimmed || submitState !== "idle") return;

    setSubmitState("saving");
    try {
      await onSaveScore(trimmed);
      setSubmitState("saved");
    } catch {
      setSubmitState("error");
    }
  }

  return (
    <Modal onExit={() => {/* parent controls close */}} labelId="game-result-title">
      <div className={styles.contentWrapper}>
        <h2 id="game-result-title" className={styles.title}>
          Time&rsquo;s up!
        </h2>

        <div className={styles.body}>
          {/* Animated score */}
          <p className={styles.score}>
            {displayed !== null ? displayed.toFixed(2) : "–"}
          </p>

          {/* Panda preview */}
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

          {/* Feedback */}
          <p
            className={`${styles.feedback} ${
              showResultInfo ? styles.feedbackVisible : ""
            }`}
          >
            {getFeedbackMessage()}
          </p>

          {/* ── Leaderboard submission ── */}
          <div
            className={`${styles.submitBlock} ${
              showResultInfo ? styles.feedbackVisible : ""
            }`}
          >
            {submitState === "saved" ? (
              <p className={styles.savedConfirm}>Score posted ✓</p>
            ) : (
              <>
                <p className={styles.submitLabel}>Post to leaderboard?</p>
                <div className={styles.submitRow}>
                  <input
                    className={styles.nameInput}
                    type="text"
                    placeholder="Your name"
                    maxLength={32}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmit();
                    }}
                    disabled={submitState === "saving"}
                    aria-label="Enter your name for the leaderboard"
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={!playerName.trim() || submitState === "saving"}
                  >
                    {submitState === "saving" ? "Posting…" : "Post"}
                  </Button>
                </div>
                {submitState === "error" && (
                  <p className={styles.submitError}>
                    Could not post score. Try again?
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
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
        </div>
      </div>
    </Modal>
  );
}
