import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-emerald-500" />,
    error: <XCircleIcon className="h-5 w-5 text-rose-500" />,
    info: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
  };

  const backgrounds = {
    success: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    error: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm ${backgrounds[type]}`}
    >
      {icons[type]}
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{message}</p>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
        <XMarkIcon className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export default Toast;