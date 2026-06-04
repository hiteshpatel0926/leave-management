import { motion } from "framer-motion";

const themes = {
  blue: "from-blue-500 to-blue-600",
  amber: "from-amber-500 to-amber-600",
  green: "from-green-500 to-green-600",
  red: "from-red-500 to-red-600",
  purple: "from-purple-500 to-purple-600",
};

export default function DashboardCard({ title, value, color = "blue", icon, subtitle }) {
  const gradient = themes[color] || themes.blue;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </h3>
          <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} bg-opacity-10`}>
            <div className="text-white">{icon}</div>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}