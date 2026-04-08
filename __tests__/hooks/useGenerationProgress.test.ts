import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";

describe("useGenerationProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with progress=0 and an empty label", () => {
    const { result } = renderHook(() => useGenerationProgress(false));

    expect(result.current.progress).toBe(0);
    expect(result.current.progressLabel).toBe("");
  });

  it("does not advance progress when loading is false", () => {
    const { result } = renderHook(() => useGenerationProgress(false));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.progress).toBe(0);
    expect(result.current.progressLabel).toBe("");
  });

  it("advances progress past 0 once loading becomes true", () => {
    const { result, rerender } = renderHook(
      ({ loading }: { loading: boolean }) => useGenerationProgress(loading),
      { initialProps: { loading: false } }
    );

    rerender({ loading: true });

    act(() => {
      // First stage ticks every 80 ms, target is 12 — advance enough to reach it
      vi.advanceTimersByTime(80 * 15);
    });

    expect(result.current.progress).toBeGreaterThan(0);
  });

  it("sets the label to the first stage text when ticking begins", () => {
    const { result } = renderHook(() => useGenerationProgress(true));

    act(() => {
      vi.advanceTimersByTime(80);
    });

    expect(result.current.progressLabel).toBe("Loading context…");
  });

  it("advances to later stages as time passes", () => {
    const { result } = renderHook(() => useGenerationProgress(true));

    act(() => {
      // Stage 1: 12 ticks × 80ms = 960ms  → target 12%
      // Stage 2: 23 ticks × 120ms = 2760ms → target 35%
      vi.advanceTimersByTime(80 * 12 + 120 * 25);
    });

    expect(result.current.progress).toBeGreaterThanOrEqual(35);
  });

  describe("completeProgress", () => {
    it("immediately sets progress to 100", () => {
      const { result } = renderHook(() => useGenerationProgress(true));

      act(() => {
        result.current.completeProgress();
      });

      expect(result.current.progress).toBe(100);
    });

    it("sets the label to 'Done'", () => {
      const { result } = renderHook(() => useGenerationProgress(true));

      act(() => {
        result.current.completeProgress();
      });

      expect(result.current.progressLabel).toBe("Done");
    });

    it("stops further progress increments after completion", () => {
      const { result } = renderHook(() => useGenerationProgress(true));

      act(() => {
        result.current.completeProgress();
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.progress).toBe(100);
    });
  });

  describe("resetProgress", () => {
    it("sets progress back to 0", () => {
      const { result } = renderHook(() => useGenerationProgress(true));

      act(() => {
        vi.advanceTimersByTime(80 * 5);
        result.current.resetProgress();
      });

      expect(result.current.progress).toBe(0);
    });

    it("clears the label", () => {
      const { result } = renderHook(() => useGenerationProgress(true));

      act(() => {
        vi.advanceTimersByTime(80 * 5);
        result.current.resetProgress();
      });

      expect(result.current.progressLabel).toBe("");
    });
  });
});
