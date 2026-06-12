import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { motion } from "framer-motion";
import { CalendarIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import "../styles/calendar.css"; // your custom styles

// Helper to map status to Tailwind color class (for tooltip or custom rendering)
const getStatusColor = (status) => {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "PENDING":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "REJECTED":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function TeamCalendar() {
  const [events, setEvents] = useState([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await api.get("/calendar/events");
      const today = new Date();
      today.setHours(0, 0, 0, 0); // normalize to start of day

      // Transform and compute upcoming count
      const formattedEvents = response.data.map((leave) => {
        const startDate = new Date(leave.start_date);
        startDate.setHours(0, 0, 0, 0);
        return {
          id: leave.id,
          title: `${leave.first_name} ${leave.last_name} (${leave.leave_type})`,
          start: leave.start_date,
          end: leave.end_date,
          allDay: true,
          extendedProps: {
            status: leave.status,
            days: leave.total_days,
            employeeCode: leave.employee_code,
          },
          backgroundColor:
            leave.status === "APPROVED"
              ? "#10b981"
              : leave.status === "PENDING"
                ? "#f59e0b"
                : leave.status === "REJECTED"
                  ? "#ef4444"
                  : "#6b7280",
          borderColor: "#ffffff",
        };
      });

      // Count upcoming leaves (start date >= today)
      const upcoming = formattedEvents.filter((event) => {
        const start = new Date(event.start);
        start.setHours(0, 0, 0, 0);
        return start >= today;
      }).length;

      setEvents(formattedEvents);
      setUpcomingCount(upcoming);
    } catch (error) {
      console.error(error);
      showToast("Failed to load calendar events", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary-100 animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 max-w-7xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-2xl text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Leave Calendar
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Visual overview of team leaves – month, week, or day view
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700">
          <UserGroupIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">
            {upcomingCount} upcoming {upcomingCount === 1 ? "leave" : "leaves"}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-card shadow-card border border-gray-100 dark:border-gray-700 p-4">
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          initialView="dayGridMonth"
          editable={false}
          selectable={false}
          events={events}
          height="auto"
          eventDisplay="block"
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          eventDidMount={(info) => {
            const { extendedProps } = info.event;
            info.el.setAttribute(
              "title",
              `${info.event.title} (${extendedProps.status}) - ${extendedProps.days} days`,
            );
          }}
          dayMaxEvents={true}
          weekends={true}
          nowIndicator={true}
          locale="en"
          // ----- Working hours restriction (day/week view only) -----
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5], // Monday–Friday
            startTime: "09:00",
            endTime: "17:00",
          }}
          slotMinTime="09:00:00"   // earliest time shown
          slotMaxTime="17:00:00"   // latest time shown
          allDaySlot={false}       // hide all‑day slot (all leaves are full‑day)
        />
      </div>
    </motion.div>
  );
}