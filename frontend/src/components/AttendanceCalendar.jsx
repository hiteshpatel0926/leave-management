import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext"; // <-- import theme

export default function AttendanceCalendar({ refreshTrigger }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { darkMode } = useTheme(); // <-- get darkMode state
  const abortControllerRef = useRef(null);
  const fetchingRef = useRef(false);

  const fetchAttendance = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const response = await api.get("/attendance/my", {
        signal: controller.signal,
      });
      setEvents(response.data);
    } catch (error) {
      if (error.name === "CanceledError" || error.code === "ERR_CANCELED") {
        console.log("Request was cancelled");
        return;
      }
      console.error("Failed to fetch attendance:", error);
      showToast("Failed to load attendance records", "error");
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchAttendance();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refreshTrigger, darkMode]); // <-- re-fetch when theme changes

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth",
        }}
        eventClick={(info) => {
          const { extendedProps } = info.event;
          alert(
            `📅 ${info.event.start?.toLocaleDateString()}\n` +
            `⏱️ Total Hours: ${extendedProps.totalHours || 0}\n` +
            `Status: ${extendedProps.status || "—"}`
          );
        }}
        dayMaxEvents={true}
        weekends={true}
        locale="en"
      />
    </div>
  );
}