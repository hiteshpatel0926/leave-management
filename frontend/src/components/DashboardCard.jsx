import { motion } from "framer-motion";

const themes = {
  blue: "from-blue-500 to-blue-600",
  amber: "from-amber-500 to-amber-600",
  green: "from-emerald-500 to-emerald-600",
  red: "from-rose-500 to-rose-600",
  purple: "from-purple-500 to-purple-600",
  indigo: "from-indigo-500 to-indigo-600",
};

export default function DashboardCard({ title, value, color = "blue", icon, subtitle }) {
  const gradient = themes[color] || themes.blue;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-card-hover transition-all"
    >
      <div className={`h-1 bg-gradient-to-r ${gradient} group-hover:h-1.5 transition-all duration-300`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </h3>
          <div className={`p-2 rounded-xl bg-gradient-to-r ${gradient} bg-opacity-10 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
            <div className="text-white">{icon}</div>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate ml-2">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}