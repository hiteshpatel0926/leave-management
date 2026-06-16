import { useState, useEffect } from "react";
import api from "../services/api";

export default function LiveTimer() {
  const [activeSession, setActiveSession] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [totalToday, setTotalToday] = useState(0);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/attendance/today");
      setActiveSession(res.data.activeSession);
      setTotalToday(res.data.totalHoursToday);
      if (res.data.activeSession) {
        const checkInTime = new Date(res.data.activeSession.check_in);
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
    const interval = setInterval(() => {
      if (activeSession) {
        setElapsed(prev => prev + (1 / 3600)); // add 1 second in hours
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession) return null;

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl mb-4">
      <p className="text-sm text-gray-600 dark:text-gray-300">Current session duration</p>
      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
        {Math.floor(elapsed)}h {Math.floor((elapsed % 1) * 60)}m
      </p>
      <p className="text-xs text-gray-500">Total today: {totalToday.toFixed(1)} hours</p>
    </div>
  );
}