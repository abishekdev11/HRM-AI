import { useEffect, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";
import { endWorkBreak, getWorkProgress, startWorkBreak } from "../api/chatbot";

const DAILY_TARGET_MS = 8 * 60 * 60 * 1000;

function formatWorkTime(milliseconds) {
  const totalMinutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function WorkProgress() {
  const [progress, setProgress] = useState(null);
  const [receivedAt, setReceivedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const updateProgress = (data) => {
    setProgress(data);
    setReceivedAt(Date.now());
    setNow(Date.now());
  };

  const loadProgress = async () => {
    try {
      const response = await getWorkProgress();
      if (response.success) updateProgress(response.data);
      setError("");
    } catch (loadError) {
      console.error("Error loading work progress:", loadError);
      setError("Progress unavailable");
    }
  };

  useEffect(() => {
    loadProgress();
    const clockInterval = window.setInterval(() => setNow(Date.now()), 1000);
    const refreshInterval = window.setInterval(loadProgress, 60000);
    return () => {
      window.clearInterval(clockInterval);
      window.clearInterval(refreshInterval);
    };
  }, []);

  const handleBreak = async () => {
    setBusy(true);
    setError("");
    try {
      const response = progress.isOnBreak
        ? await endWorkBreak()
        : await startWorkBreak("Break");
      if (response.success) updateProgress(response.data);
    } catch (breakError) {
      console.error("Error updating break:", breakError);
      setError(breakError.response?.data?.message || "Could not update break");
    } finally {
      setBusy(false);
    }
  };

  const earnedMilliseconds = progress
    ? progress.workedMilliseconds + (
      progress.isActive && !progress.isOnBreak
        ? Math.max(0, now - receivedAt)
        : 0
    )
    : 0;
  const cappedMilliseconds = Math.min(earnedMilliseconds, DAILY_TARGET_MS);
  const percent = Math.min(100, (cappedMilliseconds / DAILY_TARGET_MS) * 100);
  const isComplete = cappedMilliseconds >= DAILY_TARGET_MS;
  const status = error || (
    progress?.isOnBreak
      ? `On break: ${progress.breakReason}`
      : isComplete
        ? "8 hours complete"
        : progress?.isActive
          ? "Work time"
          : "Log in to start tracking"
  );

  return (
    <div className="border-t border-slate-200/80 bg-white/90 px-6 py-2.5 lg:px-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-700">Daily work progress</span>
            <span className="shrink-0 tabular-nums text-slate-600">
              {formatWorkTime(cappedMilliseconds)} / 08:00
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Daily work progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.floor(percent)}
            className="h-2 overflow-hidden rounded-full bg-slate-200"
          >
            <div
              className="h-full rounded-full bg-teal-600 transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500" aria-live="polite">{status}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {progress?.isActive && !isComplete && (
            <button
              type="button"
              onClick={handleBreak}
              disabled={busy}
              className="inline-flex h-9 items-center gap-2 rounded bg-slate-900 px-3 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {progress.isOnBreak ? <FaPlay size={12} /> : <FaPause size={12} />}
              {busy ? "Updating..." : progress.isOnBreak ? "End break" : "Start break"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkProgress;