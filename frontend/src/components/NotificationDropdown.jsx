// frontend/src/components/NotificationDropdown.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext"; // Import AuthContext

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("notification_sound_enabled");
    return saved !== null ? saved === "true" : true;
  });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const socket = useSocket();
  const { user: currentUser } = useAuth(); // get current user from context

  // Play notification sound using Web Audio API (gentle "pop")
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.value = 0.2; // quiet
      oscillator.type = "sine";
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
      oscillator.stop(audioContext.currentTime + 0.5);
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
    } catch (err) {
      const audio = new Audio("data:audio/wav;base64,U3RlYWx0aCBzb3VuZA==");
      audio.play().catch((e) => console.log("Audio play failed", e));
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      if (isOpen) {
        fetchNotifications();
      }
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      playNotificationSound();
    };
    socket.on("new_notification", handleNewNotification);
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, soundEnabled]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Role-based navigation handler
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    const currentUserRole = currentUser?.role;
    const currentUserEmployeeId = currentUser?.employeeId;

    // 1. COMP_OFF_AWARDED
    if (notification.type === "COMP_OFF_AWARDED") {
      const awardedEmployeeId = notification.related_id; // stored employeeId
      if (currentUserEmployeeId && awardedEmployeeId === currentUserEmployeeId) {
        navigate("/leave-balance"); // employee sees own balance
      } else if (currentUserRole === "MANAGER" || currentUserRole === "ADMIN") {
        navigate("/manager/leave-balances"); // manager/admin sees team balances page
      } else {
        navigate("/leave-balance"); // fallback
      }
      setIsOpen(false);
      return;
    }

    // 2. LEAVE_SUBMITTED (only managers/admins receive this)
    if (notification.type === "LEAVE_SUBMITTED") {
      navigate("/pending-leaves");
      setIsOpen(false);
      return;
    }

    // 3. LEAVE_APPROVED, LEAVE_REJECTED, LEAVE_CANCELLED
    if (["LEAVE_APPROVED", "LEAVE_REJECTED", "LEAVE_CANCELLED"].includes(notification.type)) {
      navigate("/Dashboard");
      setIsOpen(false);
      return;
    }

    // 4. Default fallback
    navigate("/dashboard");
    setIsOpen(false);
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem("notification_sound_enabled", newState);
  };

  const getIcon = (type) => {
    if (type.includes("approved")) return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    if (type.includes("rejected")) return <XCircleIcon className="h-5 w-5 text-red-500" />;
    return <ClockIcon className="h-5 w-5 text-blue-500" />;
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/80 dark:bg-gray-900/50">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSound}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
                >
                  {soundEnabled ? (
                    <SpeakerWaveIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <SpeakerXMarkIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      !notification.is_read ? "bg-indigo-50/50 dark:bg-indigo-900/20" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}