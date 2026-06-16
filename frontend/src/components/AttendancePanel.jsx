import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

export default function AttendancePanel({ onUpdate, initialTotal }) {
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [totalToday, setTotalToday] = useState(initialTotal || 0);
  const [elapsed, setElapsed] = useState(0);
  const [dailyGoal] = useState(8);
  const { showToast } = useToast();
  const activeSessionRef = useRef(activeSession);
  const intervalRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/attendance/today");
      const newActive = res.data.activeSession;
      setActiveSession(newActive);
      const newTotal = res.data.totalHoursToday || 0;
      setTotalToday(newTotal);
      if (onUpdate) onUpdate(newTotal);
      if (newActive) {
        const checkInTime = new Date(newActive.check_in);
        const now = new Date();
        const diff = (now - checkInTime) / (1000 * 60 * 60);
        setElapsed(parseFloat(diff.toFixed(2)));
      } else {
        setElapsed(0);
      }
    } catch (err) {
      console.error("Failed to fetch attendance status", err);
    }
  };

  // Fetch on mount only
  useEffect(() => {
    fetchStatus();
  }, []); // <-- empty dependency array

  // Timer interval: update elapsed every second only if activeSession exists
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (activeSessionRef.current) {
        setElapsed((prev) => prev + 1 / 3600);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []); // <-- empty dependency array

  const handleCheckIn = async () => {
    if (activeSession) {
      showToast("You already have an active session. Please check out first.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/attendance/check-in");
      showToast(res.data.message, "success");
      await fetchStatus(); // refresh after check-in
    } catch (err) {
      showToast(err.response?.data?.message || "Check-in failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeSession) {
      showToast("No active session to check out.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/attendance/check-out");
      showToast(res.data.message, "success");
      await fetchStatus();
    } catch (err) {
      showToast(err.response?.data?.message || "Check-out failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // ... (formatElapsed, progressPercent, getProgressColor unchanged)
  const formatElapsed = (hours) => {
    const hrs = Math.floor(hours);
    const mins = Math.floor((hours % 1) * 60);
    return `${hrs}h ${mins}m`;
  };

  const progressPercent = Math.min((totalToday / dailyGoal) * 100, 100);
  const getProgressColor = () => {
    if (totalToday >= dailyGoal) return "stroke-green-500";
    if (totalToday >= dailyGoal * 0.75) return "stroke-blue-500";
    if (totalToday >= dailyGoal * 0.5) return "stroke-yellow-500";
    return "stroke-gray-400";
  };

  // Return JSX (same as before)
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/30 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
              Today's Progress
            </p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
              {totalToday.toFixed(1)} <span className="text-lg text-gray-500">/ {dailyGoal} hrs</span>
            </p>
            {activeSession && (
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Current session: <span className="font-mono font-bold">{formatElapsed(elapsed)}</span>
                </p>
              </div>
            )}
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-gray-200 dark:text-gray-700 stroke-current" strokeWidth="8" fill="transparent" r="42" cx="50" cy="50" />
              <circle
                className={`${getProgressColor()} transition-all duration-500 ease-out stroke-current`}
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                r="42"
                cx="50"
                cy="50"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-800 dark:text-white">{Math.round(progressPercent)}%</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCheckIn}
              disabled={loading || !!activeSession}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : <>🟢 Check In</>}
            </button>
            <button
              onClick={handleCheckOut}
              disabled={loading || !activeSession}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : <>🔴 Check Out</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}