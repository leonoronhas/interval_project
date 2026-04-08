import { useState, useEffect, useRef, useCallback } from "react";

// Simulated stages: [targetPct, labelText, stepMs]
const STAGES: [number, string, number][] = [
  [12, "Loading context…", 80],
  [35, "Composing message…", 120],
  [65, "Generating with AI…", 200],
  [88, "Verifying policy…", 180],
  [95, "Finalizing…", 300],
];

export const useGenerationProgress = (loading: boolean) => {
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading) {
      return;
    }

    let currentStage = 0;
    let currentPct = 0;

    const tick = () => {
      const [target, label] = STAGES[currentStage];
      setProgressLabel(label);

      if (currentPct < target) {
        currentPct = Math.min(currentPct + 1, target);
        setProgress(currentPct);
      }

      if (currentPct >= target && currentStage < STAGES.length - 1) {
        currentStage++;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(tick, STAGES[currentStage][2]);
      }
    };

    intervalRef.current = setInterval(tick, STAGES[currentStage][2]);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loading]);

  const completeProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setProgress(100);
    setProgressLabel("Done");
  }, []);

  const resetProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setProgress(0);
    setProgressLabel("");
  }, []);

  return { progress, progressLabel, completeProgress, resetProgress };
};
