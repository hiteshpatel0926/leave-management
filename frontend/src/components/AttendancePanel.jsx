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

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (activeSessionRef.current) {
        setElapsed((prev) => prev + 1 / 3600);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleCheckIn = async () => {
    if (activeSession) {
      showToast("You already have an active session. Please check out first.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/attendance/check-in");
      showToast(res.data.message, "success");
      await fetchStatus();
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

  const formatElapsed = (hours) => {
    const hrs = Math.floor(hours);
    const mins = Math.floor((hours % 1) * 60);
    return `${hrs}h ${mins}m`;
  };

  const progressPercent = Math.min((totalToday / dailyGoal) * 100, 100);
  const isFull = totalToday >= dailyGoal;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5 md:p-6 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        {/* Left: Progress info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <span className="text-indigo-600 dark:text-indigo-400 text-lg font-semibold">
                {totalToday.toFixed(1)}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Today's Progress
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{totalToday.toFixed(1)}</span> of {dailyGoal} hrs
              </p>
            </div>
          </div>

          {/* Horizontal progress bar */}
          <div className="mt-3 w-full">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isFull ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              <span>0 hrs</span>
              <span>{Math.round(progressPercent)}%</span>
              <span>{dailyGoal} hrs</span>
            </div>
          </div>

          {activeSession && (
            <div className="mt-3 flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Current session: <strong className="font-mono text-gray-900 dark:text-white">{formatElapsed(elapsed)}</strong></span>
            </div>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-shrink-0">
          <button
            onClick={handleCheckIn}
            disabled={loading || !!activeSession}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 min-w-[120px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Processing...
              </span>
            ) : (
              <>🟢 Check In</>
            )}
          </button>
          <button
            onClick={handleCheckOut}
            disabled={loading || !activeSession}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 min-w-[120px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Processing...
              </span>
            ) : (
              <>🔴 Check Out</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}