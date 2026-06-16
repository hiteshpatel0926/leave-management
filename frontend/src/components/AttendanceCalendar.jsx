import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import Swal from 'sweetalert2';
import "../styles/calendar.css"; 

export default function AttendanceCalendar({ refreshTrigger }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { darkMode } = useTheme();
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
  }, [refreshTrigger, darkMode]);

  const handleEventClick = (info) => {
    const { extendedProps } = info.event;
    const date = info.event.start;
    const formattedDate = date
      ? date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
      : 'Unknown date';
    const hours = extendedProps.totalHours || 0;
    const statusMap = {
      'PRESENT': 'Present',
      'HALF_DAY': 'Half Day',
      'ABSENT': 'Absent',
      'LATE': 'Late'
    };
    const statusLabel = statusMap[extendedProps.status] || extendedProps.status || '—';
    const statusColorClass = 
      extendedProps.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
      extendedProps.status === 'HALF_DAY' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
      extendedProps.status === 'ABSENT' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    const icon = 
      extendedProps.status === 'PRESENT' ? 'success' :
      extendedProps.status === 'HALF_DAY' ? 'warning' :
      extendedProps.status === 'ABSENT' ? 'error' : 'info';

    Swal.fire({
      title: `📅 ${formattedDate}`,
      html: `
        <div class="text-left">
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-1"><strong>Total Hours:</strong> ${hours.toFixed(1)} hrs</p>
          <p class="text-sm text-gray-600 dark:text-gray-300"><strong>Status:</strong> 
            <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColorClass}">${statusLabel}</span>
          </p>
        </div>
      `,
      icon: icon,
      confirmButtonColor: '#6366f1',
      confirmButtonText: 'Close',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 transition-all">
      <FullCalendar
        key={darkMode ? 'dark' : 'light'}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth",
        }}
        eventClick={handleEventClick}
        dayMaxEvents={true}
        weekends={true}
        locale="en"
      />
    </div>
  );
}